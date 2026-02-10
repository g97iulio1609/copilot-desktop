import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCopilot } from '@/hooks/useCopilot';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { StreamingIndicator } from './StreamingIndicator';
import { Bot, Cloud, ChevronDown } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';

export function ChatPanel() {
  const { inputValue, setInputValue, isStreaming, getSessionMessages } = useChatStore();
  const { activeSessionId, sessions } = useSessionStore();
  const { copilotStatus } = useSettingsStore();
  const { sendPrompt } = useCopilot(activeSessionId);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSessionId ? getSessionMessages(activeSessionId) : [];

  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const msg = inputValue;
    setInputValue('');
    sendPrompt(msg);
  }, [inputValue, isStreaming, setInputValue, sendPrompt]);

  if (!copilotStatus?.installed) {
    return <CopilotNotFound />;
  }

  if (!activeSessionId) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-6 py-6"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Cloud size={48} className="mx-auto text-neutral-600" />
              <p className="text-neutral-400 text-2xl font-semibold">
                Let's build
              </p>
              {activeSession?.working_dir && (
                <p className="text-neutral-600 text-sm font-mono">
                  {activeSession.working_dir}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <StreamingIndicator showElapsed />
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className={cn(
              'absolute -top-12 left-1/2 -translate-x-1/2',
              'flex items-center gap-1 px-3 py-1.5 rounded-full',
              'bg-neutral-800 border border-neutral-700/50 text-neutral-400',
              'text-xs hover:text-neutral-200 transition-colors shadow-lg',
            )}
          >
            <ChevronDown size={14} />
            New messages
          </button>
        </div>
      )}

      {/* Input */}
      <InputArea
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isStreaming={isStreaming}
        modelName={activeSession?.model ?? undefined}
      />
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Cloud size={48} className="mx-auto text-neutral-600" />
        <h1 className="text-2xl font-semibold text-neutral-300">
          Let's build
        </h1>
        <p className="text-neutral-600 text-sm">
          Create a new session to get started.
        </p>
      </div>
    </div>
  );
}

function CopilotNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-xl bg-amber-500/20 mx-auto flex items-center justify-center">
          <Bot size={32} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-200">
          Copilot CLI Not Found
        </h2>
        <p className="text-neutral-500 text-sm">
          Please install GitHub Copilot CLI first:
        </p>
        <code className="block bg-neutral-800 rounded-lg px-4 py-2 text-sm text-emerald-400">
          brew install copilot-cli
        </code>
      </div>
    </div>
  );
}
