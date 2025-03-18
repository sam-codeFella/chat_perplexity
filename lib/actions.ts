'use server';

import { Vote } from './types';

export async function voteMessage({ chatId, messageId, type }: Vote) {
  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, messageId, type }),
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