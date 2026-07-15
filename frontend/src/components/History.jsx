import React, { useState } from 'react';
import { FiSearch, FiTrash2, FiDownload, FiClock } from 'react-icons/fi';

export default function History({ history, onDeleteHistoryItem, onClearHistory, onSelectHistoryItem }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Export history to CSV file
  const exportToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Source Language', 'Target Language', 'Original Text', 'Translated Text', 'Timestamp'];
    const rows = history.map(item => [
      item.fromLang,
      item.toLang,
      `"${item.sourceText.replace(/"/g, '""')}"`,
      `"${item.targetText.replace(/"/g, '""')}"`,
      item.timestamp
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `translation_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter(item => 
    item.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.targetText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel history-panel">
      <div className="history-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiClock style={{ color: 'var(--accent-primary)' }} />
          Translation History
        </h3>
        {history.length > 0 && (
          <div className="toolbar-group">
            <button onClick={exportToCSV} className="icon-btn" title="Export as CSV">
              <FiDownload />
            </button>
            <button onClick={onClearHistory} className="icon-btn" title="Clear All History" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <FiTrash2 style={{ color: 'var(--error)' }} />
            </button>
          </div>
        )}
      </div>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search translations..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
        <FiSearch className="search-icon" />
      </div>

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            {searchTerm ? 'No matching translations.' : 'No history yet. Start translating!'}
          </div>
        ) : (
          filteredHistory.map(item => (
            <div 
              key={item.id} 
              className="history-item"
              onClick={() => onSelectHistoryItem(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="history-langs">
                <span>{item.fromLang}</span>
                <span className="history-arrow">→</span>
                <span>{item.toLang}</span>
              </div>
              <div className="history-text">{item.sourceText}</div>
              <div className="history-translation">{item.targetText}</div>
              
              <div className="history-actions" onClick={(e) => e.stopPropagation()}>
                <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <button 
                  className="history-delete-btn" 
                  onClick={() => onDeleteHistoryItem(item.id)}
                  title="Delete Log"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
