import { Message as AIMessage } from 'ai';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Citation {
  title: string;
  url: string;
}

export interface Vote {
  type: 'up' | 'down';
  messageId: string;
  chatId: string;
}

export interface Message extends AIMessage {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant';
  webSearchResults?: WebSearchResult[];
  citations?: Citation[];
  attachments?: Array<{
    name: string;
    url: string;
    contentType: string;
  }>;
} 