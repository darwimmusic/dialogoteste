import React from 'react';

export const LoadingPage: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white" aria-live="polite" aria-busy="true">
     <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300 mb-6">
        Comunidade IA
     </span>
     <div className="flex items-center space-x-2">
        <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce"></div>
     </div>
     <p className="sr-only">Carregando...</p>
  </div>
);
