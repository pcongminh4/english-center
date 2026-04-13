import Groq from 'groq-sdk';

// Initialize Groq AI client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Get the model (default to llama-4-scout)
export const model = groq;

// Model name to use
export const MODEL_NAME = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

// Timeout for AI grading requests (in milliseconds)
export const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT_MS || '30000');

// Azure Speech Configuration
export const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY!;
export const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';
export const AZURE_SPEECH_ENABLE_PROSODY = process.env.AZURE_SPEECH_ENABLE_PROSODY !== 'false';
export const AZURE_TIMEOUT_MS = parseInt(process.env.AZURE_TIMEOUT_MS || '60000');
