
import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="sr-only">Pensando...</span>
    <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce"></div>
  </div>
);
