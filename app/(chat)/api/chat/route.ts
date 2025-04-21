import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
  StreamTextResult,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById, getChatsByUserId,
} from '@/lib/db/queries';
import {
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  user: {
    id: string;
    token: string;
  } & Session['user'];
}

interface ExternalMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export const maxDuration = 60;

//This is the post request with all the details sent during every message is sent.
export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModel: string;
    } = await request.json();

    const session = (await auth()) as ExtendedSession | null;

    if (!session?.user?.id || !session.user.token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Call the external chat API
    const response = await fetch('http://localhost:8000/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.token}`,
      },
      body: JSON.stringify({
        id,
        message: {
          id: userMessage.id,
          content: userMessage.content
        }
      })
    });

    if (!response.ok) {
      return new Response('Failed to create chat', { status: response.status });
    }

    // Get chat data for use in the streaming process
    const chatData = await response.json();

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Extract assistant message from the response
        const assistantMessage = chatData.messages?.find((msg: ExternalMessage) => msg.role === 'assistant');
        
        if (assistantMessage?.content) {
          // Stream content from the external API using StreamTextResult
          // Split into words to simulate streaming behavior
          const words = assistantMessage.content.split(/\s+/);
          for (const word of words) {

            dataStream.writeData({
              type: 'text-delta',
                content: word + " " });
            await new Promise(res => setTimeout(res, 50)); // Simulate delay

            /*await new Promise(resolve => setTimeout(resolve, 20)); // Simulate streaming delay
            dataStream.writeData({
              type: 'text',
              content: word + ' '
            });*/
          }
          
          // Mark the stream as finished
          dataStream.writeData({
            type: 'finish'
          });
        } else {
          // If no external API response, use the AI SDK's streamText
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel }),
            messages,
            maxSteps: 5,
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : [
                    'getWeather',
                    'createDocument',
                    'updateDocument',
                    'requestSuggestions',
                  ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });
          
          result.consumeStream();
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        }
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = (await auth()) as ExtendedSession | null;
  if (!session?.user?.id || !session.user.token) {
    return new Response('Unauthorized', { status: 401 });
  }

  /*
  This is older code.
  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }*/

  try {
    //const chats = await getChatsByUserId({ id: session.user.id, token: session.user.token });
    const chat = await getChatById({ id, token: session.user.token });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
