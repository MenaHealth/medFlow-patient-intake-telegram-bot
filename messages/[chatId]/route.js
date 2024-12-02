// messages/[chatId]/route.js
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Define the port
const port = process.env.PORT || 4000; // Default to 4000 if not defined

// Function to handle requests and responses
const requestListener = async (req, res) => {
    // Extract URL and method
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;

    // Match the route
    if (method === 'GET' && url.pathname.startsWith('/messages/')) {
        const chatId = url.pathname.split('/')[2];

        if (!chatId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Chat ID is required' }));
            return;
        }

        try {
            // Fetch updates (replace `bot.getUpdates` with your actual implementation)
            const updates = await bot.getUpdates(); // Replace `bot` with your bot instance
            console.log('Raw updates:', JSON.stringify(updates, null, 2));

            const messages = updates
                .filter((update) => update.message?.chat.id.toString() === chatId)
                .map((update) => ({
                    id: update.update_id,
                    text: update.message?.text || '',
                    sender: update.message?.from?.first_name || 'Unknown',
                    timestamp: update.message?.date
                        ? new Date(update.message.date * 1000)
                        : new Date(),
                }));

            if (!messages.length) {
                console.log(`No messages found for chat ID: ${chatId}`);
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No messages found for this Telegram Chat ID' }));
                return;
            }

            console.log(`Messages for chat ID ${chatId}:`, messages);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ messages }));
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    } else {
        // Handle 404 for unmatched routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
};

// Create and start the server
const server = http.createServer(requestListener);

server.listen(port, () => {
    console.log(`Bot server running on port ${port}`);
});