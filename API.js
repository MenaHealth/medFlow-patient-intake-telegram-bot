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

// Function to create or get patient data
export async function createOrGetPatient(telegramChatId, firstName, lastName = null) {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Payload sent to API:", { chatId: telegramChatId, firstName, lastName });

  try {
    const apiKey = process.env.NODE_ENV === 'development'
        ? process.env.DEV_TELEGRAM_BOT_KEY
        : process.env.PROD_TELEGRAM_BOT_KEY;

    const encodedApiKey = encodeURIComponent(apiKey);
    // console.log("Encoded API Key Sent:", encodedApiKey);

    const response = await fetch(`${API_BASE_URL}/api/telegram-bot`, { // Use API_BASE_URL here
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodedApiKey}`,
      },
      body: JSON.stringify({ chatId: telegramChatId, firstName, lastName }),
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
        message: data.message, // Include the personalized message
      };
    } else if (data.patientDashboardUrl) {
      return {
        type: 'existing',
        url: data.patientDashboardUrl,
        message: data.message,
      };
    } else {
      console.error('Unexpected server response:', data);
      throw new Error('Unexpected response from server');
    }
  } catch (error) {
    console.error('Error in createOrGetPatient:', error);
    throw error;
  }
}