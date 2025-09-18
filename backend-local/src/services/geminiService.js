import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate text content using Gemini AI
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options for generation
   * @returns {Promise<string>} Generated text response
   */
  async generateText(prompt, options = {}) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      throw new Error('Failed to generate text response');
    }
  }

  /**
   * Generate text with streaming response
   * @param {string} prompt - The input prompt
   * @returns {Promise<AsyncGenerator>} Streaming response
   */
  async generateTextStream(prompt) {
    try {
      const result = await this.model.generateContentStream(prompt);
      return result.stream;
    } catch (error) {
      console.error('Error generating streaming text with Gemini:', error);
      throw new Error('Failed to generate streaming response');
    }
  }

  /**
   * Chat conversation with context
   * @param {Array} history - Previous chat messages
   * @param {string} message - Current message
   * @returns {Promise<string>} Chat response
   */
  async chat(history = [], message) {
    try {
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in chat with Gemini:', error);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Analyze and process timetable data
   * @param {Object} timetableData - Timetable information
   * @param {string} analysisType - Type of analysis to perform
   * @returns {Promise<string>} Analysis results
   */
  async analyzeTimetable(timetableData, analysisType = 'general') {
    try {
      let prompt = '';
      
      switch (analysisType) {
        case 'conflicts':
          prompt = `Analyze the following timetable data for scheduling conflicts and provide recommendations: ${JSON.stringify(timetableData)}`;
          break;
        case 'optimization':
          prompt = `Suggest optimizations for the following timetable to improve efficiency: ${JSON.stringify(timetableData)}`;
          break;
        case 'load':
          prompt = `Analyze the workload distribution in this timetable and suggest improvements: ${JSON.stringify(timetableData)}`;
          break;
        default:
          prompt = `Provide a general analysis of this timetable data: ${JSON.stringify(timetableData)}`;
      }

      return await this.generateText(prompt);
    } catch (error) {
      console.error('Error analyzing timetable:', error);
      throw new Error('Failed to analyze timetable data');
    }
  }
}

export default new GeminiService();