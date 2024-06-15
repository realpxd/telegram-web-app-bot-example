const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

app.use(bodyParser.json());
app.use(cors());

async function getUpdates() {
    try {
        const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
        const updates = response.data.result;

        if (updates.length > 0) {
            const chatId = updates[0].message.chat.id;
            console.log('Chat ID:', chatId);
        } else {
            console.log('No updates available');
        }
    } catch (error) {
        console.error('Error fetching updates:', error);
    }
}

getUpdates();

app.post('/sendMessage', async (req, res) => {
    const { chat_id, message } = req.body;

    if (!chat_id || !message) {
        return res.status(400).json({ error: 'chat_id and message are required' });
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id,
            text: message
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
