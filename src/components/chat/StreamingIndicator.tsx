import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
  className?: string;
  showElapsed?: boolean;
}

export function StreamingIndicator({ className, showElapsed = false }: StreamingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!showElapsed) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [showElapsed]);

  return (
    <div className={cn('flex items-center gap-2 text-sm text-zinc-400', className)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-zinc-500">Copilot is thinking...</span>
      {showElapsed && elapsed > 0 && (
        <span className="text-zinc-600 text-xs">{elapsed}s</span>
      )}
    </div>
  );
}
