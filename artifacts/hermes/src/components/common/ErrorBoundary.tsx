import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  variant?: 'global' | 'chat' | 'ai-models';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const variant = this.props.variant || 'global';

    if (variant === 'chat') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Chat failed to load</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Hermes recovered from a local chat error. You can reload or start a new conversation.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Button size="sm" onClick={this.reset} data-testid="btn-reload-chat">Reload Chat</Button>
            <Button size="sm" variant="outline" onClick={() => { window.location.href = '/chat'; }} data-testid="btn-new-chat">Start New Chat</Button>
            <Button size="sm" variant="destructive" onClick={() => { localStorage.removeItem('hermes_conversations'); this.reset(); }} data-testid="btn-clear-chat">Clear Corrupted Chat Data</Button>
          </div>
        </div>
      );
    }

    if (variant === 'ai-models') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <h2 className="text-lg font-semibold">AI Models failed to load</h2>
          <p className="text-sm text-muted-foreground">There was an error loading the AI Models page.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={this.reset}>Reload</Button>
            <Button size="sm" variant="destructive" onClick={() => { localStorage.removeItem('hermes_providers'); this.reset(); }}>Reset AI Settings</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-background text-foreground">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
          <span className="text-destructive text-2xl font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">{this.state.error?.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={this.reset} data-testid="btn-recover">Try Again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }
}
