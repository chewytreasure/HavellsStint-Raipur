const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = '7253315958:AAGDBGD28J0_Ud5-ruVbQhgI3xBp7qhdIPY';

app.use(bodyParser.json());

// Endpoint to receive updates from Telegram
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
    const { message } = req.body;

    if (message && message.text === '/start') {
        // Start conversation, ask for retailer name
        await sendMessage(message.chat.id, 'Please enter the retailer name:');
    } else if (message && message.text) {
        // Assume user input is the retailer name
        const retailerName = message.text;

        // Prompt user to upload images
        await sendMessage(message.chat.id, 'Please upload images for the retailer:');
        
        // Store retailer name and chat details for future reference
        // For demonstration, we're just logging here
        console.log(`Retailer Name: ${retailerName}, Chat ID: ${message.chat.id}`);
    }

    res.status(200).send('OK');
});

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
