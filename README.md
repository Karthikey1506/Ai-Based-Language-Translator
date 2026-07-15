# LingoAI - AI-Based Language Translator

LingoAI is a premium, full-featured AI-powered language translation application. Built with a modern glassmorphic dashboard interface, it supports real-time text translation, speech-to-text voice input, text-to-speech voice output, document translation (.txt, .docx, .pdf), image OCR text extraction and translation, translation history logging, and a simulated conversational AI translation chatbot assistant.

---

## 🌟 Key Features

1. **Text & Voice Translation (Text & Voice Tab)**
   - **Real-Time Translation**: Automatically translates as you type with a debounced input mechanism.
   - **Multi-Language Support**: Supports English, Hindi, Telugu, Tamil, Spanish, French, German, Japanese, Chinese, Italian, and Arabic.
   - **Speech-to-Text (Voice Input)**: Click the microphone icon to transcribe spoken voice into text in real-time.
   - **Text-to-Speech (Voice Output)**: Listen to the correct pronunciation of the source or translated text.
   - **Clipboard Actions**: Copy source and translation text in one click.
   - **Swap Languages**: Swap the source and target languages and text instantly.

2. **Document Translation (Document Tab)**
   - **Multi-Format Parsing**: Extracts text from `.txt`, `.docx` (Word), and `.pdf` files.
   - **Paragraph-by-Paragraph translation**: Handles large document blocks and chunks them to fit translation limits.
   - **Download Output**: Preview the translation and download the translated document as a `.txt` file.

3. **Image OCR Translation (Image OCR Tab)**
   - **Client-Side OCR**: Utilizes browser-native Tesseract.js to scan and extract characters from images (PNG, JPG) without external server dependencies.
   - **Translate Scan**: Automatically translates extracted text into the selected language.

4. **AI ChatBot Assistant (AI ChatBot Tab)**
   - **Linguistic Helper**: Interactive translation companion to practice conversational skills, explain idioms, translate phrases, or explain grammar rules.
   - **Multilingual Support**: Chat with the bot in any of the supported languages.

5. **Translation History Logs**
   - **Log Management**: Saves all translation queries locally in a lightweight JSON database.
   - **Search & Reload**: Search history entries and click on any entry to reload it into the translator.
   - **Export**: Download your translation history as a `.csv` file.

6. **Premium Aesthetics**
   - **Glassmorphic Design**: Clean responsive layout using blurred panels, linear gradients, and shadows.
   - **Dark & Light Mode**: Seamless theme switching with system memory persistence.
   - **Micro-Animations**: Smooth fade-ins, typing visualizers, and micro-interactions.

---

## 📂 Project Structure

```
ai-translator/
├── package.json          (Root package to run both servers concurrently)
├── start.ps1             (PowerShell startup helper script)
├── check_project.ps1     (Integrity check and verification script)
├── test_doc.txt          (Sample file for testing document translation)
├── backend/
│   ├── package.json
│   ├── server.js         (Express REST API, multer upload, file parsing, chatbot routes)
│   ├── database.js       (Local history database manager)
│   └── database.json     (Lightweight JSON data storage)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx       (Layout orchestrator and state coordinator)
        ├── index.css     (Global styling variables, dark/light tokens, and transitions)
        ├── components/
        │   ├── Translator.jsx   (Core translation, STT, and TTS pane)
        │   ├── History.jsx      (Searchable history list with CSV export)
        │   ├── DocTranslator.jsx(File parsing and download layout)
        │   ├── OcrTranslator.jsx(Image scanning and OCR layout)
        │   ├── ChatBot.jsx       (Conversational translation interface)
        │   └── ThemeToggle.jsx  (Sun/Moon switcher)
        └── utils/
            └── api.js           (Frontend API client wrappers)
```

---

## ⚙️ Prerequisites

You will need the following installed on your system:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

---

## 🚀 Installation & Startup

1. Clone or copy the project files to a folder on your machine (e.g. `E:\Projects\ai-translator`).
2. Open a terminal in the project directory.
3. Run the start helper script:
   ```powershell
   .\start.ps1
   ```
   *(Alternatively, run `npm run dev` in the root folder).*
4. Open your web browser and navigate to:
   👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🛡️ Project Verification

You can run the built-in integrity check script to verify all files and endpoints are running correctly:
```powershell
.\check_project.ps1
```
This script will check for directory integrity, test node_modules, build the production compilation of the React frontend, and test the backend REST API endpoints.
