import React from 'react';
import { ErrorBoundary } from '@sentry/react';
import Error from './Error';

const CustomErrorBoundary = ({ children }) => {
  const onError = (error, info) => {
    console.error('[CustomErrorBoundary] Error caught:', error);
    console.error('[CustomErrorBoundary] Component stack:', info.componentStack);

    // Log additional details that might help with debugging
    console.error('[CustomErrorBoundary] Error name:', error.name);
    console.error('[CustomErrorBoundary] Error message:', error.message);
    if (error.stack) {
      console.error('[CustomErrorBoundary] Error stack:', error.stack);
    }
  };

  const fallbackRender = ({ error, componentStack }) => {
    console.error('[CustomErrorBoundary] Rendering fallback due to error:', error);
    console.error('[CustomErrorBoundary] Component stack in fallback:', componentStack);

    // Include error message in the UI for better debugging
    const errorMessage = error?.message
      ? `Failed to load the component: ${error.message}`
      : 'Failed to load the component';

    return <Error message={errorMessage} />;
  };

  return (
    <ErrorBoundary
      fallback={fallbackRender}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default CustomErrorBoundary;
