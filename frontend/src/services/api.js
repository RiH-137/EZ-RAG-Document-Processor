import axios from 'axios';

// Base URL for the FastAPI backend
// const BASE_URL = 'https://ez-backend-9ice.onrender.com';

// const BASE_URL = process.env.REACT_APP_BASE_URL;
const BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Upload document
  uploadDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // Ask question
  askQuestion: async (question) => {
    try {
      const response = await api.post('/ask-anything', { question });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // Generate challenge questions
  generateChallenges: async () => {
    try {
      const response = await api.post('/challenge-me');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // Evaluate answer
  evaluateAnswer: async (question, userAnswer, questionId) => {
    try {
      const response = await api.post('/evaluate-answer', {
        question,
        user_answer: userAnswer,
        question_id: questionId
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // Clear session
  clearSession: async () => {
    try {
      const response = await api.post('/clear-session');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  // Get document info
  getDocumentInfo: async () => {
    try {
      const response = await api.get('/document-info');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }
};

export default apiService;
