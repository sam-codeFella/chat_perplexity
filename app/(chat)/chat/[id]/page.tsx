import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import {Session} from "next-auth";

interface ExtendedSession extends Session {
  user: {
    id: string;
    token: string;
  } & Session['user'];
}

//this is the page that displays the chat. Be it historic or new.
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  console.log("Loaded this page dynamics. ")
  const session = (await auth()) as ExtendedSession | null;
  if (!session?.user?.id || !session.user.token) {
    return new Response('Unauthorized', { status: 401 });
  }
  console.log("calling this chat's page")

  console.log(id)
  console.log(session.user.token)

  let chat;
  let isNewChat = false;

  try {
    chat = await getChatById({ id, token: session.user.token });
    
    if (!chat) {
      notFound();
    }
  } catch (error) {
    console.log('Chat not found, likely a new chat being created:', error);
    // Create a default chat object for new chats
    isNewChat = true;
    chat = {
      id,
      userId: session.user.id,
      visibility: 'private',
      messages: [],
    };
  }

  // If it's not a new chat, do user permission checks
  if (!isNewChat && chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = chat.messages || [];

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={chat.visibility}
          isReadonly={!isNewChat && session?.user?.id !== chat.userId}
          initialTitle={isNewChat ? 'New Chat' : undefined}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie.value}
        selectedVisibilityType={chat.visibility}
        isReadonly={!isNewChat && session?.user?.id !== chat.userId}
        initialTitle={isNewChat ? 'New Chat' : undefined}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
