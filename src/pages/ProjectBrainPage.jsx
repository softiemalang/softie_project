import React, { useState, useEffect } from 'react';
import { getCurrentSession, signInWithGoogle } from '../lib/auth';
import { askProjectBrain } from '../projectBrain/api';
import './../projectBrain/projectBrain.css';

const SUGGESTIONS = [
  "Google OAuth 수정 전에 조심해야 할 파일 알려줘.",
  "Scheduler 웹 알림을 수정할 때 위험한 부분 알려줘.",
  "Rehearsals ownerKey 동기화 흐름 설명해줘.",
  "Fortune 리포트 생성 흐름을 단계별로 설명해줘."
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
        <div className="brain-card brain-header brain-hero-card">
          <div className="brain-eyebrow">프로젝트 브레인</div>
          <h1>Project Brain</h1>
          <p>Project Brain을 사용하려면 Google 로그인이 필요해요.</p>
          <button className="soft-button brain-signin" onClick={signInWithGoogle}>Google로 로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div className="brain-page">
      <header className="brain-header">
        <div className="brain-eyebrow">프로젝트 브레인</div>
        <h1>softie_project 작업 전 확인실</h1>
        <p>프로젝트 설계도와 작업 원칙을 바탕으로, 수정 전에 조심할 부분을 함께 확인해요.</p>
      </header>

      <div className="suggestion-buttons">
        {SUGGESTIONS.map(q => (
          <button key={q} className="suggestion-btn" onClick={() => handleSend(q)}>
            <span className="suggestion-kicker">질문 예시</span>
            <span className="suggestion-text">{q}</span>
          </button>
        ))}
      </div>

      <div className="chat-container">
        {messages.length === 0 && (
          <div className="brain-empty-state">
            <div className="brain-empty-kicker">준비되면 바로 물어봐도 좋아.</div>
            <div className="message assistant brain-empty-message">
              위 질문을 선택하거나, 수정 전에 확인할 내용을 Project Brain에게 물어보세요.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.content}
            {m.role === 'assistant' && (
              <div className="notice">이 답변은 softie_project 지식 문서를 기준으로 생성됐어요. 실제 수정 전에는 GitHub의 현재 파일을 다시 확인해 주세요.</div>
            )}
          </div>
        ))}
        {loading && <div className="message assistant">Project Brain이 설계도를 확인하는 중이에요...</div>}
      </div>

      <div className="chat-input-area">
        <div className="chat-composer">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="질문을 입력해 주세요..."
          />
          <button className="soft-button chat-send-button" onClick={() => handleSend()}>보내기</button>
        </div>
      </div>
    </div>
  );
}
