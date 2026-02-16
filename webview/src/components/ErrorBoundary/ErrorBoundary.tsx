import React, { Component, ReactNode } from 'react';
import { logger } from '@spfx-local-workbench/shared';
import styles from './ErrorBoundary.module.css';

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
        logger.error('ErrorBoundary - Caught error:', error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className={styles.errorContainer}>
                    <div className="error-message">
                        <strong>Application Error:</strong> {this.state.error?.message || 'Unknown error'}
                    </div>
                    <p className={styles.errorDetails}>
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
