const { GoogleGenerativeAI } = require("@google/generative-ai");
const AppError = require("../utils/AppError");

let genAI = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError(
      "AI features are not configured. Set GEMINI_API_KEY in your environment.",
      503
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = () => {
  const client = getClient();
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  });
};

/**
 * Generates a full-length, structured blog post from a topic/prompt.
 */
async function generateBlog({ topic, tone = "informative", length = "medium" }) {
  if (!topic) throw new AppError("A topic is required to generate a blog.", 400);

  const lengthGuide =
    { short: "300-450 words", medium: "600-900 words", long: "1200-1600 words" }[
      length
    ] || "600-900 words";

  const prompt = `You are a professional blog writer. Write a well-structured, original blog post.
Topic: "${topic}"
Tone: ${tone}
Target length: ${lengthGuide}

Respond ONLY with strict JSON (no markdown fences, no preamble) in this exact shape:
{
  "title": "string",
  "content": "string with the full blog post, using \\n for paragraph breaks",
  "tags": ["string", "string", "string"],
  "summary": "one to two sentence summary"
}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}

/**
 * Produces a concise abstract/summary of a longer piece of content.
 */
async function summarizeContent({ content, maxSentences = 3 }) {
  if (!content) throw new AppError("Content is required to summarize.", 400);

  const prompt = `Summarize the following article in at most ${maxSentences} sentences.
Respond ONLY with strict JSON (no markdown fences): {"summary": "string"}

Article:
"""
${content}
"""`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}

/**
 * Answers a reader FAQ / support question about the platform or a post.
 */
async function answerFAQ({ question, context = "" }) {
  if (!question) throw new AppError("A question is required.", 400);

  const prompt = `You are a helpful assistant for a blogging platform called BlogNest.
${context ? `Relevant context:\n${context}\n` : ""}
Answer the reader's question clearly and concisely.
Respond ONLY with strict JSON: {"answer": "string"}

Question: "${question}"`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJsonResponse(text);
}

function parseJsonResponse(rawText) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new AppError("AI service returned an unexpected response format.", 502);
  }
}

module.exports = { generateBlog, summarizeContent, answerFAQ };
