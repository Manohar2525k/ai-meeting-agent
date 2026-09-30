import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MeetingRoom from './MeetingRoom';
import Dashboard from './Dashboard';

function RoleSelection() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>AI Meeting Platform</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Select your portal to continue</p>
      
      <div style={{ display: 'flex', gap: '30px' }}>
        <div 
          onClick={() => navigate('/host-login')}
          style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', cursor: 'pointer', width: '250px', textAlign: 'center', border: '2px solid #334155', transition: '0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
        >
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎥</div>
          <h2>Host Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Conduct a meeting and manage AI access.</p>
        </div>

        <div 
          onClick={() => navigate('/user-login')}
          style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', cursor: 'pointer', width: '250px', textAlign: 'center', border: '2px solid #334155', transition: '0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
        >
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>👤</div>
          <h2>User Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>View active meetings and dispatch agents.</p>
        </div>
      </div>
    </div>
  );
}

function HostLogin() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  const handleStartMeeting = () => {
    if (!userName.trim()) { alert("Please enter your name first!"); return; }
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('role', 'host');
    navigate('/meeting/1'); 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '350px', textAlign: 'center', border: '1px solid #334155' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎥</div>
        <h2 style={{ margin: '0 0 5px 0' }}>Host Login</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Create and manage a new meeting</p>
        <input 
          type="text" placeholder="Enter your name (e.g. Abhi)" 
          value={userName} onChange={(e) => setUserName(e.target.value)}
          style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '20px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
        />
        <button onClick={handleStartMeeting} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          Start Meeting
        </button>
      </div>
    </div>
  );
}

function UserLogin() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  const handleLogin = () => {
    if (!userName.trim()) { alert("Please enter your name first!"); return; }
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('role', 'participant');
    navigate('/user-hub');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '350px', textAlign: 'center', border: '1px solid #334155' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>👤</div>
        <h2 style={{ margin: '0 0 5px 0' }}>User Login</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Access your personalized dashboard</p>
        <input 
          type="text" placeholder="Enter your name (e.g. Rajesh)" 
          value={userName} onChange={(e) => setUserName(e.target.value)}
          style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '20px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
        />
        <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          Enter Hub
        </button>
      </div>
    </div>
  );
}

function UserHub() {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('userName') || 'User';

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Welcome, {userName}!</h1>
          <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Your personalized meeting dashboard</p>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: '#1e293b', border: '1px solid #475569', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Sign Out</button>
      </div>

      <h2>Active Meetings</h2>
      
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px' }}>
        <div>
          <div style={{ display: 'inline-block', background: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
            🔴 LIVE NOW
          </div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Project Review (Room 1)</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>Status: Meeting in progress. Attendance or Agent required.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => navigate('/meeting/1')} 
            style={{ padding: '12px 24px', background: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Join Personally
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> Send AI Agent
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/host-login" element={<HostLogin />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-hub" element={<UserHub />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meeting/:id" element={<MeetingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}