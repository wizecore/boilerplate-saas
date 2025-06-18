import React, { ErrorInfo } from "react";
import logger from "@/lib/logger";
import { ErrorMessage } from "@/components/ErrorMessage";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  lastError?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, lastError: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const payload = { message: error?.message, error, errorInfo, url: window.location.href };
    logger.info("Client-side error", payload);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage
          error={this.state.lastError}
          onClick={() => this.setState({ hasError: false })}
          redirect="/dashboard"
        />
      );
    }

    return this.props.children;
  }
}
