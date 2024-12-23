// save-messages/saveAudio.js
import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const spacesClient = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

async function uploadAudioToSpaces(chatId, audioBuffer, uploadTimestamp) {
    // Determine the folder based on the NODE_ENV variable
    const folder = process.env.NODE_ENV === "development"
        ? "dev"
        : process.env.NODE_ENV === "staging"
            ? "staging"
            : "prod";

    // Sanitize chat ID to avoid invalid path issues
    const sanitizedChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, "");

    // Construct the file path
    const filePath = `${folder}/audio/${sanitizedChatId}/${uploadTimestamp.toISOString().replace(/:/g, "-")}`; // No explicit extension

    try {
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filePath,
            Body: audioBuffer,
            ContentType: "application/octet-stream", // Generic content type for raw audio
            ACL: "public-read",
        });

        await spacesClient.send(uploadCommand);
        const fileUrl = `${process.env.DO_SPACES_CDN_ENDPOINT}/${filePath}`;
        console.log(`[INFO] Audio uploaded to: ${fileUrl}`);
        return fileUrl;
    } catch (uploadError) {
        console.error(`[ERROR] Audio upload failed:`, uploadError);
        throw uploadError;
    }
}

export async function saveAudio(chatId, telegramFileUrl, sender = "patient", uploadTimestamp = new Date(), caption = "") {
    console.log(`[DEBUG] Preparing to save audio for chat ID ${chatId}`);

    try {
        // Download the audio file from the Telegram URL
        const audioResponse = await axios.get(telegramFileUrl, { responseType: "arraybuffer" });
        const audioBuffer = Buffer.from(audioResponse.data);

        // Upload to DO Spaces and get the CDN URL
        const audioUrl = await uploadAudioToSpaces(chatId, audioBuffer, uploadTimestamp);

        const botApiKey = process.env.MEDFLOW_KEY;

        const messagePayload = {
            text: caption || "Audio Message", // Include caption as text
            sender,
            timestamp: uploadTimestamp.toISOString(),
            type: "audio", // Ensure the correct type is passed
            mediaUrl: audioUrl, // URL of the uploaded audio file
        };

        // Save the message with the audio URL
        const apiResponse = await axios.patch(
            `${process.env.API_BASE_URL}/api/telegram-bot/${chatId}/save-message`,
            messagePayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${encodeURIComponent(botApiKey)}`,
                },
            }
        );

        console.log(`[INFO] Audio saved for chat ID ${chatId}:`, apiResponse.data);
        return apiResponse.data;
    } catch (saveError) {
        console.error(`[ERROR] Failed to save audio for chat ID ${chatId}:`, saveError);
        throw saveError;
    }
}