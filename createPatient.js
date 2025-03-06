//createPatient.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

// 🔹 Hardcoded mapping to match `Languages` enum
const languageMap = {
  en: "English",
  ar: "Arabic",
  fa: "Farsi",
  ps: "Pashto",
};

// 🔹 Function to ensure valid language selection
function getValidLanguage(langCode) {
  return languageMap[langCode] || null;
}

export async function createPatient(telegramChatId, languageCode = "en", medflowKey) {
  console.log(`[DEBUG] Creating patient for chat ID ${telegramChatId} with language "${languageCode}"`);

  // 🔹 Ensure the language matches your model
  const patientLanguage = getValidLanguage(languageCode);
  if (!patientLanguage) {
    console.error(`[ERROR] Invalid language code "${languageCode}"`);
    throw new Error(`Invalid language code: ${languageCode}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/new-patient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
      },
      body: JSON.stringify({ language: patientLanguage }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Failed to create patient:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[INFO] Patient created successfully:`, data);
    return data;
  } catch (error) {
    console.error(`[ERROR] Failed to create patient:`, error);
    throw error;
  }
}