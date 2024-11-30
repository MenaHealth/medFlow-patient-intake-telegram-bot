// API.js
import fetch from 'node-fetch';

// Choose base URL dynamically based on the environment
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? process.env.DEV_PATIENT_FORM_BASE_URL || 'http://localhost:3000'
    : process.env.PATIENT_FORM_BASE_URL || 'https://medflow-mena-health.vercel.app';

// Select the appropriate key based on the environment
const API_KEY = process.env.NODE_ENV === 'development'
    ? process.env.DEV_TELEGRAM_BOT_KEY
    : process.env.PROD_TELEGRAM_BOT_KEY;

export async function createOrGetPatient(telegramChatId, firstName, lastName = null) {
  try {
    console.log(`Sending request for chat ID: ${telegramChatId}, First Name: ${firstName}`);

    const encodedApiKey = encodeURIComponent(API_KEY);

    const response = await fetch(`${API_BASE_URL}/api/telegram-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodedApiKey}`,
      },
      body: JSON.stringify({ chatId: telegramChatId, firstName, lastName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from API:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.registrationUrl || data.patientDashboardUrl) {
      console.log(`API responded successfully for chat ID: ${telegramChatId}`);
    } else {
      console.error('Unexpected API response structure.');
    }

    return data;
  } catch (error) {
    console.error('Error in createOrGetPatient:', error.message || error);
    throw error;
  }
}