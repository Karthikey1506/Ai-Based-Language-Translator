import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiDownload, FiFileText, FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';
import { translateDocument } from '../utils/api';

const LANGUAGES = {
  'auto': 'Detect Language',
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

export default function DocTranslator({ triggerHistoryRefresh, showToast }) {
  const [file, setFile] = useState(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleTranslateDoc = async () => {
    if (!file) {
      showToast('Please select a file to translate', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await translateDocument(file, sourceLang, targetLang);
      setExtractedText(response.extractedText);
      setTranslatedText(response.translatedText);
      showToast('Document translated successfully!', 'success');
      if (triggerHistoryRefresh) {
        triggerHistoryRefresh();
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Failed to translate document.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTranslation = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded translated text file!', 'success');
  };

  const copyToClipboard = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="document-grid">
      {/* File Upload Pane */}
      <div className="glass-panel preview-pane">
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Upload Document</h3>
        <div 
          className="uploader-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <FiUploadCloud className="uploader-icon" />
          {file ? (
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Drag and drop document here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Supports .txt, .docx, .pdf files
              </p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
            accept=".txt,.docx,.pdf"
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div className="select-wrapper" style={{ flexGrow: 1 }}>
            <select 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)} 
              className="language-select"
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <span className="select-icon">▼</span>
          </div>

          <div className="select-wrapper" style={{ flexGrow: 1 }}>
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)} 
              className="language-select"
            >
              {Object.entries(LANGUAGES)
                .filter(([code]) => code !== 'auto')
                .map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
            </select>
            <span className="select-icon">▼</span>
          </div>
        </div>

        <button 
          onClick={handleTranslateDoc} 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <FiRefreshCw className="bar" style={{ animation: 'spin 1.5s linear infinite' }} /> Processing & Translating...
            </>
          ) : 'Translate Document'}
        </button>
      </div>

      {/* Preview Translation Pane */}
      <div className="glass-panel preview-pane" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600 }}>Translation Output</h3>
          {translatedText && (
            <div className="toolbar-group">
              <button onClick={copyToClipboard} className="icon-btn" title="Copy Translation">
                {copied ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiCopy />}
              </button>
              <button onClick={downloadTranslation} className="icon-btn" title="Download Text File">
                <FiDownload />
              </button>
            </div>
          )}
        </div>

        {translatedText ? (
          <div className="preview-content">
            {translatedText}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
            <FiFileText style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p>Upload and translate a file to preview output.</p>
          </div>
        )}
      </div>
    </div>
  );
}
