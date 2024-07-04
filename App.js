const express = require('express');
const axios = require('axios');
const fs = require('fs');
const mega = require('mega');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = '7253315958:AAGDBGD28J0_Ud5-ruVbQhgI3xBp7qhdIPY';
const MEGA_CREDENTIALS = {
    email: 'ABM19032@IIML.AC.IN',
    password: '5AxCZia_N64q:8c'
};

// Initialize MEGA storage
const storage = mega(MEGA_CREDENTIALS);

// Endpoint to receive updates from Telegram
app.use(express.json());

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

// Endpoint to handle file uploads
app.post('/upload', async (req, res) => {
    const retailerName = 'sample-retailer'; // Replace with actual retailer name from Telegram
    const chatId = '123456789'; // Replace with actual chat ID from Telegram

    try {
        const fileUrl = req.body.photo; // Assuming Telegram sends file URL
        const fileName = fileUrl.split('/').pop(); // Extract file name from URL

        // Download file locally (temporary)
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const filePath = `./uploads/${fileName}`;
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Upload file to MEGA with retailer name as folder
        const folder = await createFolderIfNeeded(retailerName);
        const fileData = fs.readFileSync(filePath);
        await folder.upload({
            name: fileName,
            data: fileData
        });

        // Cleanup: Remove temporary file
        fs.unlinkSync(filePath);

        // Respond to Telegram with success message
        await sendMessage(chatId, `Image uploaded for ${retailerName}`);

        res.status(200).send('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
});

// Function to create folder in MEGA if not exists
async function createFolderIfNeeded(folderName) {
    try {
        // Check if folder exists
        const rootNode = storage.root();
        const nodes = await rootNode.children();
        const existingFolder = nodes.find(node => node.name === folderName);

        if (existingFolder) {
            return existingFolder;
        } else {
            // Create new folder
            return await storage.mkdir(folderName);
        }
    } catch (error) {
        console.error('Error creating folder in MEGA:', error);
        throw error;
    }
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
