# AI Meeting Agent 🤖

> A full-stack, real-time video conferencing platform with an intelligent AI Meeting Agent designed to attend meetings on behalf of absent participants.

## 📌 Overview

**AI Meeting Agent** is a full-stack real-time video conferencing platform built with **React.js** and **FastAPI**. It enables users to host and join online meetings with real-time video, audio, chat, and AI-powered meeting assistance.

The AI Meeting Agent can act as a representative for users who are unable to attend a meeting. After receiving approval from the meeting host, the agent joins the meeting, monitors the conversation, generates live transcriptions, identifies key discussion points and action items, and provides meeting summaries.

The platform also enables remote users to respond when they are directly addressed during a meeting. The user receives the question through their dashboard, can review or edit an AI-suggested response, and send the response back to the meeting.

---

## 🚀 Key Features

### 🎥 Real-Time Video & Audio

* Peer-to-peer video and audio communication using **WebRTC**.
* Dynamic video meeting interface.
* Supports real-time participant communication.

### 📝 Live AI Transcription

* Converts spoken conversation into text using the **Web Speech API**.
* Displays meeting conversation in real time.
* Helps maintain an ongoing record of the discussion.

### 🤖 AI Meeting Agent

* Allows an absent participant to request an AI agent to attend a meeting.
* The meeting host can **approve or reject** the agent's entry.
* The agent participates on behalf of the absent user.

### 📋 Action Items & Key Points

* Identifies important discussion points from the meeting.
* Extracts actionable tasks and responsibilities.
* Presents important information in a dedicated dashboard.

### 🧠 Real-Time Meeting Summarization

* Generates an overview of the ongoing meeting.
* Helps users quickly understand what has been discussed.
* Reduces the need to review the entire conversation manually.

### 💬 Remote User Interaction

* Detects when a question is directed toward an absent participant.
* Sends the question to the user's dashboard.
* Provides an AI-suggested response.
* Allows the user to:

  * **Approve & Send**
  * **Edit Response**
  * **Respond Later**
* Sends the final response through the meeting chat.

### 🔒 Meeting-End Handling

* Prevents responses from being sent after the meeting has ended.
* Displays an appropriate meeting-ended notification to the user.

---

## 🔄 How It Works

```text
User Creates / Joins Meeting
            │
            ▼
      Meeting Starts
            │
            ▼
Absent User Requests AI Agent
            │
            ▼
      Host Approval
        ┌───┴───┐
        │       │
      Accept   Reject
        │       │
        ▼       ▼
   AI Agent    Request
    Joins      Denied
        │
        ▼
Real-Time Video + Audio
        │
        ▼
Live Speech Transcription
        │
        ▼
AI Processes Conversation
        │
   ┌────┼──────────────┐
   ▼    ▼              ▼
Key   Action        Meeting
Points Items       Summary
   │    │              │
   └────┴──────┬───────┘
               ▼
      Question Directed
       to Absent User
               │
               ▼
       User Dashboard
               │
               ▼
     AI Suggested Response
               │
        ┌──────┼──────┐
        ▼      ▼      ▼
     Approve  Edit  Respond
      & Send  Reply   Later
        │
        ▼
  Meeting Chat Response
```

---

## 🛠️ Technology Stack

### Frontend

* **React.js** — User interface and application logic
* **WebRTC** — Real-time peer-to-peer video and audio communication
* **Web Speech API** — Speech-to-text transcription
* **HTML5 / CSS3** — Responsive user interface
* **JavaScript** — Client-side functionality

### Backend

* **Python** — Backend programming language
* **FastAPI** — REST API and application backend
* **WebSockets** — Real-time, bidirectional communication
* **Database Layer** — Meeting and application data management

---

## 📁 Project Structure

```text
ai-meeting-agent/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   └── venv/              # Local virtual environment
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── models.py
├── .gitignore
└── README.md
```

> **Note:** The `backend/venv/` directory is a local Python virtual environment and is intentionally excluded from Git.

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

* **Python 3.8+**
* **Node.js**
* **npm**
* **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Manohar2525k/ai-meeting-agent.git
cd ai-meeting-agent
```

---

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the required backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn main:app --reload
```

---

### 3. Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install the required Node.js dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL displayed in the terminal.

---

## 🔐 Environment Variables

Sensitive configuration values should be stored in environment variables rather than directly in the source code.

Create a `.env` file when required:

```env
# Example
API_KEY=your_api_key
DATABASE_URL=your_database_url
```

> Never commit API keys, passwords, tokens, or other sensitive credentials to GitHub.

---

## 💡 Use Case

The AI Meeting Agent can be useful in situations where a participant cannot attend an important meeting.

For example:

> A team member is unable to attend a project meeting. Instead of completely missing the discussion, they request an AI Meeting Agent. After the host approves the request, the agent attends the meeting, captures the discussion, identifies action items, and provides a summary. If the team asks the absent member a question, the user receives the question remotely and can send a response through the meeting chat.

---

## 🎯 Project Objectives

* Enable real-time online meetings with video, audio, and chat.
* Provide AI-assisted meeting participation.
* Help absent participants stay informed about meetings.
* Automatically identify important discussion points and action items.
* Provide real-time meeting summaries.
* Enable remote interaction without requiring the absent participant to join manually.

---

## 🔮 Future Enhancements

Potential future improvements include:

* AI-powered speaker identification
* Improved meeting summarization
* Automatic task assignment and deadlines
* Meeting history and searchable transcripts
* User authentication and role-based access
* Calendar and meeting scheduling integration
* Cloud deployment
* Support for multiple AI models
* Advanced analytics and meeting insights

---

## 📌 Project Status

**Status:** Completed Prototype

The project demonstrates the integration of **real-time video conferencing, WebRTC, WebSockets, speech transcription, AI-assisted meeting processing, and remote user interaction** in a single platform.

---

## 👨‍💻 Developed By

**Manohar Kella**

B.Tech — Computer Science and Engineering

---

## ⭐ Contributing

Contributions, suggestions, and improvements are welcome.

If you would like to contribute:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

---

## 📄 License

This project is developed for educational and prototype purposes.
