// createPatient.js
import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;


export async function createPatient(telegramChatId, language = "en", medflowKey) {
  console.log(`[DEBUG] Creating patient for chat ID ${telegramChatId} with language "${language}"`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/new-patient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
      },
      body: JSON.stringify({ language }),
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