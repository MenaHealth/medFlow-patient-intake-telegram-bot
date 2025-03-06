// apps/telegram-bot/createPatient.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

// 🔹 Maps short language codes to full names (matches the `Languages` enum)
const languageMap = {
  en: "English",
  ar: "Arabic",
  fa: "Farsi",
  ps: "Pashto",
};

// 🔹 Maps full language names back to short codes (for extra validation)
const reverseLanguageMap = {
  English: "en",
  Arabic: "ar",
  Farsi: "fa",
  Pashto: "ps",
};

// 🔹 Function to validate language selection
function getValidLanguage(langCodeOrName) {
  if (languageMap[langCodeOrName]) return languageMap[langCodeOrName]; // Short code → Full name
  if (reverseLanguageMap[langCodeOrName]) return langCodeOrName; // Full name is already valid
  return null;
}

export async function createPatient(telegramChatId, languageCode = "en", medflowKey) {
  console.log(`[DEBUG] Creating patient for chat ID ${telegramChatId} with language "${languageCode}"`);

  // 🔹 Convert to the full language name before sending
  const patientLanguage = getValidLanguage(languageCode);
  if (!patientLanguage) {
    console.error(`[ERROR] Invalid language input "${languageCode}"`);
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