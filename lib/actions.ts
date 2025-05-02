'use server';

import { Vote } from './types';
import { auth } from '@/app/(auth)/auth';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  user: {
    id: string;
    token: string;
  } & Session['user'];
}

export async function voteMessage({ chatId, messageId, type }: Vote) {
  try {
    const session = (await auth()) as ExtendedSession | null;
    if (!session?.user?.id || !session.user.token) {
      throw new Error('Unauthorized');
    }

    // Use the direct API endpoint instead of the Next.js API route
    const response = await fetch(`http://localhost:8000/chats/${chatId}/messages/${messageId}/vote`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.token}`
      },
      body: JSON.stringify({ type })
    });

    if (!response.ok) {
      throw new Error('Failed to vote');
    }

    return await response.json();
  } catch (error) {
    console.error('Error voting:', error);
    throw error;
  }
}

export async function fetchCitations(params: {
  file_path: string;
  page_number: number;
  chunk_id: string;
}): Promise<Blob> {
  try {
    const session = (await auth()) as ExtendedSession | null;
    if (!session?.user?.id || !session.user.token) {
      throw new Error('Unauthorized');
    }
    
    const response = await fetch('http://localhost:8000/chats/citations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.token}`
        // The session token will be automatically handled by the server middleware
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch citations: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error fetching citations:', error);
    throw error;
  }
} 