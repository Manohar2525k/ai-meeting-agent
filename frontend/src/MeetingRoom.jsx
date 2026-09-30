import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('userName') || 'Guest';
  const userRole = sessionStorage.getItem('role') || 'participant'; 

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const peersRef = useRef({}); 
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(true); 

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [pendingAgents, setPendingAgents] = useState([]); 
  
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteVideoStatus, setRemoteVideoStatus] = useState({}); 

  const activeParticipants = [userName, ...Object.keys(remoteStreams)];

  // 🌟 THE FIX: Master deduplication helper for messages
  const addMessage = (newSender, newText) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.sender === newSender && lastMsg.text === newText) return prev;
      return [...prev, { sender: newSender, text: newText }];
    });
  };

  useEffect(() => {
    let activeStream = null;
    let activeWs = null;
    let activeRecognition = null;
    const HOST = window.location.hostname;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        activeStream = mediaStream;
        streamRef.current = mediaStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
        
        const ws = new WebSocket(`ws://${HOST}:8000/ws/meeting/${id}`);
        activeWs = ws;
        wsRef.current = ws;

        ws.onopen = () => ws.send(`[USER_JOINED]: ${userName}`);

        ws.onmessage = async (event) => {
          const message = event.data;
          
          if (message === 'System: A user joined the room.') return; 

          if (message.startsWith('[USER_JOINED]:')) {
            const newUser = message.replace('[USER_JOINED]:', '').trim();
            if (newUser !== userName) {
              addMessage('System', `${newUser} joined the room.`);
              createPeerConnection(newUser, mediaStream, true);
            }
            return;
          }

          if (message.startsWith('[WEBRTC_SIGNAL]:')) {
            const signal = JSON.parse(message.replace('[WEBRTC_SIGNAL]:', '').trim());
            if (signal.target !== userName) return; 
            await handleWebRTCSignal(signal, mediaStream);
            return;
          }

          if (message.startsWith('[CAMERA_TOGGLE]:')) {
            const toggleData = message.replace('[CAMERA_TOGGLE]:', '').trim();
            const splitIndex = toggleData.indexOf(':');
            if (splitIndex !== -1) {
              const targetUser = toggleData.substring(0, splitIndex).trim();
              const state = toggleData.substring(splitIndex + 1).trim();
              setRemoteVideoStatus(prev => ({ ...prev, [targetUser]: state === 'true' }));
            }
            return;
          }

          // 🌟 THE FIX: Blocks duplicate agent requests from showing up twice
          if (message.startsWith('[AGENT_REQUEST]:')) {
            const requestingUser = message.replace('[AGENT_REQUEST]:', '').trim();
            setPendingAgents(prev => {
              if (prev.includes(requestingUser)) return prev;
              return [...prev, requestingUser];
            });
            return;
          }
          
          if (message.startsWith('System:')) return; 
          if (message.includes('⚠️ [RESPONSE REQUIRED]:')) return; 
          if (message.includes('📝 [ACTION ITEM EXTRACTED]:')) return; 
          if (message.includes('💡 [MAIN POINT EXTRACTED]:')) return; 

          if (message.startsWith('🤖 Remote User Replied:')) {
            const rawReply = message.replace('🤖 Remote User Replied:', '').trim();
            const splitIndex = rawReply.indexOf(':');
            if (splitIndex !== -1) {
              addMessage(`🤖 ${rawReply.substring(0, splitIndex).trim()}`, rawReply.substring(splitIndex + 1).trim());
            } else {
              addMessage('🤖 AI Agent', rawReply);
            }
            return;
          }

          if (message.startsWith('🤖 AI Logged Chat:')) {
            const fullChat = message.replace('🤖 AI Logged Chat:', '').trim();
            if (fullChat.startsWith(`${userName}:`)) return; 
            
            const splitIndex = fullChat.indexOf(':');
            if (splitIndex !== -1) {
              addMessage(`⌨️ ${fullChat.substring(0, splitIndex).trim()}`, fullChat.substring(splitIndex + 1).trim());
            }
            return;
          }

          if (message.startsWith('[TRANSCRIPT]:')) {
            const fullTranscript = message.replace('[TRANSCRIPT]:', '').trim();
            if (fullTranscript.startsWith(`${userName}:`)) return; 
            
            const splitIndex = fullTranscript.indexOf(':');
            if (splitIndex !== -1) {
              addMessage(`🗣️ ${fullTranscript.substring(0, splitIndex).trim()}`, fullTranscript.substring(splitIndex + 1).trim());
            }
            return;
          }
        };

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript && ws.readyState === WebSocket.OPEN) {
              addMessage(`🗣️ ${userName}`, transcript);
              ws.send(`[TRANSCRIPT]: ${userName}: ${transcript}`);
            }
          };
          recognition.onend = () => { if (isListeningRef.current) setTimeout(() => { try { recognition.start(); } catch(e) {} }, 250); };
          activeRecognition = recognition;
          recognitionRef.current = recognition;
          recognition.start();
        }
      })
      .catch((err) => console.error("Error accessing camera:", err));

    return () => {
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
      if (activeWs) activeWs.close();
      if (activeRecognition) activeRecognition.stop();
      Object.values(peersRef.current).forEach(pc => pc.close());
      isListeningRef.current = false; 
    };
  }, [id, userName]);

  const createPeerConnection = async (targetUser, localStream, isInitiator) => {
    if (peersRef.current[targetUser]) return peersRef.current[targetUser];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetUser] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [targetUser]: event.streams[0] }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(`[WEBRTC_SIGNAL]: ${JSON.stringify({ target: targetUser, sender: userName, type: 'ice-candidate', candidate: event.candidate })}`);
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current.send(`[WEBRTC_SIGNAL]: ${JSON.stringify({ target: targetUser, sender: userName, type: 'offer', sdp: pc.localDescription })}`);
    }

    return pc;
  };

  const handleWebRTCSignal = async (signal, localStream) => {
    const { sender, type, sdp, candidate } = signal;
    let pc = peersRef.current[sender];

    if (!pc && (type === 'offer' || type === 'answer')) {
      pc = await createPeerConnection(sender, localStream, false);
    }

    if (type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsRef.current.send(`[WEBRTC_SIGNAL]: ${JSON.stringify({ target: sender, sender: userName, type: 'answer', sdp: pc.localDescription })}`);
    } else if (type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } else if (type === 'ice-candidate' && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) { 
        track.enabled = !track.enabled; 
        setIsVideoOn(track.enabled); 
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(`[CAMERA_TOGGLE]: ${userName}: ${track.enabled}`);
        }
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioOn(track.enabled);
        isListeningRef.current = track.enabled; 
        if (track.enabled && recognitionRef.current) { try { recognitionRef.current.start(); } catch(e) {} } 
        else if (!track.enabled && recognitionRef.current) { recognitionRef.current.stop(); }
      }
    }
  };

  const handleSendMessage = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      addMessage(`⌨️ ${userName}`, inputValue);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(`[CHAT]: ${userName}: ${inputValue}`);
      }
      setInputValue('');
    }
  };

  const handleEndMeeting = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send("[END_MEETING]");
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    const HOST = window.location.hostname;
    fetch(`http://${HOST}:8000/meetings/${id}/clear`, { method: 'DELETE' }).then(() => navigate('/'));
  };

  const handleAgentDecision = (agentName, isAccepted) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(isAccepted ? `[AGENT_ACCEPTED]: ${agentName}` : `[AGENT_REJECTED]: ${agentName}`);
      addMessage('System', `You ${isAccepted ? 'accepted' : 'rejected'} the AI Agent for ${agentName}.`);
    }
    setPendingAgents(prev => prev.filter(name => name !== agentName));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#1e1e2f', color: 'white', minHeight: '100vh', position: 'relative' }}>
      
      {userRole === 'host' && pendingAgents.length > 0 && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '300px', zIndex: 1000 }}>
          {pendingAgents.map((agent, index) => (
            <div key={index} style={{ background: '#ffc107', color: '#333', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
              <strong>🤖 AI Agent Request from {agent}</strong>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => handleAgentDecision(agent, true)} style={{ flex: 1, padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                <button onClick={() => handleAgentDecision(agent, false)} style={{ flex: 1, padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}>← Back</button>
      <h2>{userRole === 'host' ? '🎥 Host' : '👤 Participant'}: Live Meeting (Logged in as: {userName})</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
        <strong style={{ color: '#aaa' }}>Participants ({activeParticipants.length}): </strong>
        {activeParticipants.map(user => (
          <span key={user} style={{ background: '#6f42c1', padding: '5px 12px', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold' }}>
            {user === userName ? `${user} (You)` : user}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '65vh' }}>
        
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px', backgroundColor: 'black', borderRadius: '8px', padding: '10px', overflowY: 'auto' }}>
            
            <div style={{ position: 'relative', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isVideoOn ? 'block' : 'none' }} />
              {!isVideoOn && <div style={{ color: '#aaa', fontSize: '20px', position: 'absolute' }}>Camera is Off</div>}
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{userName} (You)</div>
            </div>

            {Object.entries(remoteStreams).map(([peerName, stream]) => (
              <div key={peerName} style={{ position: 'relative', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video 
                  autoPlay playsInline 
                  ref={video => { if (video) video.srcObject = stream; }} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: remoteVideoStatus[peerName] === false ? 'none' : 'block' }} 
                />
                {remoteVideoStatus[peerName] === false && <div style={{ color: '#aaa', fontSize: '20px', position: 'absolute' }}>Camera is Off</div>}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{peerName}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px', backgroundColor: '#2a2a40', borderRadius: '8px' }}>
            <button onClick={toggleAudio} style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: isAudioOn ? '#444' : '#6f42c1', color: 'white' }}>{isAudioOn ? '🎤 Mute' : '🔇 Unmute'}</button>
            <button onClick={toggleVideo} style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: isVideoOn ? '#444' : '#6f42c1', color: 'white' }}>{isVideoOn ? '📹 Turn Off Camera' : '📸 Turn On Camera'}</button>
            {userRole === 'host' && <button onClick={handleEndMeeting} style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#dc3545', color: 'white' }}>❌ End Meeting</button>}
          </div>
        </div>
        
        <div style={{ flex: 1, backgroundColor: '#2a2a40', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '10px' }}>Meeting Log</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, index) => {
              const isMe = msg.sender.includes(userName);
              const isSystem = msg.sender === 'System';
              const isAI = msg.sender.includes('🤖');
              
              let color = '#ffc107'; 
              if (isMe) color = '#00a8ff'; 
              if (isSystem) color = '#aaa';
              if (isAI) color = '#28a745';

              return (
                <div key={index} style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  <span style={{ color: color, fontWeight: 'bold' }}>{msg.sender}: </span>
                  <span style={{ color: isSystem ? '#aaa' : 'white' }}>{msg.text}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '10px' }}>
            <input type="text" placeholder="Type a message..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleSendMessage} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>
    </div>
  );
}