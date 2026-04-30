import React, { useState, useEffect } from 'react';
import { getCurrentSession, signInWithGoogle } from '../lib/auth';
import { askProjectBrain } from '../projectBrain/api';
import './../projectBrain/projectBrain.css';

const SUGGESTIONS = [
  "Which files should I be careful with before modifying Google OAuth?",
  "What are the risky areas when changing Scheduler web notifications?",
  "Explain the Rehearsals ownerKey synchronization flow.",
  "Explain the Fortune report generation flow step by step."
];

export default function ProjectBrainPage() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentSession().then(setSession);
  }, []);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const response = await askProjectBrain({ question: text });
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Unable to get an answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="brain-page">
        <h2>Project Brain</h2>
        <p>Please sign in to access the Project Brain.</p>
        <button className="soft-button" onClick={signInWithGoogle}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="brain-page">
      <header className="brain-header">
        <div className="brain-eyebrow">PROJECT BRAIN</div>
        <h1>softie_project pre-work check room</h1>
        <p>Ask questions based on the project building map and working principles.</p>
      </header>

      <div className="suggestion-buttons">
        {SUGGESTIONS.map(q => <button key={q} className="suggestion-btn" onClick={() => handleSend(q)}>{q}</button>)}
      </div>

      <div className="chat-container">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.content}
            {m.role === 'assistant' && (
              <div className="notice">This answer is based on the softie_project knowledge documents. Before making actual changes, check the current GitHub files again.</div>
            )}
          </div>
        ))}
        {loading && <div className="message assistant">Thinking...</div>}
      </div>

      <div className="chat-input-area">
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question..." />
        <button className="soft-button" onClick={() => handleSend()}>Send</button>
      </div>
    </div>
  );
}
