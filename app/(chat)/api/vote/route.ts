import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { Vote } from '@/lib/types';
import {Session} from "next-auth";

interface ExtendedSession extends Session {
  user: {
    id: string;
    token: string;
  } & Session['user'];
}

//This is the route to get the votes for a given chat id.\
//need to make changes in the backend to include this table and establish this relationship with the backend for all messages being sent. 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const session = (await auth()) as ExtendedSession | null;
  if (!session?.user?.id || !session.user.token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const chat = await getChatById({ id: chatId, token: session.user.token });

  if (!chat) {
    return new Response('Chat not found', { status: 404 });
  }

 /*
 This check makes no sense , it is already authenticated.
 if (chat.userId !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }*/

  const votes = await getVotesByChatId({ id: chatId, token: session.user.token });

  return Response.json(votes, { status: 200 });
}

//This is the route to vote for a given message.
export async function POST(request: Request) {
  try {
    const { chatId, messageId, type }: Vote = await request.json();

    if (!chatId || !messageId || !type) {
      return new Response('chatId, messageId and type are required', { status: 400 });
    }

    const session = (await auth()) as ExtendedSession | null;
    if (!session?.user?.id || !session.user.token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const chat = await getChatById({ id: chatId, token: session.user.token });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const vote = await voteMessage({ chatId, messageId, type, token: session.user.token });

    return Response.json(vote, { status: 200 });
  } catch (error) {
    console.error('Error voting:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Alias PATCH to POST for backward compatibility
export const PATCH = POST;
