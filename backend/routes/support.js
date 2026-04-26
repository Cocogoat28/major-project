// import express from 'express';
// import { OpenAI } from 'openai';

// const router = express.Router();
// // ... rest of the file


// // Initialize OpenAI client
// // It will automatically use the OPENAI_API_KEY environment variable
// const openai = new OpenAI();

// // System prompt to define the bot's persona and knowledge base
// const systemPrompt = `You are "CarParking Support Bot," a friendly and helpful virtual assistant for a car parking space booking application.
// Your name is CarParking Support Bot.
// Your primary function is to answer user questions about the application's features, such as:
// 1.  **Booking a Parking Space:** Users can search for available parking spots by location and time, view details, and book a slot.
// 2.  **Registration and Login:** Users can register as a 'Buyer' (to book) or a 'Provider' (to list a space).
// 3.  **KYC Process:** Providers must complete a Know Your Customer (KYC) process to verify their identity and parking space details before listing.
// 4.  **Payment:** Payments are handled securely through the app.
// 5.  **Notifications:** Users receive notifications for booking confirmations, cancellations, and other important updates.
// 6.  **Roles:** There are two main roles: Buyer (user who books) and Provider (user who lists a space).

// Keep your answers concise, encouraging, and directly related to the app's functionality. If a question is outside the scope of the app (e.g., general car maintenance), politely state that you can only help with questions related to the CarSix parking app.`;

// /**
//  * @route POST /api/support/chat
//  * @desc Handles user messages and returns a bot response using the LLM
//  * @access Public (or authenticated, depending on desired security)
//  */
// router.post('/chat', async (req, res) => {
//     const { message, history } = req.body;

//     if (!message) {
//         return res.status(400).json({ error: 'Message is required' });
//     }

//     try {
//         // Construct the messages array for the OpenAI API
//         const messages = [
//             { role: 'system', content: systemPrompt },
//             // Add previous history for context
//             ...(history || []).map(msg => ({ role: msg.sender, content: msg.text })),
//             // Add the new user message
//             { role: 'user', content: message }
//         ];

//         const completion = await openai.chat.completions.create({
//             model: 'gpt-4.1-mini', // Using a fast and capable model
//             messages: messages,
//             temperature: 0.7,
//             max_tokens: 300,
//         });

//         const botResponse = completion.choices[0].message.content;

//         res.json({ response: botResponse });

//     } catch (error) {
//         console.error('Error communicating with OpenAI API:', error);
//         res.status(500).json({ error: 'Failed to get a response from the support bot.' });
//     }
// });

// // module.exports = router;
// export default router;




import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Initialize GoogleGenAI client
// It will automatically use the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

// System prompt to define the bot's persona and knowledge base
const systemPrompt = `You are "CarParking Support Bot," a friendly and helpful virtual assistant for a car parking space booking application.
Your name is CarParking Support Bot.
Your primary function is to answer user questions about the application's features, such as:
1.  **Booking a Parking Space:** Users can search for available parking spots by location and time, view details, and book a slot.
2.  **Registration and Login:** Users can register as a 'Buyer' (to book) or a 'Provider' (to list a space).
3.  **KYC Process:** Providers must complete a Know Your Customer (KYC) process to verify their identity and parking space details before listing.
4.  **Payment:** Payments are handled securely through the app.
5.  **Notifications:** Users receive notifications for booking confirmations, cancellations, and other important updates.
6.  **Roles:** There are two main roles: Buyer (user who books) and Provider (user who lists a space).

Keep your answers concise, encouraging, and directly related to the app's functionality. If a question is outside the scope of the app (e.g., general car maintenance), politely state that you can only help with questions related to the CarSix parking app.`;

/**
 * Converts the chat history format from the frontend to the Gemini API format.
 * The frontend history is an array of { sender: 'user' | 'assistant', text: string }.
 * The Gemini API expects an array of { role: 'user' | 'model', parts: [{ text: string }] }.
 * @param {Array<{ sender: 'user' | 'assistant', text: string }>} history
 * @returns {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>}
 */
const convertHistoryToGeminiFormat = (history) => {
    return (history || []).map(msg => ({
        role: msg.sender === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));
};

/**
 * @route POST /api/support/chat
 * @desc Handles user messages and returns a bot response using the LLM
 * @access Public (or authenticated, depending on desired security)
 */
router.post('/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Start a new chat session with the system instruction
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash', // A fast and capable model for chat
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                maxOutputTokens: 300,
            }
        });

        // Convert and send the history to the chat session
        const geminiHistory = convertHistoryToGeminiFormat(history);
        if (geminiHistory.length > 0) {
            // The Gemini API handles history by sending it all at once or by using the chat object's history.
            // For a stateless API endpoint like this, we'll pass the history and the new message.
            // The `sendMessage` method will handle the full conversation context.
            // However, the `sendMessage` method is for a single turn. To maintain history in a stateless way,
            // we'll construct the full conversation history and use `generateContent`.

            // For a simple stateless chat endpoint, the most straightforward way is to use `generateContent`
            // with the full history + new message, and the system instruction in the config.
            const contents = [
                ...geminiHistory,
                { role: 'user', parts: [{ text: message }] }
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.7,
                    maxOutputTokens: 300,
                }
            });

            const botResponse = response.text;
            res.json({ response: botResponse });
        } else {
            // If no history, just send the new message
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: message }] }],
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.7,
                    maxOutputTokens: 300,
                }
            });

            const botResponse = response.text;
            res.json({ response: botResponse });
        }

    } catch (error) {
        console.error('Error communicating with Gemini API:', error);
        res.status(500).json({ error: 'Failed to get a response from the support bot.' });
    }
});

// module.exports = router;
export default router;
