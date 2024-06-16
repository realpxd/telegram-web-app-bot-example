const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const allowedOrigins = ['https://realpxd.github.io', 'https://api.telegram.org', 'https://core.telegram.org', 'https://web.telegram.org', 'https://t.me', 'https://telegram.org', 'https://telegram.me', 'https://telegram.dog', 'http://127.0.0.1', 'http://localhost'];

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.options('*', cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

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

app.post("/new-message", function (req, res) {
    const { message } = req.body

    if (!message) {
        return res.end()
    }
    var msgtosend = "lalalalala"
    if (message.text.toLowerCase() == "hi") {
        msgtosend = "Hello"
    } else if (message.text.toLowerCase() == "bye") {
        msgtosend = "Goodbye"
    } else if (message.text.toLowerCase() == "/start") {
        msgtosend = "Welcome to the bot"
    } else if (message.text.toLowerCase() == "/help") {
        msgtosend = "This is a help message"
    } else {
        msgtosend += ", I don't understand"
    }

    axios
        .post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: message.chat.id,
                text: msgtosend,
            }
        )
        .then((response) => {
            console.log("Message posted")
            res.end("ok")
        })
        .catch((err) => {
            console.log("Error :", err)
            res.end("Error :" + err)
        })
})

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

function parseQueryString(queryString) {
    return queryString.split('&').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
        return acc;
    }, {});
}

app.post('/api', (req, res) => {
    const { method, ...data } = req.body;

    switch (method) {
        case 'sendMessage':
            if (!data._auth) {
                return res.status(400).json({ error: 'Missing auth data' });
            }

            // Extract user data from the _auth field
            const authData = parseQueryString(data._auth);
            const user = JSON.parse(authData.user);
            const chat_id = user.id; // User ID from the parsed auth data
            const message = data.msg_id || 'Default message'; // Message to be sent

            // Call the Telegram Bot API to send the message
            fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chat_id,
                    text: message
                })
            })
                .then(response => response.json())
                .then(result => {
                    if (result.ok) {
                        res.json({ response: { ok: true, description: 'Message sent successfully', data: req.body } });
                    } else {
                        res.status(500).json({ error: result.description });
                    }
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                    res.status(500).json({ error: 'Error sending message' });
                });

            break;

        case 'changeMenuButton':
            // Handle changeMenuButton request
            res.json({ response: { ok: true, description: 'Menu button changed successfully', data: req.body } });
            break;

        case 'checkInitData':
            // Handle checkInitData request
            res.json({ ok: true, description: 'Init data is correct', data: req.body });
            break;

        default:
            res.status(400).json({ error: 'Unknown method' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});