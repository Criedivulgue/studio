'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Idealmente, você logaria isso para um serviço de monitoramento de erros
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen bg-background">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Oops! Algo deu errado.</AlertTitle>
            <AlertDescription>
              Um erro inesperado ocorreu na aplicação. Nossa equipe foi notificada.
              Por favor, tente recarregar a página.
              {this.state.error && (
                <details className="mt-4 text-xs text-muted-foreground">
                  <summary>Detalhes do Erro</summary>
                  <pre className="mt-2 p-2 bg-muted rounded-md whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => this.setState({ hasError: false, error: undefined })} // Tenta se recuperar
            className="mt-6"
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
