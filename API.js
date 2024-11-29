// API.js
import fetch from 'node-fetch';

// Choose base URL dynamically based on the environment
const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? process.env.DEV_PATIENT_FORM_BASE_URL || 'http://localhost:3000' // Development URL (fallback to localhost)
    : process.env.PATIENT_FORM_BASE_URL || 'https://medflow-mena-health.vercel.app'; // Production URL (fallback to prod)

// Function to create or get patient data
export async function createOrGetPatient(telegramChatId, name = null) {
  console.log("API_BASE_URL:", API_BASE_URL);

  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: telegramChatId, name }), // Include the name if available
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.registrationUrl) {
      return { type: 'new', url: data.registrationUrl };
    } else if (data.patientDashboardUrl) {
      return { type: 'existing', url: data.patientDashboardUrl };
    } else {
      console.error('Unexpected server response:', data);
      throw new Error('Unexpected response from server');
    }
  } catch (error) {
    console.error('Error in createOrGetPatient:', error);
    throw error;
  }
}