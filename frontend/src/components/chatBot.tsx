import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Paperclip,
  Mic,
  Smile,
  AlertCircle,
  MessageCircle,
  ShoppingCart
} from 'lucide-react';
import ChatMessage from './chatMessage'; 
import { chatAPI, type Message as APIMessage } from '../services/apimcp';
import { useCart } from '@/hooks/useCart';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'product' | 'suggestion' | 'error';
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Xin chào! Tôi là SANSHIN AI, trợ lý mua sắm thông minh của cửa hàng điện thoại chính hãng SANSHIN. Tôi có thể giúp bạn tìm kiếm sản phẩm, thêm vào giỏ hàng và tư vấn mua sắm!',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sử dụng cart hook để trigger refetch
  const { markForRefetch, updateCartBadge } = useCart();

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<string[]>([
    'Điện thoại iPhone',
    'Tai nghe Sony',
    'Laptop gaming',
    'Máy ảnh Canon',
    'Xem giỏ hàng'
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const isConnected = await chatAPI.checkHealth();
      setConnectionError(!isConnected);
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionError(true);
    }
  };

  // Hàm xử lý bot response để detect cart updates
  const handleBotResponse = (content: string) => {
    // Kiểm tra nếu có trigger CART_UPDATED
    if (content.includes('[CART_UPDATED]')) {
      // Loại bỏ trigger khỏi nội dung hiển thị
      const displayContent = content.replace('[CART_UPDATED]', '').trim();
      
      // Trigger refetch giỏ hàng
      updateCartBadge({ increment: 1 });
      markForRefetch();
      console.log('Cart refetch triggered from bot message');
      
      return displayContent;
    }
    
    return content;
  };

  // Hàm xử lý khi người dùng click "Xem giỏ hàng"
  const handleViewCart = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: 'Xem giỏ hàng của tôi',
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    
    // Gọi API để xem giỏ hàng
    handleSendMessageInternal('Xem giỏ hàng của tôi');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);
    setConnectionError(false);

    await handleSendMessageInternal(inputValue);
  };

  const handleSendMessageInternal = async (message: string) => {
    try {
      const apiMessages: APIMessage[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        type: msg.type,
      }));
      
      const response = await chatAPI.sendMessage(apiMessages, message);
      
      const processedContent = handleBotResponse(response.message.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: processedContent,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
    } catch (error: any) {      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '⚠️ Không thể kết nối đến AI backend. Vui lòng đảm bảo Ollama và MCP server đang chạy.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setConnectionError(true);
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === 'Xem giỏ hàng') {
      handleViewCart();
    } else {
      setInputValue(reply);
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  const handleProductSelect = async (productName: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: `Tôi muốn biết thêm về ${productName}`,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    setConnectionError(false);
    
    await handleSendMessageInternal(`Thông tin về ${productName}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Kiểm tra token khi mở chatbot
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      if (!token) {
        const warningMessage: Message = {
          id: 'token-warning',
          content: '🔒 Vui lòng đăng nhập để sử dụng đầy đủ tính năng như thêm vào giỏ hàng.',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, warningMessage]);
      }
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Mở chatbot AI"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        <span className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          SANSHIN AI Assistant
        </span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[750px] h-[750px] bg-white rounded-2xl shadow-2xl flex flex-col animate-slide-up border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">SANSHIN AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by Ollama LLM & MCP Tools</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Đóng chatbot"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Connection Error Banner */}
          {connectionError && (
            <div className="bg-amber-50 border-b border-amber-200 p-3">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Không thể kết nối đến AI backend. Vui lòng đảm bảo Ollama và MCP server đang chạy.</span>
              </p>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onProductSelect={handleProductSelect}
                />
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  </div>
                  <span className="text-sm text-gray-500">SANSHIN AI đang suy nghĩ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Replies & Input Area */}
          <div className="p-4 border-t bg-white">
            {/* Quick Replies */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Tìm kiếm nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${
                      reply === 'Xem giỏ hàng' 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300'
                    }`}
                  >
                    {reply === 'Xem giỏ hàng' ? (
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        {reply}
                      </span>
                    ) : reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    const newMessage: Message = {
                      id: Date.now().toString(),
                      content: `Token của tôi: ${token.substring(0, 20)}...`,
                      sender: 'user',
                      timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, newMessage]);
                  }
                }}
                title="Hiển thị token"
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Smile className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-200 transition-all placeholder:text-gray-500"
                  disabled={isTyping}
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                  aria-label="Ghi âm"
                  disabled={isTyping}
                >
                  <Mic className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
              <Bot className="w-3 h-3" />
              SANSHIN AI • Powered by Ollama LLM • Real-time Cart Updates
            </p>
          </div>
        </div>
      )}
    </>
  );
}