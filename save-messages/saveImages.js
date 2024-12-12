import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";

const spacesClient = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

async function uploadImageToSpaces(chatId, imageBuffer, uploadTimestamp) {
    const folder = process.env.NODE_ENV === "development" ? "dev" : "prod";
    const sanitizedChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, ""); // Sanitize chat ID to avoid invalid path issues
    const filePath = `${folder}/images/${sanitizedChatId}/${uploadTimestamp.toISOString().replace(/:/g, "-")}.jpg`;

    try {
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filePath,
            Body: imageBuffer,
            ContentType: "image/jpeg",
            ACL: "private", // Ensure images are private
        });

        await spacesClient.send(uploadCommand);
        console.log(`[INFO] Image uploaded to: ${filePath}`);
        return filePath;
    } catch (uploadError) {
        console.error(`[ERROR] Image upload failed:`, uploadError);
        throw uploadError;
    }
}

async function generateSignedUrl(filePath) {
    try {
        const signedUrl = await getSignedUrl(
            spacesClient,
            new GetObjectCommand({
                Bucket: process.env.DO_SPACES_BUCKET,
                Key: filePath,
            }),
            { expiresIn: 3600 } // Signed URL valid for 1 hour
        );

        console.log(`[INFO] Signed URL generated: ${signedUrl}`);
        return signedUrl;
    } catch (urlError) {
        console.error(`[ERROR] Failed to generate signed URL:`, urlError);
        throw urlError;
    }
}

async function saveImage(chatId, telegramFileUrl, sender = "patient", uploadTimestamp = new Date(), caption = "") {    console.log(`[DEBUG] Preparing to save image for chat ID ${chatId}`);

    try {
        // Download the image file from the Telegram URL
        const imageResponse = await axios.get(telegramFileUrl, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Upload to DigitalOcean Spaces using the chatId-based folder structure
        const filePath = await uploadImageToSpaces(chatId, imageBuffer, uploadTimestamp);

        // Generate a signed URL for the uploaded image
        const signedUrl = await generateSignedUrl(filePath);

        // Save the image metadata to your database
        const botApiKey = process.env.MEDFLOW_KEY;

        const messagePayload = {
            text: caption || "Image Message", // Include caption as text
            sender,
            timestamp: uploadTimestamp.toISOString(),
            type: "image", // Ensure the correct type is passed
            mediaUrl: signedUrl, // Use the signed URL for the saved image
        };

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

        console.log(`[INFO] Image saved for chat ID ${chatId}:`, apiResponse.data);
        return apiResponse.data;
    } catch (saveError) {
        console.error(`[ERROR] Failed to save image for chat ID ${chatId}:`, saveError);
        throw saveError;
    }
}

export { saveImage };