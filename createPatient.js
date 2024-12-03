// createPatient.js
import fetch from "node-fetch";

const API_BASE_URL = process.env.NODE_ENV === "development"
    ? process.env.DEV_PATIENT_FORM_BASE_URL || "http://localhost:3000"
    : process.env.PATIENT_FORM_BASE_URL || "https://medflow-mena-health.vercel.app";

export async function createPatient(telegramChatId, language = "en") {
  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/new-patient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Failed to create patient:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[INFO] Patient created:`, data);
    return data;
  } catch (error) {
    console.error(`[ERROR] Failed to create patient:`, error);
    throw error;
  }
}