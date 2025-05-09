'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { FinancialCharts } from './FinancialCharts';
import { KeyFinancialInfo } from './KeyFinancialInfo';
import { PdfDisplayProvider } from '@/hooks/use-pdf-display';
import PdfSidePanel from './PdfSidePanel';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  initialTitle,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  initialTitle?: string;
}) {
  const { mutate } = useSWRConfig();
  const [title, setTitle] = useState(initialTitle || 'New Chat');

  useEffect(() => {
    // Get the company name from localStorage if it exists
    const storedTitle = localStorage.getItem('currentChatTitle');
    if (storedTitle) {
      setTitle(storedTitle);
      // Clear the stored title after using it
      localStorage.removeItem('currentChatTitle');
    }
  }, []);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: () => {
      toast.error('An error occured, please try again!');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <PdfDisplayProvider>
      <>
        <div className="flex flex-col min-w-0 h-dvh bg-background overflow-hidden">
          <ChatHeader
            chatId={id}
            selectedModelId={selectedChatModel}
            selectedVisibilityType={selectedVisibilityType}
            isReadonly={isReadonly}
            title={title}
            onTitleChange={setTitle}
          />

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col">
              {/* Financial Charts Section */}
              <div className="mx-auto w-full md:max-w-3xl px-4">
                <FinancialCharts companyName={title} />
              </div>

              {/* Key Financial Information Section */}
              <div className="mx-auto w-full md:max-w-3xl px-4">
                <KeyFinancialInfo companyName={title} />
              </div>

              <Messages
                chatId={id}
                status={status}
                votes={votes}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                isArtifactVisible={isArtifactVisible}
              />
            </div>
          </div>

          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            )}
          </form>
        </div>

        {/* Add the PDF Side Panel */}
        <PdfSidePanel />

        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      </>
    </PdfDisplayProvider>
  );
}
