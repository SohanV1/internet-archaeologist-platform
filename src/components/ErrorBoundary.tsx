'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 bg-red-950/30 border border-red-900/60 rounded-2xl text-slate-200 space-y-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-900/50 rounded-xl border border-red-700/60 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base md:text-lg text-red-300">
                {this.props.fallbackTitle || 'Forensic Component Error'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {this.props.fallbackMessage ||
                  'A component encountered a runtime rendering exception.'}
              </p>
            </div>
          </div>

          {this.state.error && (
            <pre className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}

          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700/60 text-red-200 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component Render</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
