// API.js
import fetch from 'node-fetch';

// Choose base URL dynamically based on the environment
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? process.env.DEV_PATIENT_FORM_BASE_URL || 'http://localhost:3000'
    : process.env.PATIENT_FORM_BASE_URL || 'https://medflow-mena-health.vercel.app';

// Function to create or get patient data
export async function createOrGetPatient(telegramChatId = null, language = 'english') {
  console.log('Payload sent to API:', { chatId: telegramChatId, language });

  try {
    const apiKey = process.env.NODE_ENV === 'development'
        ? process.env.DEV_TELEGRAM_BOT_KEY
        : process.env.PROD_TELEGRAM_BOT_KEY;

    const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodeURIComponent(apiKey)}`,
      },
      body: JSON.stringify({ telegramChatId, language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.registrationUrl) {
      return {
        type: 'new',
        url: data.registrationUrl,
        message: data.message, // The raw success message
      };
    } else if (data.patientDashboardUrl) {
      return {
        type: 'existing',
        message: data.message, // Existing patient message
      };
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (error) {
    console.error('Error in createOrGetPatient:', error);
    throw error;
  }
}