import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('userName') || 'Remote User';
  const wsRef = useRef(null);

  const [liveFeed, setLiveFeed] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [mainPoints, setMainPoints] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [summary, setSummary] = useState('');
  const [authStatus, setAuthStatus] = useState('pending'); 

  useEffect(() => {
    const HOST = window.location.hostname; 

    fetch(`http://${HOST}:8000/meetings/1/action_items`)
      .then(response => response.json())
      .then(data => {
        const savedTasks = data.filter(i => i.text.startsWith('[TASK]')).map(item => item.text.replace('[TASK]', '').trim());
        const savedPoints = data.filter(i => i.text.startsWith('[POINT]')).map(item => item.text.replace('[POINT]', '').trim());
        setActionItems(savedTasks);
        setMainPoints(savedPoints);
      })
      .catch(error => console.error("Error fetching tasks:", error));

    const ws = new WebSocket(`ws://${HOST}:8000/ws/meeting/1`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`[AGENT_REQUEST]: ${userName}`);
    };

    ws.onmessage = (event) => {
      const message = event.data;

      if (message.startsWith('[AGENT_ACCEPTED]:')) {
        const approvedName = message.replace('[AGENT_ACCEPTED]:', '').trim();
        if (approvedName.toLowerCase() === userName.toLowerCase()) setAuthStatus('accepted');
        return;
      }
      
      if (message.startsWith('[AGENT_REJECTED]:')) {
        const rejectedName = message.replace('[AGENT_REJECTED]:', '').trim();
        if (rejectedName.toLowerCase() === userName.toLowerCase()) setAuthStatus('rejected');
        return;
      }

      if (message === '[END_MEETING]') {
        alert("The Host has ended the meeting.");
        navigate('/');
        return;
      }

      // 🌟 THE FIX: Block duplicate array items from rendering
      if (message.includes('[ACTION ITEM EXTRACTED]:')) {
        const item = message.replace('📝 [ACTION ITEM EXTRACTED]:', '').trim();
        setActionItems(prev => prev.includes(item) ? prev : [...prev, item]);
      } else if (message.includes('💡 [MAIN POINT EXTRACTED]:')) {
        const point = message.replace('💡 [MAIN POINT EXTRACTED]:', '').trim();
        setMainPoints(prev => prev.includes(point) ? prev : [...prev, point]);
      } 
      else if (message.includes('[RESPONSE REQUIRED]:')) {
        const questionText = message.replace('⚠️ [RESPONSE REQUIRED]:', '').trim();
        if (questionText.toLowerCase().includes(userName.toLowerCase())) {
          setPendingQuestion(questionText);
        }
      } 
      else if (message.includes('[TRANSCRIPT]:') || message.includes('AI Logged Chat:') || message.includes('🤖 Remote User Replied:')) {
        let cleanText = message;
        if (message.includes('[TRANSCRIPT]:')) cleanText = message.replace('[TRANSCRIPT]:', '').trim();
        else if (message.includes('AI Logged Chat:')) cleanText = message.replace('🤖 AI Logged Chat:', '').trim();
        
        setLiveFeed(prev => {
          if (prev[prev.length - 1] === cleanText) return prev;
          return [...prev, cleanText];
        });
      } 
    };

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [userName, navigate]);

  const handleSendReply = () => {
    if (wsRef.current && replyText.trim() !== '') {
      wsRef.current.send(`[REMOTE REPLY]: ${userName}: ${replyText}`);
      setPendingQuestion(null);
      setReplyText('');
    }
  };

  const handleGenerateSummary = () => {
    const HOST = window.location.hostname;
    fetch(`http://${HOST}:8000/meetings/1/summary`)
      .then(response => response.json())
      .then(data => setSummary(data.summary))
      .catch(error => console.error("Error fetching summary:", error));
  };

  if (authStatus === 'pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
        <style>
          {`
            @keyframes pulse-ring {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          `}
        </style>
        <h2>🤖 Sending your AI Agent...</h2>
        <p style={{ color: '#94a3b8', marginTop: '10px' }}>Waiting for the Host to admit your agent into the meeting.</p>
        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 30px', border: '2px solid #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '30px', color: '#3b82f6', fontWeight: 'bold', fontSize: '16px', animation: 'pulse-ring 2s infinite' }}>
          <span style={{ fontSize: '20px' }}>⏳</span> Waiting for Host...
        </div>
      </div>
    );
  }

  if (authStatus === 'rejected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1e1e2f', color: 'white', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#dc3545' }}>❌ Host Rejected</h2>
        <p style={{ color: '#aaa', marginTop: '10px' }}>The Host declined your AI agent's request to join this meeting.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Return Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh', color: '#333' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}>
        ← Back to Home
      </button>

      <h2>👤 Remote Dashboard: {userName}</h2>
      <p style={{ color: '#666' }}>Monitoring Live Meeting: <strong>Room 1</strong></p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', height: '50vh' }}>
        <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Live Meeting Feed</h3>
          {liveFeed.length === 0 ? <p style={{ color: '#aaa' }}>Waiting for meeting to start...</p> : null}
          {liveFeed.map((text, index) => <p key={index} style={{ fontSize: '15px', lineHeight: '1.5' }}>{text}</p>)}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ flex: 1, background: '#fff9e6', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px', color: '#856404' }}>📝 Action Items</h3>
            <ul style={{ paddingLeft: '20px', color: '#856404', margin: 0 }}>
              {actionItems.map((item, index) => <li key={index} style={{ marginBottom: '10px' }}>{item}</li>)}
            </ul>
          </div>
          
          <div style={{ flex: 1, background: '#e8f4f8', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #cce5ff', paddingBottom: '10px', color: '#004085' }}>💡 Main Points</h3>
            <ul style={{ paddingLeft: '20px', color: '#004085', margin: 0 }}>
              {mainPoints.map((item, index) => <li key={index} style={{ marginBottom: '10px' }}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>📊 AI Meeting Summary</h3>
          <button onClick={handleGenerateSummary} style={{ padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✨ Generate Live Summary
          </button>
        </div>
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
          {summary ? summary : "Click the button to generate a real-time AI overview of the meeting's progress."}
        </p>
      </div>

      {pendingQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#dc3545', marginTop: 0 }}>⚠️ Response Required</h2>
            <p style={{ fontSize: '16px', color: '#555' }}>The host specifically asked you a question:</p>
            <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', color: '#721c24', fontStyle: 'italic', marginBottom: '20px' }}>"{pendingQuestion}"</div>
            <textarea placeholder="Type your reply to the meeting here..." value={replyText} onChange={(e) => setReplyText(e.target.value)} style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '15px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setPendingQuestion(null)} style={{ padding: '10px 20px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Dismiss</button>
              <button onClick={handleSendReply} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>Send Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}