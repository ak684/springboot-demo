import React, { PureComponent } from 'react';
import * as Sentry from '@sentry/react';
import AiTocGenerationFailed from "./AiTocGenerationFailed";

class AiTocErrorBoundary extends PureComponent {
  state = {
    error: false,
  }

  static getDerivedStateFromProps(props) {
    return {
      error: props.show,
    }
  }

  static getDerivedStateFromError() {
    return {
      error: true,
    }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: this.props.toc });
  }

  render() {
    const { children, reset, toc } = this.props;
    const { error } = this.state;

    if (error) {
      return <AiTocGenerationFailed reset={reset} />
    } else {
      return children;
    }
  }
}

export default AiTocErrorBoundary;
