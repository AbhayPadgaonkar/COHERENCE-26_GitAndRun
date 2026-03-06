// app/api/chat/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { citizenRtiData } from '@/lib/mydata'; // Adjust path if your lib is elsewhere

export async function POST(req) {
  try {
    // 1. Extract the user's message from the request body
    const { message } = await req.json();

    // 2. Initialize Gemini AI securely on the server
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-1.5-flash as it is fast and excellent for text tasks
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    // 3. Construct the prompt by injecting your RTI data
    const prompt = `
      You are the LokNidhi Citizen Assistant, a helpful AI for the Government of India's public finance portal.
      Use the following official RTI data to answer the citizen's query. 
      Be polite, concise, and helpful. 
      If the user asks something not covered in the data, gently inform them that you only have access to current RTI public records. Do not invent financial data.

      Official Data:
      ${citizenRtiData}

      Citizen Query: "${message}"
    `;

    // 4. Call the Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 5. Send the response back to the frontend
    return new Response(JSON.stringify({ reply: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch response from AI." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}