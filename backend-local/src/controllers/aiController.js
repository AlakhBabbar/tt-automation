import geminiService from '../services/geminiService.js';

class AIController {
  /**
   * Generate text using AI
   */
  async generateText(req, res) {
    try {
      const { prompt, options } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const result = await geminiService.generateText(prompt, options);
      
      res.json({
        success: true,
        data: {
          response: result,
          prompt: prompt
        }
      });
    } catch (error) {
      console.error('Error in generateText controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate text response'
      });
    }
  }

  /**
   * Start a chat conversation
   */
  async chat(req, res) {
    try {
      const { message, history = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const response = await geminiService.chat(history, message);
      
      res.json({
        success: true,
        data: {
          response: response,
          message: message
        }
      });
    } catch (error) {
      console.error('Error in chat controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat message'
      });
    }
  }

  /**
   * Analyze timetable data
   */
  async analyzeTimetable(req, res) {
    try {
      const { timetableData, analysisType = 'general' } = req.body;
      
      if (!timetableData) {
        return res.status(400).json({
          success: false,
          error: 'Timetable data is required'
        });
      }

      const analysis = await geminiService.analyzeTimetable(timetableData, analysisType);
      
      res.json({
        success: true,
        data: {
          analysis: analysis,
          analysisType: analysisType
        }
      });
    } catch (error) {
      console.error('Error in analyzeTimetable controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze timetable data'
      });
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(req, res) {
    try {
      // Simple test prompt to verify AI service is working
      const testResponse = await geminiService.generateText('Hello, respond with "AI service is working"');
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          message: 'AI service is operational',
          testResponse: testResponse
        }
      });
    } catch (error) {
      console.error('Error in AI health check:', error);
      res.status(500).json({
        success: false,
        error: 'AI service health check failed'
      });
    }
  }
}

export default new AIController();