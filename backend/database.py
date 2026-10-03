from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ IMPORTANT: Replace 'YOUR_PASSWORD' with your actual pgAdmin password!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:down@localhost:5432/ai_meeting_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()