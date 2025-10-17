// Simple chat API service for EarlyMind
// This can be expanded to use OpenAI, Azure OpenAI, or other AI services

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Simple predefined responses for demo purposes
const DEMO_RESPONSES = [
  "That's wonderful! Tell me more about that.",
  "How interesting! What do you think about that?",
  "I love hearing about your day. What happened next?",
  "That sounds exciting! How did that make you feel?",
  "Wow! You're so smart. Can you tell me more?",
  "That's a great question! What do you think the answer might be?",
  "I'm so proud of you! Keep telling me your story.",
  "That's amazing! I love learning new things with you.",
  "You're such a good storyteller! What else can you share?",
  "That's so cool! I bet you have more interesting things to tell me."
];

class ChatService {
  constructor() {
    this.conversationHistory = [];
  }

  async sendMessage(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // For demo purposes, use predefined responses
      if (!API_KEY) {
        return this.getDemoResponse(userMessage);
      }

      // If API key is available, use OpenAI API
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are Milo, a friendly AI companion for children aged 4-8. 
                       Your responses should be:
                       - Warm, encouraging, and age-appropriate
                       - Simple and easy to understand
                       - Educational but fun
                       - Never more than 2-3 sentences
                       - Always positive and supportive
                       You help children learn, play, and express themselves.`
            },
            ...this.conversationHistory.slice(-10) // Keep last 10 messages for context
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const botMessage = data.choices[0]?.message?.content || this.getRandomDemoResponse();

      // Add bot response to history
      this.conversationHistory.push({ role: 'assistant', content: botMessage });

      return botMessage;
    } catch (error) {
      console.error('Chat API error:', error);
      return this.getDemoResponse(userMessage);
    }
  }

  getDemoResponse(userMessage) {
    // Simple keyword-based responses for demo
    const message = userMessage.toLowerCase();
    
    if (message.includes('happy') || message.includes('good') || message.includes('great')) {
      return "That's wonderful! I love hearing when you're happy. What's making you feel so good?";
    }
    
    if (message.includes('sad') || message.includes('bad') || message.includes('upset')) {
      return "I'm sorry you're feeling sad. Sometimes talking about it helps. Would you like to tell me what's wrong?";
    }
    
    if (message.includes('school') || message.includes('learn')) {
      return "School sounds exciting! What's your favorite thing to learn about? I love learning new things too!";
    }
    
    if (message.includes('play') || message.includes('game') || message.includes('fun')) {
      return "Playing is so much fun! What kind of games do you like to play? Maybe we can play together!";
    }
    
    if (message.includes('family') || message.includes('mom') || message.includes('dad')) {
      return "Families are special! I bet they love you very much. Tell me something fun about your family!";
    }
    
    // Default random response
    return this.getRandomDemoResponse();
  }

  getRandomDemoResponse() {
    const randomIndex = Math.floor(Math.random() * DEMO_RESPONSES.length);
    return DEMO_RESPONSES[randomIndex];
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export default new ChatService();