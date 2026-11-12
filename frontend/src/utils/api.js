const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function translateText(text, from, to) {
  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, from, to }),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to translate');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error translateText:', error);
    throw error;
  }
}

export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  } catch (error) {
    console.error('API Error getHistory:', error);
    throw error;
  }
}

export async function deleteHistoryItem(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete history item');
    return await response.json();
  } catch (error) {
    console.error('API Error deleteHistoryItem:', error);
    throw error;
  }
}

export async function clearHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear history');
    return await response.json();
  } catch (error) {
    console.error('API Error clearHistory:', error);
    throw error;
  }
}

export async function translateDocument(file, from, to) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('from', from);
    formData.append('to', to);
    
    const response = await fetch(`${API_BASE_URL}/translate-document`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to translate document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error translateDocument:', error);
    throw error;
  }
}

export async function sendChatMessage(message, chatHistory, activeLanguage) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, chatHistory, activeLanguage }),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to send chat message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error sendChatMessage:', error);
    throw error;
  }
}
