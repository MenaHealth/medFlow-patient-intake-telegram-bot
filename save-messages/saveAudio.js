// save-messages/saveAudio.js
import fetch from "node-fetch";

const API_BASE_URL = process.env.API_BASE_URL;

export async function saveAudio(telegramChatId, audioUrl, sender = "patient", timestamp = new Date(), medflowKey) {
    console.log(`[DEBUG] Saving audio message for chat ID ${telegramChatId}: "${audioUrl}"`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${encodeURIComponent(medflowKey)}`,
            },
            body: JSON.stringify({ mediaUrl: audioUrl, sender, timestamp, type: "audio" }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR] Failed to save audio for chat ID ${telegramChatId}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[INFO] Audio message saved successfully for chat ID ${telegramChatId}:`, data);
        return data;
    } catch (error) {
        console.error(`[ERROR] Failed to save audio for chat ID ${telegramChatId}:`, error);
        throw error;
    }
}