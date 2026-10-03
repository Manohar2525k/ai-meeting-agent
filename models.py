from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String)
    meeting_code = Column(String)

    # Links meetings to their action items
    action_items = relationship("ActionItem", back_populates="meeting")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    text = Column(String)

    # Links the action item back to the meeting
    meeting = relationship("Meeting", back_populates="action_items")