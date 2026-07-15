const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up file upload with multer
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Google Translate API translation helper
async function translateText(text, from, to) {
  if (!text || text.trim() === '') return '';
  
  // Google Translate HTTP API endpoint (Free/Open Client API)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Parse Google Translate format: [[["translation", "source", ...]]]
    if (data && data[0]) {
      let translatedText = '';
      data[0].forEach(item => {
        if (item[0]) {
          translatedText += item[0];
        }
      });
      return translatedText;
    }
    throw new Error('Invalid translation format from API');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// REST API Routes

// 1. Core Text Translation Route
app.post('/api/translate', async (req, res) => {
  const { text, from, to, saveToHistory = true } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text to translate is required' });
  }
  
  try {
    const translatedText = await translateText(text, from, to);
    
    // Save to database history
    let historyItem = null;
    if (saveToHistory) {
      historyItem = database.addHistory(text, translatedText, from, to);
    }
    
    res.json({
      translatedText,
      from,
      to,
      historyItem
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to translate text. Please try again.' });
  }
});

// 2. Fetch Translation History Route
app.get('/api/history', (req, res) => {
  try {
    const history = database.getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// 3. Delete History Entry Route
app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = database.deleteHistory(id);
    if (success) {
      res.json({ message: 'History item deleted' });
    } else {
      res.status(404).json({ error: 'History item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

// 4. Clear All History Route
app.delete('/api/history', (req, res) => {
  try {
    database.clearHistory();
    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// 5. Document Upload and Translation Route
app.post('/api/translate-document', upload.single('file'), async (req, res) => {
  const { from, to } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = file.path;
  const originalName = file.originalname;
  const fileExtension = path.extname(originalName).toLowerCase();

  try {
    let extractedText = '';

    if (fileExtension === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);
      extractedText = parsedData.text;
    } else {
      // Cleanup file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file format. Please upload .txt, .docx, or .pdf' });
    }

    // Cleanup temp uploaded file
    fs.unlinkSync(filePath);

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'File appears to be empty or contains no readable text.' });
    }

    // Translate extracted text (we might chunk it if it's very long)
    // For simplicity, we split text into paragraphs or chunks of ~2000 chars to avoid URL size limit
    const chunks = [];
    let currentChunk = '';
    
    // Split by sentences or lines roughly
    const paragraphs = extractedText.split('\n');
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > 2000) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = paragraph + '\n';
      } else {
        currentChunk += paragraph + '\n';
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    let translatedText = '';
    for (const chunk of chunks) {
      if (chunk.trim()) {
        const translatedChunk = await translateText(chunk, from, to);
        translatedText += translatedChunk + '\n';
      }
    }

    // Save translation record to history
    database.addHistory(`Document: ${originalName}`, `Translated Document (${to})`, from, to);

    res.json({
      originalName,
      extractedText,
      translatedText,
      from,
      to
    });
  } catch (error) {
    console.error('Document translation error:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: 'Failed to process and translate document.' });
  }
});

// 6. Conversational AI Chatbot Route (Simulates an NLP Assistant using free translation & rule engine)
app.post('/api/chat', async (req, res) => {
  const { message, chatHistory = [], activeLanguage = 'en' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const cleanMsg = message.trim().toLowerCase();
    let reply = '';
    
    // Advanced NLP Routing Engine (Regular Expressions / Command Parsing)
    if (cleanMsg.startsWith('translate ') || cleanMsg.startsWith('translate:')) {
      // Format: translate hello world to french OR translate: hello world
      const textToTranslate = message.replace(/^(translate\s*|translate:\s*)/i, '');
      const toLang = activeLanguage === 'en' ? 'hi' : 'en'; // default toggle
      const translation = await translateText(textToTranslate, 'auto', toLang);
      reply = `Here is the translation of "${textToTranslate}" to **${toLang === 'hi' ? 'Hindi' : 'English'}**:\n\n> ${translation}`;
    } else if (cleanMsg.includes('help') || cleanMsg.includes('how to use') || cleanMsg === 'hi' || cleanMsg === 'hello') {
      reply = `Hello! I am your AI Translation Assistant. I can help you learn languages, translate text, and explain phrases.\n\nHere are some things you can try:\n- **Translate text**: Just type "translate [text]" and I'll translate it.\n- **Ask a question**: Try asking me to explain an idiom or translate a specific word.\n- **Learn**: Ask me for common greeting phrases in French or Spanish!`;
    } else if (cleanMsg.includes('explain') || cleanMsg.includes('meaning of') || cleanMsg.includes('what is')) {
      // Explain a word/phrase
      const query = message.replace(/^(explain\s*|meaning of\s*|what is\s*)/i, '');
      // Translate the word/phrase to English first if not in English, then describe it
      const translatedQuery = await translateText(query, 'auto', 'en');
      reply = `To help you understand "${query}" (which translates to English as "${translatedQuery}"):\n\nIt is often used in conversations. If you'd like, I can translate it to other languages for you, or help you practice using it in sentences. Let me know which language you want to translate it into!`;
    } else {
      // Conversational reply. We can detect if they typed something in a different language, translate to English, formulate response, then translate back!
      // This is a super clever way to create a multilingual chatbot using ONLY the free translation API!
      
      // Step 1: Detect and translate user message to English
      const userMessageInEnglish = await translateText(message, 'auto', 'en');
      
      // Step 2: Formulate standard response in English
      let botResponseInEnglish = '';
      const botQueries = [
        { regex: /how are you/i, response: "I'm doing great, thank you! Ready to help you translate and learn. How can I assist you today?" },
        { regex: /thank/i, response: "You're welcome! Let me know if you need any more translations or linguistic explanations." },
        { regex: /weather/i, response: "I don't have real-time weather details, but I can translate weather reports for you into any language!" },
        { regex: /name/i, response: "I am your translation chatbot assistant. You can call me Antigravity Translator Bot!" },
        { regex: /good morning/i, response: "Good morning! Wishing you a wonderful day of learning languages!" },
        { regex: /good night/i, response: "Good night! Have a peaceful rest." },
      ];
      
      const matched = botQueries.find(q => q.regex.test(userMessageInEnglish));
      if (matched) {
        botResponseInEnglish = matched.response;
      } else {
        botResponseInEnglish = `I understand you're talking about: "${userMessageInEnglish}". As a language translator bot, I can translate this sentence into French, Spanish, Hindi, Telugu, Tamil, or German. Which language would you like to see it in?`;
      }
      
      // Step 3: Translate response back to the user's active language if it is not English
      if (activeLanguage !== 'en') {
        reply = await translateText(botResponseInEnglish, 'en', activeLanguage);
      } else {
        reply = botResponseInEnglish;
      }
    }
    
    res.json({
      reply,
      activeLanguage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process chat response.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
