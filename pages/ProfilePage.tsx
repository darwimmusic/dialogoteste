import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { signOutUser } from '../services/authService';
import { UserIcon } from '../components/icons/UserIcon';

interface ProfilePageProps {
  navigateToDashboard: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigateToDashboard }) => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // The auth state change will automatically redirect the user to the LoginPage.
      // But if we want to ensure they are on the dashboard before that happens:
      navigateToDashboard();
    } catch (error) {
      console.error(error);
      alert("Falha ao sair. Por favor, tente novamente.");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-gray-400">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <div className="bg-gray-800/50 rounded-lg p-8 ring-1 ring-gray-700 shadow-xl">
        <div className="flex flex-col items-center">
          {user.photoURL ? (
            <img
              className="h-24 w-24 rounded-full ring-4 ring-blue-500 mb-4"
              src={user.photoURL}
              alt="Foto do perfil"
            />
          ) : (
             <div className="h-24 w-24 rounded-full ring-4 ring-blue-500 bg-gray-600 flex items-center justify-center mb-4">
                <UserIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">{user.displayName || 'Usuário'}</h1>
          <p className="text-md text-gray-400 mt-1">{user.email}</p>
          
          <div className="w-full border-t border-gray-700 my-8"></div>

          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
          >
            Sair (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};
