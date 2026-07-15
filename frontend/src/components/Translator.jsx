import React, { useState, useEffect, useRef } from 'react';
import { FiVolume2, FiCopy, FiMic, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { translateText } from '../utils/api';

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

const SPEECH_LANGS = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'ja': 'ja-JP',
  'zh': 'zh-CN',
  'it': 'it-IT',
  'ar': 'ar-SA'
};

export default function Translator({ triggerHistoryRefresh, selectedLog, clearSelectedLog, showToast }) {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const recognitionRef = useRef(null);
  const translateTimeoutRef = useRef(null);

  // Load from selected history log if user clicks it
  useEffect(() => {
    if (selectedLog) {
      setSourceText(selectedLog.sourceText);
      setTargetText(selectedLog.targetText);
      setSourceLang(selectedLog.fromLang);
      setTargetLang(selectedLog.toLang);
      clearSelectedLog();
    }
  }, [selectedLog, clearSelectedLog]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (translateTimeoutRef.current) {
        clearTimeout(translateTimeoutRef.current);
      }
    };
  }, []);

  // Debounced translation as user types
  useEffect(() => {
    if (sourceText.trim() === '') {
      setTargetText('');
      return;
    }

    if (translateTimeoutRef.current) {
      clearTimeout(translateTimeoutRef.current);
    }

    translateTimeoutRef.current = setTimeout(() => {
      performTranslation(sourceText, sourceLang, targetLang);
    }, 800); // 800ms debounce

    return () => clearTimeout(translateTimeoutRef.current);
  }, [sourceText, sourceLang, targetLang]);

  // Main translation function
  const performTranslation = async (text, from, to) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const response = await translateText(text, from, to);
      setTargetText(response.translatedText);
      if (triggerHistoryRefresh) {
        triggerHistoryRefresh();
      }
    } catch (error) {
      console.error(error);
      showToast('Translation error. Please check backend connection.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Swap Languages
  const swapLanguages = () => {
    if (sourceLang === 'auto') return; // Cannot swap with auto-detect
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  // Copy to clipboard
  const handleCopy = async (text, setCopiedState) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  // Text-To-Speech (TTS)
  const speakText = (text, langCode) => {
    if (!text) return;
    window.speechSynthesis.cancel(); // Stop current speakings

    const speechLang = SPEECH_LANGS[langCode] || 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    
    // Find matching system voice if possible
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(langCode));
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (STT) Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Web Speech API is not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      stopSpeechRecognition();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Select speech language code
    const speechLang = SPEECH_LANGS[sourceLang] || 'en-US';
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Listening... Speak now.', 'info');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event) => {
      console.error('Speech Recognition Error:', event);
      showToast(`Speech recognition error: ${event.error}`, 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="glass-panel translator-box">
      {/* Source Pane */}
      <div className="translator-pane source">
        <div className="pane-header">
          <div className="select-wrapper">
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
          {isTranslating && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiRefreshCw className="bar" style={{ animation: 'spin 1.5s linear infinite' }} /> Translating...
            </span>
          )}
        </div>

        <div className="textarea-container">
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Type your text to translate..."
            className="translation-textarea"
            maxLength={5000}
          />
          <div className="character-counter">{sourceText.length}/5000</div>
        </div>

        <div className="action-toolbar">
          <div className="toolbar-group">
            <button 
              onClick={startSpeechRecognition} 
              className={`icon-btn ${isListening ? 'active' : ''}`}
              title={isListening ? 'Stop Recording' : 'Translate Voice (STT)'}
            >
              {isListening ? (
                <div className="audio-visualizer">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              ) : <FiMic />}
            </button>
            <button 
              onClick={() => speakText(sourceText, sourceLang)} 
              className="icon-btn" 
              title="Listen to Source text"
              disabled={!sourceText}
            >
              <FiVolume2 />
            </button>
            <button 
              onClick={() => handleCopy(sourceText, setCopiedSource)} 
              className="icon-btn" 
              title="Copy Text"
              disabled={!sourceText}
            >
              {copiedSource ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiCopy />}
            </button>
          </div>
        </div>
      </div>

      {/* Swap Button (Desktop only overlapping, Mobile standard) */}
      <div className="swap-button-container">
        <button 
          onClick={swapLanguages} 
          className="swap-btn" 
          title="Swap Languages"
          disabled={sourceLang === 'auto'}
        >
          ⇄
        </button>
      </div>

      {/* Target Pane */}
      <div className="translator-pane target" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="pane-header">
          <div className="select-wrapper">
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

        <div className="textarea-container">
          <textarea
            value={targetText}
            readOnly
            placeholder="Translated text will appear here..."
            className="translation-textarea"
            style={{ color: 'var(--text-primary)', opacity: isTranslating ? 0.6 : 1 }}
          />
        </div>

        <div className="action-toolbar">
          <div className="toolbar-group">
            <button 
              onClick={() => speakText(targetText, targetLang)} 
              className="icon-btn" 
              title="Listen to translation"
              disabled={!targetText}
            >
              <FiVolume2 />
            </button>
            <button 
              onClick={() => handleCopy(targetText, setCopiedTarget)} 
              className="icon-btn" 
              title="Copy translation"
              disabled={!targetText}
            >
              {copiedTarget ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiCopy />}
            </button>
          </div>
          <button 
            onClick={() => performTranslation(sourceText, sourceLang, targetLang)} 
            className="btn-primary"
            disabled={!sourceText || isTranslating}
          >
            Translate
          </button>
        </div>
      </div>
    </div>
  );
}
