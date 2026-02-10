import { useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { tauriApi } from '@/lib/tauri';
import { useChatStore } from '@/stores/chatStore';
import type { PtyEvent } from '@/types';

export function useCopilot(sessionId: string | null) {
  const { addMessage, appendToLastMessage, setStreaming, isStreaming } = useChatStore();
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const sendPrompt = useCallback(
    async (message: string) => {
      if (!sessionId || !message.trim()) return;

      // Add user message
      addMessage(sessionId, {
        id: crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        timestamp: Date.now(),
      });

      // Add empty assistant message for streaming
      addMessage(sessionId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      });

      setStreaming(true);

      try {
        await tauriApi.sendMessage(sessionId, message.trim());
      } catch (err) {
        console.error('Failed to send message:', err);
        appendToLastMessage(sessionId, '\n\n*Error sending message.*');
        setStreaming(false);
      }
    },
    [sessionId, addMessage, appendToLastMessage, setStreaming],
  );

  // Listen for PTY output events
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const setup = async () => {
      unlistenRef.current = await listen<PtyEvent>(
        `pty-output-${sessionId}`,
        (event) => {
          if (cancelled) return;
          const ptyEvent = event.payload;

          if (ptyEvent.type === 'Output') {
            appendToLastMessage(sessionId, ptyEvent.data);
          } else if (ptyEvent.type === 'Error') {
            appendToLastMessage(sessionId, `\n\n*Error: ${ptyEvent.data}*`);
            setStreaming(false);
          } else if (ptyEvent.type === 'Exit') {
            setStreaming(false);
          }
        },
      );
    };

    setup();

    return () => {
      cancelled = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, [sessionId, appendToLastMessage, setStreaming]);

  return { sendPrompt, isStreaming };
}
