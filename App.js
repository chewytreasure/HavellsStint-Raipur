const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';

// Initialize Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to receive updates from Telegram webhook
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

// Start bot commands and interactions
bot.start((ctx) => {
    ctx.reply('Welcome! Please type the retailer name.');
});

// Handle messages containing retailer name
bot.on('text', (ctx) => {
    const retailerName = ctx.message.text;

    // Store retailerName in your database or session
    console.log(`Received retailer name: ${retailerName} from chat ID: ${ctx.chat.id}`);

    // Prompt user to upload images (or simulate upload)
    ctx.reply(`Retailer name '${retailerName}' received. Please upload images for this retailer.`);

    // Example: Simulate image received (adjust as per your logic)
    simulateImageReceived(ctx.chat.id, retailerName);
});

// Simulate receiving an image (replace with actual logic)
function simulateImageReceived(chatId, retailerName) {
    // Simulate uploading an image (replace with actual upload logic)
    setTimeout(() => {
        const imageUrl = 'https://example.com/image.jpg'; // Example image URL
        // Display image or store in cloud storage (MEGA, etc.)
        bot.telegram.sendPhoto(chatId, imageUrl, { caption: `Image uploaded for retailer: ${retailerName}` });
    }, 2000); // Simulate delay
}

// Example function to send messages via Telegram Bot API
async function sendMessage(chatId, text) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
