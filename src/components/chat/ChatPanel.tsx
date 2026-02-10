import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCopilot } from '@/hooks/useCopilot';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { StreamingIndicator } from './StreamingIndicator';
import { Bot, Sparkles, ChevronDown, FolderOpen } from 'lucide-react';
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  // Detect if user scrolled up
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
    <div className="flex-1 flex flex-col">
      {/* Session header */}
      {activeSession && (
        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-zinc-800/50">
          <h2 className="text-sm font-medium text-zinc-300 truncate">
            {activeSession.name}
          </h2>
          {activeSession.working_dir && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-600 truncate">
              <FolderOpen size={11} />
              {activeSession.working_dir}
            </span>
          )}
          {activeSession.model && (
            <span className="ml-auto text-[11px] text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded">
              {activeSession.model}
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Sparkles size={48} className="mx-auto text-blue-500/50" />
              <p className="text-zinc-500 text-lg">
                Start a conversation with Copilot
              </p>
              <p className="text-zinc-600 text-sm max-w-md">
                Ask me to build, edit, debug, or explain code. I can access your
                files, run commands, and create pull requests.
              </p>
            </div>
          </div>
        )}

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
              'bg-zinc-800 border border-zinc-700/50 text-zinc-400',
              'text-xs hover:text-zinc-200 transition-colors shadow-lg',
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
      <div className="text-center space-y-6 max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 mx-auto flex items-center justify-center">
          <Sparkles size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-200">
          Welcome to Copilot Desktop
        </h1>
        <p className="text-zinc-500">
          A beautiful desktop interface for GitHub Copilot CLI. Create a new
          session to get started.
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
        <h2 className="text-xl font-semibold text-zinc-200">
          Copilot CLI Not Found
        </h2>
        <p className="text-zinc-500 text-sm">
          Please install GitHub Copilot CLI first:
        </p>
        <code className="block bg-zinc-800 rounded-lg px-4 py-2 text-sm text-emerald-400">
          brew install copilot-cli
        </code>
      </div>
    </div>
  );
}
