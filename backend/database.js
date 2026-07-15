const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

// Initialize database file
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
}

// Get all history
function getHistory() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const history = JSON.parse(data);
    // Sort by timestamp descending
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

// Add to history
function addHistory(sourceText, targetText, fromLang, toLang) {
  initDb();
  try {
    const history = getHistory();
    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      sourceText,
      targetText,
      fromLang,
      toLang,
      timestamp: new Date().toISOString()
    };
    history.push(newEntry);
    fs.writeFileSync(DB_PATH, JSON.stringify(history, null, 2));
    return newEntry;
  } catch (error) {
    console.error('Error writing to database:', error);
    return null;
  }
}

// Delete item
function deleteHistory(id) {
  initDb();
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting from database:', error);
    return false;
  }
}

// Clear all history
function clearHistory() {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}

module.exports = {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory
};
