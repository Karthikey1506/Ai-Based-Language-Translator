import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { FiImage, FiRefreshCw, FiCopy, FiCheck, FiCpu } from 'react-icons/fi';
import { translateText } from '../utils/api';

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

export default function OcrTranslator({ triggerHistoryRefresh, showToast }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setExtractedText('');
      setTranslatedText('');
      setProgress(0);
      setStatus('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setExtractedText('');
      setTranslatedText('');
      setProgress(0);
      setStatus('');
    }
  };

  const handleRunOcr = async () => {
    if (!image) {
      showToast('Please select or drag an image first.', 'error');
      return;
    }

    setIsProcessing(true);
    setStatus('Initializing OCR engine...');
    setProgress(10);

    try {
      const result = await Tesseract.recognize(
        image,
        'eng', // Default to English character set, handles other Latin-based texts too
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setStatus(`Recognizing characters...`);
              setProgress(Math.round(m.progress * 100));
            } else {
              setStatus(m.status);
            }
          },
        }
      );

      const parsedText = result.data.text;
      if (!parsedText || !parsedText.trim()) {
        showToast('OCR complete, but no text could be extracted.', 'warning');
        setExtractedText('[No text found]');
      } else {
        setExtractedText(parsedText);
        showToast('Text extracted from image successfully!', 'success');
        // Auto-translate to targetLang
        setIsTranslating(true);
        const transResponse = await translateText(parsedText, 'auto', targetLang);
        setTranslatedText(transResponse.translatedText);
        if (triggerHistoryRefresh) {
          triggerHistoryRefresh();
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      showToast('Failed to perform OCR. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  };

  const handleTranslateText = async () => {
    if (!extractedText || extractedText === '[No text found]') return;
    setIsTranslating(true);
    try {
      const response = await translateText(extractedText, 'auto', targetLang);
      setTranslatedText(response.translatedText);
      if (triggerHistoryRefresh) {
        triggerHistoryRefresh();
      }
      showToast('Translated extracted text!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Translation failed', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
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
      {/* OCR Left Panel: Upload Image & Extract */}
      <div className="glass-panel preview-pane">
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Image OCR Reader</h3>
        
        {imageUrl ? (
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '220px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <img 
              src={imageUrl} 
              alt="OCR Source" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
            <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#fff' }}>
              Click to replace
            </div>
          </div>
        ) : (
          <div 
            className="uploader-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{ height: '220px', justifyContent: 'center' }}
          >
            <FiImage className="uploader-icon" />
            <div>
              <p style={{ fontWeight: 500 }}>Select or Drop Image</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports JPG, PNG formats</p>
            </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
          accept="image/*"
        />

        {isProcessing && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.1s ease' }}></div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
          <div className="select-wrapper" style={{ flexGrow: 1 }}>
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)} 
              className="language-select"
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>Translate to: {name}</option>
              ))}
            </select>
            <span className="select-icon">▼</span>
          </div>

          <button 
            onClick={handleRunOcr} 
            className="btn-primary"
            style={{ flexShrink: 0 }}
            disabled={!image || isProcessing}
          >
            {isProcessing ? <FiRefreshCw className="bar" style={{ animation: 'spin 1.5s linear infinite' }} /> : <FiCpu />}
            Extract & Translate
          </button>
        </div>
      </div>

      {/* OCR Right Panel: Display text & Translation */}
      <div className="glass-panel preview-pane" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600 }}>OCR Text & Translation</h3>
          {translatedText && (
            <button onClick={handleCopy} className="icon-btn" title="Copy Translation">
              {copied ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiCopy />}
            </button>
          )}
        </div>

        {extractedText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', flexGrow: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Extracted Text (English OCR)
              </span>
              <div className="preview-content" style={{ maxHeight: '140px', minHeight: '100px' }}>
                {extractedText}
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  Translation ({LANGUAGES[targetLang]})
                </span>
                {isTranslating && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Translating...</span>
                )}
              </div>
              <div className="preview-content" style={{ maxHeight: '140px', minHeight: '100px', opacity: isTranslating ? 0.6 : 1 }}>
                {translatedText}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
            <FiCpu style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p>Upload an image and run extraction to view text contents.</p>
          </div>
        )}
      </div>
    </div>
  );
}
