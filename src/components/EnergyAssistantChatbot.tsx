import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Bot, Send, X, Minimize2, Maximize2, MessageCircle, Lightbulb, Zap, TrendingDown, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'tip' | 'analysis' | 'question' | 'response';
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function EnergyAssistantChatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: "👋 Hi! I'm your AI Energy Assistant. I can help you with energy-saving tips, analyze your usage patterns, answer questions about reducing your electricity bills, and provide personalized recommendations. How can I help you today?",
        isBot: true,
        timestamp: new Date(),
        type: 'question'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return "Please log in to use the AI assistant.";
      }
      
      // Call the AI chatbot endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd6686dd/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Failed to parse error response:', e);
          return getFallbackResponse(userMessage);
        }
        
        console.error('AI chat error:', errorData);
        
        // Check if it's an API key issue
        if (errorData.fallback) {
          return "🔑 **API Key Setup Required**\n\nTo use AI-powered responses, please add your AI API key:\n\n1. Get a free key at: https://aistudio.google.com/app/apikey\n2. The system will prompt you to add it\n\nFor now, I can provide basic energy-saving tips. How can I help?";
        }
        
        // Fallback to basic responses if AI fails
        return getFallbackResponse(userMessage);
      }
      
      const data = await response.json();
      
      if (data.fallback || !data.response) {
        // Show helpful message about API key setup
        if (data.fallback) {
          return "🔑 **AI Features Available!**\n\nTo unlock AI-powered insights, add your AI API key.\n\nGet one free at: https://aistudio.google.com/app/apikey\n\nIn the meantime, I can still help with basic energy questions!";
        }
        return getFallbackResponse(userMessage);
      }
      
      return data.response;
      
    } catch (error) {
      console.error('Error calling AI chat:', error);
      return getFallbackResponse(userMessage);
    }
  };
  
  // Fallback responses when AI is unavailable
  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('tip') || lowerMessage.includes('save') || lowerMessage.includes('reduce')) {
      const tips = [
        "💡 Switch to LED bulbs - they use 75% less energy and last 25 times longer than incandescent bulbs!",
        "🌡️ Adjust your thermostat by 2-3°F. You can save 10-15% on heating and cooling costs with this simple change.",
        "🔌 Unplug electronics when not in use. Many devices draw 'phantom power' even when turned off.",
        "🏠 Seal air leaks around windows and doors. This can reduce your energy bills by up to 20%.",
        "⏰ Use a programmable thermostat to automatically adjust temperature when you're away.",
        "🌙 Take advantage of off-peak hours. Run dishwashers and washing machines during cheaper rate periods."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    if (lowerMessage.includes('bill') || lowerMessage.includes('cost') || lowerMessage.includes('money')) {
      return "💰 To reduce your electricity bill: 1) Monitor your usage patterns, 2) Replace old appliances with ENERGY STAR certified ones, 3) Use natural light during the day, 4) Set water heater to 120°F, and 5) Consider solar panels for long-term savings.";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return "Hello! 🌟 I'm here to help you save energy and money. You can ask me about:\n• Energy-saving tips\n• Bill reduction strategies\n• Appliance efficiency\n• Usage analysis\n• Environmental impact\n\nWhat would you like to know?";
    }
    
    // Default response
    return "🤔 I'm having trouble connecting to my AI brain right now, but I can still help with basic energy questions! Try asking me about energy-saving tips, reducing your electricity bill, or appliance efficiency.";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
      type: 'question'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponseText = await generateBotResponse(inputMessage);
      
      // Add bot response immediately (no artificial delay since API has its own latency)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
        type: 'tip'
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date(),
        type: 'response'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { text: "💡 Give me energy tips", icon: Lightbulb },
    { text: "📊 Analyze my usage", icon: TrendingDown },
    { text: "⚡ How to reduce my bill?", icon: Zap },
    { text: "🌍 Environmental impact tips", icon: Bot }
  ];

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'tip': return '💡';
      case 'analysis': return '📊';
      case 'question': return '❓';
      default: return '🤖';
    }
  };

  const getMessageBadge = (type?: string) => {
    switch (type) {
      case 'tip': return <Badge className="bg-green-100 text-green-800 text-xs">Tip</Badge>;
      case 'analysis': return <Badge className="bg-blue-100 text-blue-800 text-xs">Analysis</Badge>;
      case 'question': return <Badge className="bg-purple-100 text-purple-800 text-xs">Question</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 text-xs">Response</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <Card className={`fixed bottom-20 right-6 w-96 shadow-2xl border-2 bg-white z-50 transition-all duration-300 chatbot-enter ${
      isMinimized ? 'h-16' : 'h-[500px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1">
              Energy Assistant
              <Sparkles className="h-3 w-3" />
            </h3>
            <p className="text-xs text-blue-100">AI-powered energy advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 h-[340px] p-4 chatbot-scroll">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] ${message.isBot ? 'order-1' : 'order-2'}`}>
                    {message.isBot && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{getMessageIcon(message.type)}</span>
                        {getMessageBadge(message.type)}
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg text-sm leading-relaxed chatbot-message ${
                        message.isBot
                          ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                          : 'bg-blue-500 text-white rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.isBot ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 max-w-[85%] border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 text-center">Quick actions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputMessage(action.text);
                          setTimeout(handleSendMessage, 100);
                        }}
                        className="justify-start text-xs h-8 text-left"
                      >
                        <action.icon className="h-3 w-3 mr-2" />
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about energy savings..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • AI-powered energy assistant
            </p>
          </div>
        </>
      )}
    </Card>
  );
}

// Floating Chatbot Toggle Button
export function ChatbotToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-40 transition-all duration-300 ${
        isOpen 
          ? 'bg-gray-500 hover:bg-gray-600 rotate-180' 
          : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 chatbot-glow'
      }`}
    >
      {isOpen ? (
        <X className="h-6 w-6 text-white" />
      ) : (
        <div className="relative">
          <MessageCircle className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full chatbot-notification"></div>
        </div>
      )}
    </Button>
  );
}