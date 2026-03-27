import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000';

export interface Message {
  id?: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp?: Date;
  type?: 'text' | 'product' | 'suggestion' | 'error';
}

export interface ProductSuggestion {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  rating: number;
  description?: string;
}

export interface ChatResponse {
  message: Message;
  suggestions?: ProductSuggestion[];
}

class ChatAPI {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  private getToken(): string | null {
    return localStorage.getItem('token') || null;
  }

  async sendMessage(messages: Message[], newMessage: string): Promise<ChatResponse> {
    try {
      // Convert dates to string for API
      const apiMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString()
      }));

      const response = await this.api.post<ChatResponse>('/api/chat', {
        messages: apiMessages,
        new_message: newMessage,
        user_token: this.getToken()
      });
      
      // Convert string timestamp back to Date
      return {
        ...response.data,
        message: {
          ...response.data.message,
          timestamp: response.data.message.timestamp ? new Date(response.data.message.timestamp) : new Date()
        }
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getSuggestions(): Promise<ProductSuggestion[]> {
    try {
      const response = await this.api.get<{ suggestions: ProductSuggestion[] }>('/api/suggestions');
      return response.data.suggestions;
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('Backend connection failed:', error);
      return false;
    }
  }
}

export const chatAPI = new ChatAPI();