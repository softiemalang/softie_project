import React, { useState, useEffect } from 'react';
import { getCurrentSession, signInWithGoogle } from '../lib/auth';
import { askProjectBrain } from '../projectBrain/api';
import './../projectBrain/projectBrain.css';

function parseInlineSegments(text, keyPrefix) {
  const segments = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      const content = token.slice(2, -2).trim();
      segments.push(<strong key={`${keyPrefix}-strong-${match.index}`}>{content}</strong>);
    } else if (token.startsWith('`')) {
      const content = token.slice(1, -1).trim();
      segments.push(<code key={`${keyPrefix}-code-${match.index}`}>{content}</code>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
}

function renderAssistantAnswer(text) {
  if (!text) return null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const nodes = [];
  let paragraph = [];
  let bulletItems = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    nodes.push(
      <p key={`brain-answer-p-${nodes.length}`} className="brain-answer-paragraph">
        {paragraph.map((line, index) => (
          <React.Fragment key={`brain-answer-fragment-${nodes.length}-${index}`}>
            {index > 0 ? ' ' : null}
            {parseInlineSegments(line, `p-${nodes.length}-${index}`)}
          </React.Fragment>
        ))}
      </p>
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bulletItems.length) return;
    nodes.push(
      <ul key={`brain-answer-ul-${nodes.length}`} className="brain-answer-list">
        {bulletItems.map((item, index) => (
          <li key={`brain-answer-li-${nodes.length}-${index}`}>
            {parseInlineSegments(item, `li-${nodes.length}-${index}`)}
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushBullets();
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      bulletItems.push(bulletMatch[1]);
      return;
    }

    flushBullets();
    paragraph.push(rawLine);
  });

  flushParagraph();
  flushBullets();

  return nodes.length ? nodes : text;
}

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
        <h1>작업 전 확인실</h1>
        <p>프로젝트 설계도와 작업 원칙을 바탕으로, 수정 전에 조심할 부분을 함께 확인해요.</p>
      </header>

      <div className="chat-container">
        {messages.length === 0 && (
          <div className="brain-empty-state">
            <div className="brain-empty-kicker">준비되면 바로 적어보세요.</div>
            <div className="message assistant brain-empty-message">
              수정하려는 기능, 파일명, 걱정되는 부분을 편하게 적어보세요. Project Brain이 먼저 확인할 지점을 정리해줄게요.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.role === 'assistant' ? (
              <>
                <div className="brain-answer">
                  {renderAssistantAnswer(m.content)}
                </div>
                <div className="notice">이 답변은 softie_project 지식 문서를 기준으로 생성됐어요. 실제 수정 전에는 GitHub의 현재 파일을 다시 확인해 주세요.</div>
              </>
            ) : (
              m.content
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
