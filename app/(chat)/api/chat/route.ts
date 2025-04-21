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

    const assistantMessage = chatData.messages?.find((msg: ExternalMessage) => msg.role === 'assistant');

    const tokens = [
      "Dubai ", "is ", "a ", "vibrant ", "city ", "in ", "the ", "United ", "Arab ", "Emirates ", "(UAE), ",
      "known ", "for ", "its ", "modern ", "architecture, ", "luxury ", "shopping, ", "and ", "bustling ", "nightlife. ",
      "Here ", "are ", "some ", "key ", "highlights:\n\n",
      "1. ", "**Architecture**: ", "Home ", "to ", "the ", "Burj ", "Khalifa, ", "the ", "tallest ", "building ", "in ", "the ", "world, ", "and ", "the ", "Burj ", "Al ", "Arab, ", "a ", "luxury ", "hotel ", "shaped ", "like ", "a ", "sail.\n\n",
      "2. ", "**Shopping**: ", "Famous ", "for ", "its ", "shopping ", "malls, ", "including ", "the ", "Dubai ", "Mall, ", "which ", "features ", "an ", "aquarium, ", "ice ", "rink, ", "and ", "numerous ", "high-end ", "stores.\n\n",
      "3. ", "**Culture**: ", "A ", "blend ", "of ", "traditional ", "and ", "modern ", "influences, ", "with ", "attractions ", "like ", "the ", "Dubai ", "Museum ", "and ", "the ", "historic ", "Al ", "Fahidi ", "neighborhood.\n\n",
      "4. ", "**Tourism**: ", "Popular ", "tourist ", "destination ", "with ", "attractions ", "like ", "the ", "Palm ", "Jumeirah, ", "desert ", "safaris, ", "and ", "various ", "theme ", "parks.\n\n",
      "5. ", "**Economy**: ", "A ", "major ", "business ", "hub ", "in ", "the ", "Middle ", "East, ", "known ", "for ", "its ", "oil ", "wealth, ", "but ", "increasingly ", "diversified ", "into ", "tourism, ", "aviation, ", "and ", "finance.\n\n",
      "6. ", "**Climate**: ", "Desert ", "climate ", "with ", "extremely ", "hot ", "summers ", "and ", "mild ", "winters, ", "making ", "winter ", "the ", "peak ", "tourist ", "season.\n\n",
      "Dubai ", "is ", "a ", "city ", "of ", "contrasts, ", "combining ", "tradition ", "with ", "innovation, ", "making ", "it ", "a ", "unique ", "destination ", "for ", "visitors."
    ];

    /*return createDataStreamResponse({
      status: 200,
      statusText: 'OK',
      headers: {
        'Custom-Header': 'value',
      },
      async execute(dataStream) {
        // Write data
        dataStream.writeData({ value: 'Hello' });

        // Write annotation
        dataStream.writeMessageAnnotation({ type: 'status', value: 'processing' });

      },
      onError: (error: unknown) => {
        if (error instanceof Error) {
          return `Custom error: ${error.message}`;
        }
        return 'An unknown error occurred';
      },
    });*/

    // Create the stream
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Send initial messageId
        dataStream.write(`f:${JSON.stringify({ messageId: "msg-Tsevbd35brzfTXH1RCsiKfQA" })}\n`);

        // Stream each token as a separate message
        for (const token of assistantMessage.content) {
          dataStream.write(`0:${JSON.stringify(token)}\n`);
          // Optional: await new Promise(res => setTimeout(res, 10)); // For streaming effect
        }

        // Send the finish reason and usage
        dataStream.write(`e:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 548, completionTokens: 234 },
          isContinued: false
        })}\n`);

        // Send the d field if required
        dataStream.write(`d:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 548, completionTokens: 234 }
        })}\n`);
      }
    });

   /* return createDataStreamResponse({
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


                  dataStream.writeData({
                    type: 'text',
                    content: word + ' '
                  });
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
    });*/




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
