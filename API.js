// API.js
import fetch from 'node-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function createOrGetPatient(telegramChatId) {
  const response = await fetch(`${API_BASE_URL}/api/telegram-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: telegramChatId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process patient');
  }

  const data = await response.json();

  if (data.registrationUrl) {
    return data.registrationUrl;
  } else if (data.patientId) {
    return `${API_BASE_URL}/patient/${data.patientId}`;
  } else {
    throw new Error('Unexpected response from server');
  }
}



