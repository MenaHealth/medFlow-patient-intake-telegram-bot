// API.js
import fetch from 'node-fetch';

const API_BASE_URL = process.env.PATIENT_FORM_BASE_URL || 'http://localhost:3000';

export async function createOrGetPatient(telegramChatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: telegramChatId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.registrationUrl) {
      return data.registrationUrl;
    } else if (data.patientId) {
      return `${API_BASE_URL}/patient/${data.patientId}`;
    } else {
      console.error('Unexpected server response:', data);
      throw new Error('Unexpected response from server');
    }
  } catch (error) {
    console.error('Error in createOrGetPatient:', error);
    throw error;
  }
}







