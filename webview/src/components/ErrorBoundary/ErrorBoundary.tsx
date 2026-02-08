import React, { Component, ReactNode } from 'react';

interface IErrorBoundaryProps {
    children: ReactNode;
}

interface IErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: IErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }

    static getDerivedStateFromError(error: Error): IErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary - Caught error:', error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px' }}>
                    <div className="error-message">
                        <strong>Application Error:</strong> {this.state.error?.message || 'Unknown error'}
                    </div>
                    <p style={{ padding: '16px' }}>
                        Check the browser console for more details.
                    </p>
                    <button 
                        className="webpart-btn" 
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
