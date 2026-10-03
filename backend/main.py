from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import models
from database import engine, get_db, SessionLocal
import json

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Meeting Representative")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, meeting_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)
    def disconnect(self, websocket: WebSocket, meeting_id: int):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].remove(websocket)
    async def broadcast(self, message: str, meeting_id: int):
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.on_event("startup")
def seed_database():
    db = next(get_db())
    if not db.query(models.Meeting).first():
        new_meeting = models.Meeting(title="Project Review", status="Live", meeting_code="PR-101")
        db.add(new_meeting)
        db.commit()
    db.close()

@app.get("/meetings/{meeting_id}/action_items")
def get_action_items(meeting_id: int, db: Session = Depends(get_db)):
    return db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).all()

@app.get("/meetings/{meeting_id}/summary")
def generate_summary(meeting_id: int, db: Session = Depends(get_db)):
    items = db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).all()
    if not items:
        return {"summary": "The meeting is active. No major action items or decisions have been recorded yet."}
    
    tasks = [i.text.replace("[TASK]", "").strip() for i in items if "[TASK]" in i.text]
    points = [i.text.replace("[POINT]", "").strip() for i in items if "[POINT]" in i.text]
    
    summary_text = "📊 Live Meeting Status:\n\n"
    if points:
        summary_text += "💡 Key Takeaways & Decisions:\n" + "\n".join([f"- {p}" for p in points]) + "\n\n"
    if tasks:
        summary_text += "📝 Action Items & To-Dos:\n" + "\n".join([f"- {t}" for t in tasks]) + "\n\n"
        
    summary_text += "The remote AI agent is actively monitoring the room."
    return {"summary": summary_text}

@app.delete("/meetings/{meeting_id}/clear")
def clear_meeting_data(meeting_id: int, db: Session = Depends(get_db)):
    db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).delete()
    db.commit()
    return {"status": "cleared"}

@app.websocket("/ws/meeting/{meeting_id}")
async def ai_meeting_agent(websocket: WebSocket, meeting_id: int):
    await manager.connect(websocket, meeting_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "[END_MEETING]":
                await manager.broadcast("[END_MEETING]", meeting_id)
                break 
            
            elif data.startswith("[AGENT_REQUEST]:") or data.startswith("[AGENT_ACCEPTED]:") or data.startswith("[AGENT_REJECTED]:"):
                await manager.broadcast(data, meeting_id)
            
            elif data.startswith("[USER_JOINED]:"):
                await manager.broadcast(data, meeting_id)
                
            elif data.startswith("[WEBRTC_SIGNAL]:"):
                await manager.broadcast(data, meeting_id)
                
            elif data.startswith("[CAMERA_TOGGLE]:"):
                await manager.broadcast(data, meeting_id)
            
            elif data.startswith("[TRANSCRIPT]:") or data.startswith("[CHAT]:"):
                is_chat = data.startswith("[CHAT]:")
                
                if is_chat:
                    raw_text = data.replace("[CHAT]:", "").strip()
                    await manager.broadcast(f"🤖 AI Logged Chat: {raw_text}", meeting_id)
                else:
                    raw_text = data.replace("[TRANSCRIPT]:", "").strip()
                    await manager.broadcast(f"[TRANSCRIPT]: {raw_text}", meeting_id)
                
                sentence_lower = raw_text.split(":", 1)[1].lower().strip() if ":" in raw_text else raw_text.lower().strip()
                
                if any(word in sentence_lower for word in ["task", "todo", "to do", "assign", "need to"]):
                    db = SessionLocal()
                    db.add(models.ActionItem(meeting_id=meeting_id, text=f"[TASK] {sentence_lower}"))
                    db.commit()
                    db.close()
                    await manager.broadcast(f"📝 [ACTION ITEM EXTRACTED]: {sentence_lower}", meeting_id)
                
                elif any(word in sentence_lower for word in ["important", "decide", "agree", "main point", "takeaway", "note"]):
                    db = SessionLocal()
                    db.add(models.ActionItem(meeting_id=meeting_id, text=f"[POINT] {sentence_lower}"))
                    db.commit()
                    db.close()
                    await manager.broadcast(f"💡 [MAIN POINT EXTRACTED]: {sentence_lower}", meeting_id)
                
                question_keywords = ["?", "what", "how", "can you", "explain", "what about", "why", "where", "are you", "do you", "will you", "could you", "would you"]
                if any(word in sentence_lower for word in question_keywords):
                    await manager.broadcast(f"⚠️ [RESPONSE REQUIRED]: {raw_text}", meeting_id)
            
            elif data.startswith("[REMOTE REPLY]:"):
                reply_msg = data.replace("[REMOTE REPLY]:", "").strip()
                await manager.broadcast(f"🤖 Remote User Replied: {reply_msg}", meeting_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)