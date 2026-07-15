import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { sendChatMessage } from '../utils/api';

const LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'te': 'Telugu',
  'ta': 'Tamil',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'it': 'Italian',
  'ar': 'Arabic'
};

export default function ChatBot({ showToast }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI Translation Assistant. How can I help you practice languages, explain phrases, or translate sentences today?\n\nTip: You can say "translate: [text]" to quickly translate something!',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Send chat request to backend
      const response = await sendChatMessage(userMessage.text, messages, activeLanguage);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      showToast('Could not get response from AI assistant.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel chat-container">
      {/* Chat Header */}
      <div 
        style={{ 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FiMessageSquare style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Translation Assistant</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multilingual NLP Helper</p>
          </div>
        </div>

        {/* Selected Bot Language */}
        <div className="select-wrapper" style={{ width: '130px' }}>
          <select 
            value={activeLanguage} 
            onChange={(e) => setActiveLanguage(e.target.value)} 
            className="language-select"
            style={{ padding: '0.4rem 1.8rem 0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>Speak: {name}</option>
            ))}
          </select>
          <span className="select-icon" style={{ right: '0.6rem', fontSize: '0.7rem' }}>▼</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
            <div 
              style={{ 
                fontSize: '0.65rem', 
                color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', 
                textAlign: 'right', 
                marginTop: '0.35rem' 
              }}
            >
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '0.6rem 1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assistant is typing</span>
            <div className="audio-visualizer" style={{ height: '10px' }}>
              <div className="bar" style={{ width: '2px', height: '3px' }}></div>
              <div className="bar" style={{ width: '2px', height: '3px' }}></div>
              <div className="bar" style={{ width: '2px', height: '3px' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="chat-input-bar" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask something (e.g. 'How do you say thank you in Spanish?')"
          className="chat-input"
          disabled={isTyping}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }} disabled={!inputText.trim() || isTyping}>
          <FiSend />
        </button>
      </form>
    </div>
  );
}
