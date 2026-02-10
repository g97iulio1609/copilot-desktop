import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Bot, User, Send, Sparkles } from 'lucide-react';
import { useRef, useEffect } from 'react';

export function ChatPanel() {
  const { messages, inputValue, setInputValue, isStreaming } = useChatStore();
  const { activeSessionId } = useSessionStore();
  const { copilotStatus } = useSettingsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    // Will be connected to PTY in Phase 2
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!copilotStatus?.installed) {
    return <CopilotNotFound />;
  }

  if (!activeSessionId) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-3xl',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-emerald-600/20 text-emerald-400'
              )}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={cn(
                'rounded-xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-zinc-200'
                  : 'bg-zinc-800/80 text-zinc-300'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/50 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot anything..."
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl bg-zinc-800/60 border border-zinc-700/50',
              'px-4 py-3 pr-12 text-sm text-zinc-200 placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent',
              'transition-all'
            )}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'p-1.5 rounded-lg transition-colors',
              inputValue.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'text-zinc-600'
            )}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
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
