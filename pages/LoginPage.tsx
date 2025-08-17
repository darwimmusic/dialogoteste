import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

type FormType = 'login' | 'signup';

export const LoginPage: React.FC = () => {
  const [formType, setFormType] = useState<FormType>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Auth state listener in App.tsx will handle redirect
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (formType === 'signup') {
        if (!displayName.trim()) {
          throw new Error("O nome de exibição é obrigatório.");
        }
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            Comunidade IA
          </h1>
          <p className="text-gray-400 mt-2">
            {formType === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta para começar.'}
          </p>
        </div>

        <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl ring-1 ring-gray-700">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-3 bg-white text-gray-800 font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Entrar com Google
          </button>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OU</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <form onSubmit={handleSubmit}>
            {formType === 'signup' && (
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="displayName">
                  Nome de Exibição
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md mb-4 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
            >
              {isLoading ? <LoadingSpinner /> : (formType === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {formType === 'login'
              ? "Não tem uma conta?"
              : "Já tem uma conta?"}
            <button
              onClick={() => {
                setFormType(formType === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="font-bold text-blue-400 hover:underline ml-2"
            >
              {formType === 'login' ? 'Crie uma agora' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
