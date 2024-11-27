// API.js
import fetch from 'node-fetch';

const API_BASE_URL = process.env.PATIENT_FORM_BASE_URL || 'http://localhost:3000';

export async function createPatient(telegramChatId) {
  const response = await fetch(`${API_BASE_URL}/api/patient/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramChatId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create patient');
  }

  const data = await response.json();
  return `${API_BASE_URL}/new-patient/${data._id}`;
}

