import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Erreur Technique
            </h2>
            <p className="text-blue-200 mb-6">
              Une erreur inattendue s'est produite. Veuillez recharger la page.
            </p>
            <button
              onClick={this.handleReload}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-amber-500 transition-all duration-300 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Recharger</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}