// save-messages/saveAudio.js
import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { PassThrough } from "stream";

// Base URL for the API
const API_BASE_URL = process.env.NODE_ENV === "development"
    ? process.env.DEV_PATIENT_FORM_BASE_URL || "http://localhost:3000"
    : process.env.PATIENT_FORM_BASE_URL || "https://medflow-mena-health.vercel.app";

// Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Function to convert OGG to MP3
async function convertOggToMp3(buffer) {
    return new Promise((resolve, reject) => {
        const inputStream = new Readable();
        inputStream.push(buffer);
        inputStream.push(null); // Signal end of the stream

        const outputStream = new PassThrough();
        const chunks = [];

        outputStream.on("data", (chunk) => chunks.push(chunk));
        outputStream.on("end", () => resolve(Buffer.concat(chunks)));
        outputStream.on("error", reject);

        ffmpeg(inputStream)
            .inputFormat("ogg")
            .audioCodec("libmp3lame")
            .format("mp3")
            .on("error", (err) => reject(err))
            .pipe(outputStream, { end: true });
    });
}

// Function to upload audio to S3
async function uploadAudioToS3(chatId, buffer, timestamp, format = "mp3") {
    const key = `audio/${chatId}/${timestamp.toISOString()}.${format}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_AUDIO_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: `audio/${format}`,
        });

        await s3.send(command);
        const location = `https://${process.env.AWS_S3_AUDIO_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`[INFO] Audio uploaded to S3: ${location}`);
        return location;
    } catch (error) {
        console.error(`[ERROR] Failed to upload audio to S3:`, error);
        throw error;
    }
}

// Function to save the audio message
export async function saveAudio(telegramChatId, fileUrl, sender = "patient", timestamp = new Date()) {
    console.log(`[DEBUG] Saving audio message for chat ID ${telegramChatId}`);

    const apiKey = process.env.NODE_ENV === "development"
        ? process.env.DEV_TELEGRAM_BOT_KEY
        : process.env.PROD_TELEGRAM_BOT_KEY;

    try {
        // Fetch the OGG file from the provided URL
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const oggBuffer = Buffer.from(response.data);

        // Convert OGG to MP3
        console.log("[INFO] Converting OGG to MP3...");
        const mp3Buffer = await convertOggToMp3(oggBuffer);

        // Upload MP3 to S3
        console.log("[INFO] Uploading MP3 to S3...");
        const s3Url = await uploadAudioToS3(telegramChatId, mp3Buffer, timestamp, "mp3");

        // Save the MP3 URL as a message in your backend
        const requestBody = {
            text: "Audio Message",
            sender,
            timestamp: timestamp.toISOString(),
            type: "audio",
            mediaUrl: s3Url,
        };

        console.log('Request Body:', requestBody);

        const responseFromAPI = await axios.patch(
            `${API_BASE_URL}/api/telegram-bot/${telegramChatId}/save-message`,
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${encodeURIComponent(apiKey)}`,
                },
            }
        );

        console.log(`[INFO] Audio message saved successfully for chat ID ${telegramChatId}:`, responseFromAPI.data);
        return responseFromAPI.data;
    } catch (error) {
        console.error(`[ERROR] Failed to save audio message for chat ID ${telegramChatId}:`, error);
        throw error;
    }
}
