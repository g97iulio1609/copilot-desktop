import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { tauriApi } from '@/lib/tauri';

export function LoginScreen() {
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setStatusText('Waiting for GitHub authorization...');

    try {
      // Trigger the login flow — the copilot CLI will open a browser
      await tauriApi.triggerLogin();

      // Poll for auth status
      const pollInterval = setInterval(async () => {
        const status = await tauriApi.checkAuth();
        if (status.authenticated) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setStatusText('');
          await checkAuth();
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsLoading(false);
        setStatusText('Authorization timed out. Please try again.');
      }, 120_000);
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      setStatusText('Failed to start login flow. Is Copilot CLI installed?');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div
        className={cn(
          'relative flex flex-col items-center gap-8 p-10 rounded-2xl',
          'bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/40',
          'shadow-2xl shadow-black/40',
          'max-w-md w-full mx-4',
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-9 h-9 text-white"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            Copilot Desktop
          </h1>
          <p className="text-sm text-zinc-400 text-center">
            Sign in with your GitHub account to get started
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl',
            'bg-zinc-100 text-zinc-900 font-medium text-sm',
            'hover:bg-white transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-lg shadow-black/20',
          )}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          )}
          {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
        </button>

        {/* Status Text */}
        {statusText && (
          <p className="text-xs text-zinc-400 text-center animate-pulse">
            {statusText}
          </p>
        )}
      </div>
    </div>
  );
}
