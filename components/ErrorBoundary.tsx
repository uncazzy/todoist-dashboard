import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackText?: string;
  fallbackDescription?: string;
  showError?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Component Error:', error);
    console.error('Error Info:', errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 bg-red-900/20 rounded-lg">
          <h3 className="text-xl font-semibold text-red-400 mb-2">
            {this.props.fallbackText || 'Something went wrong'}
          </h3>
          <p className="text-gray-400">
            {this.props.fallbackDescription || 'Please try refreshing the page'}
          </p>
          {this.props.showError && (
            <pre className="mt-4 p-4 bg-gray-900 rounded text-sm text-gray-400 overflow-auto">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
