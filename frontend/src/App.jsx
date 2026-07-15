import React, { useState, useEffect } from 'react';
import { FiGlobe, FiFileText, FiCpu, FiMessageSquare, FiInfo, FiTrash } from 'react-icons/fi';
import Translator from './components/Translator';
import History from './components/History';
import DocTranslator from './components/DocTranslator';
import OcrTranslator from './components/OcrTranslator';
import ChatBot from './components/ChatBot';
import ThemeToggle from './components/ThemeToggle';
import { getHistory, deleteHistoryItem, clearHistory } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('translator');
  const [history, setHistory] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Show a popup toast
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: 'info' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Load history from backend
  const refreshHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleDeleteHistory = async (id) => {
    try {
      await deleteHistoryItem(id);
      refreshHistory();
      showToast('History item deleted', 'success');
    } catch (error) {
      showToast('Failed to delete history item', 'error');
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all translation history?')) {
      try {
        await clearHistory();
        refreshHistory();
        showToast('All translation history cleared!', 'success');
      } catch (error) {
        showToast('Failed to clear history', 'error');
      }
    }
  };

  const handleSelectHistoryItem = (item) => {
    setSelectedLog(item);
    setActiveTab('translator');
    showToast('Loaded translation from history', 'info');
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'translator':
        return (
          <Translator 
            triggerHistoryRefresh={refreshHistory} 
            selectedLog={selectedLog}
            clearSelectedLog={() => setSelectedLog(null)}
            showToast={showToast}
          />
        );
      case 'document':
        return (
          <DocTranslator 
            triggerHistoryRefresh={refreshHistory} 
            showToast={showToast}
          />
        );
      case 'ocr':
        return (
          <OcrTranslator 
            triggerHistoryRefresh={refreshHistory} 
            showToast={showToast}
          />
        );
      case 'chatbot':
        return (
          <ChatBot 
            showToast={showToast}
          />
        );
      default:
        return (
          <Translator 
            triggerHistoryRefresh={refreshHistory} 
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '16px' }}>
        <div className="logo-section">
          <div className="logo-icon">🌍</div>
          <div className="logo-text">
            <h1>LingoAI</h1>
            <span>AI Translation Platform</span>
          </div>
        </div>

        <div className="header-controls">
          <ThemeToggle />
        </div>
      </header>

      {/* Navigation & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'translator' ? 'active' : ''}`}
            onClick={() => setActiveTab('translator')}
          >
            <FiGlobe /> Text & Voice
          </button>
          <button 
            className={`tab-btn ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            <FiFileText /> Document
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ocr' ? 'active' : ''}`}
            onClick={() => setActiveTab('ocr')}
          >
            <FiCpu /> Image OCR
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chatbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            <FiMessageSquare /> AI ChatBot
          </button>
        </nav>
      </div>

      {/* Main Grid: Features (left) + History (right) */}
      <main className="dashboard-grid">
        <section className="main-workspace">
          {renderActiveComponent()}
        </section>

        {/* Translation History logs sidebar */}
        <aside>
          <History 
            history={history} 
            onDeleteHistoryItem={handleDeleteHistory}
            onClearHistory={handleClearHistory}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
        </aside>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} LingoAI. Built with React & Node.js. All rights reserved.</p>
      </footer>

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-notification" style={{
          borderLeftColor: toast.type === 'error' ? 'var(--error)' : toast.type === 'success' ? 'var(--success)' : 'var(--accent-primary)'
        }}>
          <FiInfo style={{ 
            color: toast.type === 'error' ? 'var(--error)' : toast.type === 'success' ? 'var(--success)' : 'var(--accent-primary)' 
          }} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
