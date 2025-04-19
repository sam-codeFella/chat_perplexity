'use client';

import type { ChatRequestOptions, Message } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { WebSearch } from './web-search';
import { ExternalLinkIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import type { WebSearchResult, Citation } from '@/lib/types';
import { ComponentProps } from 'react';
import { voteMessage } from '@/lib/actions';
import { ThumbUpIcon, ThumbDownIcon } from './icons';
import PdfViewer from './PdfViewer';
import { usePdfDisplay } from '@/hooks/use-pdf-display';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  console.log('[PurePreviewMessage] Initializing with props:', {
    chatId,
    messageId: message.id,
    messageRole: message.role,
    messageContent: message.content?.substring(0, 50),
    vote,
    isLoading,
    isReadonly
  });

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const { showPdf } = usePdfDisplay();
  
  useEffect(() => {
    console.log('[PurePreviewMessage] Component mounted', { messageId: message.id });
    return () => {
      console.log('[PurePreviewMessage] Component unmounting', { messageId: message.id });
    };
  }, [message.id]);

  useEffect(() => {
    console.log('[PurePreviewMessage] Mode changed:', mode);
  }, [mode]);

  useEffect(() => {
    console.log('[PurePreviewMessage] isLoading changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('[PurePreviewMessage] Vote changed:', vote);
  }, [vote]);

  const handleCheckSources = async () => {
    console.log('[PurePreviewMessage] handleCheckSources clicked');
    try {
      console.log('[PurePreviewMessage] Fetching PDF from endpoint');
      const response = await fetch('http://localhost:5001/fetch-highlighted-pdf');
      console.log('[PurePreviewMessage] PDF fetch response status:', response.status);
      if (response.ok) {
        // Create a blob URL from the PDF response
        const blob = await response.blob();
        console.log('[PurePreviewMessage] Created PDF blob:', { size: blob.size });
        const pdfUrl = URL.createObjectURL(blob);
        console.log('[PurePreviewMessage] Created PDF URL:', pdfUrl);
        showPdf(pdfUrl);
      } else {
        console.error('Failed to fetch PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
    }
  };

  console.log('[PurePreviewMessage] Rendering message:', { 
    id: message.id, 
    role: message.role,
    mode,
    hasAttachments: !!(message as any).attachments?.length,
    hasCitations: !!(message as any).citations?.length,
    hasWebSearchResults: !!(message as any).webSearchResults
  });

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
        onAnimationStart={() => console.log('[PurePreviewMessage] Animation started', { messageId: message.id })}
        onAnimationComplete={() => console.log('[PurePreviewMessage] Animation completed', { messageId: message.id })}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full min-w-0">
            {mode === 'edit' ? (
              <MessageEditor
                message={message}
                setMode={(newMode) => {
                  console.log('[PurePreviewMessage] Setting mode from MessageEditor:', newMode);
                  setMode(newMode);
                }}
                setMessages={(newMessages) => {
                  console.log('[PurePreviewMessage] Setting messages from MessageEditor');
                  setMessages(newMessages);
                }}
                reload={reload}
              />
            ) : (
              <>
                {message.role === 'assistant' && (message as any).webSearchResults && (
                  <WebSearch results={(message as any).webSearchResults} />
                )}
                <div
                  className={cn(
                    'prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 w-full',
                    {
                      'max-w-none': message.role === 'assistant',
                    },
                  )}
                  data-testid="message-content"
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p>{children}</p>,
                      a: ({ href, children }) => {
                        console.log('[PurePreviewMessage] Rendering link:', href);
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      pre: ({ children }) => (
                        <div className="relative">
                          <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                            {children}
                          </pre>
                        </div>
                      ),
                      code: ({
                        inline,
                        className,
                        children,
                        ...props
                      }: ComponentProps<'code'> & { inline?: boolean }) => {
                        if (inline) {
                          return (
                            <code className="bg-muted px-1 rounded" {...props}>
                              {children}
                            </code>
                          );
                        }
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        console.log('[PurePreviewMessage] Rendering code block with language:', lang);
                        return (
                          <div className="relative">
                            {lang && (
                              <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                                {lang}
                              </div>
                            )}
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </div>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.role === 'assistant' && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('[PurePreviewMessage] Check Sources button clicked');
                        handleCheckSources();
                      }}
                      className="text-xs"
                    >
                      Check Sources
                    </Button>
                  </div>
                )}

                {message.role === 'assistant' && (message as any).citations && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="text-sm font-medium text-muted-foreground">Citations</div>
                    <div className="flex flex-wrap gap-2">
                      {((message as any).citations as Citation[]).map((citation: Citation, index: number) => {
                        console.log('[PurePreviewMessage] Rendering citation:', citation.title);
                        return (
                          <a
                            key={index}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 bg-muted/50 px-2 py-1 rounded"
                          >
                            {citation.title}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {(message as any).attachments && (message as any).attachments.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-2"
                data-testid="message-attachments"
              >
                {((message as any).attachments as Array<{ name: string; url: string; contentType: string }>).map((attachment) => {
                  console.log('[PurePreviewMessage] Rendering attachment:', attachment.name);
                  return (
                    <PreviewAttachment
                      key={attachment.name}
                      attachment={attachment}
                    />
                  );
                })}
              </div>
            )}

            {message.role === 'assistant' && !isReadonly && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log('[PurePreviewMessage] Upvote button clicked, current vote:', vote?.type);
                    if (vote?.type === 'up') return;
                    voteMessage({
                      chatId,
                      messageId: message.id,
                      type: 'up',
                    });
                  }}
                  data-testid="message-upvote"
                  className={cn('text-muted-foreground hover:text-foreground', {
                    'text-foreground': vote?.type === 'up',
                  })}
                >
                  <ThumbUpIcon size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log('[PurePreviewMessage] Downvote button clicked, current vote:', vote?.type);
                    if (vote?.type === 'down') return;
                    voteMessage({
                      chatId,
                      messageId: message.id,
                      type: 'down',
                    });
                  }}
                  data-testid="message-downvote"
                  className={cn('text-muted-foreground hover:text-foreground', {
                    'text-foreground': vote?.type === 'down',
                  })}
                >
                  <ThumbDownIcon size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    console.log('[PreviewMessage] Memo comparison:', {
      messageId: nextProps.message.id,
      isEqual: equal(prevProps.message, nextProps.message),
      prevLoading: prevProps.isLoading,
      nextLoading: nextProps.isLoading,
      prevContent: prevProps.message.content?.substring(0, 30),
      nextContent: nextProps.message.content?.substring(0, 30),
      contentEqual: prevProps.message.content === nextProps.message.content,
      reasoningEqual: prevProps.message.reasoning === nextProps.message.reasoning,
      toolInvocationsEqual: equal(prevProps.message.toolInvocations, nextProps.message.toolInvocations),
      voteEqual: equal(prevProps.vote, nextProps.vote),
    });

    if (prevProps.isLoading !== nextProps.isLoading) {
      console.log('[PreviewMessage] Re-rendering due to isLoading change');
      return false;
    }
    if (prevProps.message.reasoning !== nextProps.message.reasoning) {
      console.log('[PreviewMessage] Re-rendering due to reasoning change');
      return false;
    }
    if (prevProps.message.content !== nextProps.message.content) {
      console.log('[PreviewMessage] Re-rendering due to content change');
      return false;
    }
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    ) {
      console.log('[PreviewMessage] Re-rendering due to toolInvocations change');
      return false;
    }
    if (!equal(prevProps.vote, nextProps.vote)) {
      console.log('[PreviewMessage] Re-rendering due to vote change');
      return false;
    }

    console.log('[PreviewMessage] Skipping re-render, props are equal');
    return true;
  },
);

export const ThinkingMessage = () => {
  console.log('[ThinkingMessage] Rendering thinking message');
  const role = 'assistant';

  useEffect(() => {
    console.log('[ThinkingMessage] Component mounted');
    return () => {
      console.log('[ThinkingMessage] Component unmounting');
    };
  }, []);

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
      onAnimationStart={() => console.log('[ThinkingMessage] Animation started')}
      onAnimationComplete={() => console.log('[ThinkingMessage] Animation completed')}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
