import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../services/userService';
import type { UserProfile } from '../types';
import { LoadingPage } from './LoadingPage';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!userProfile) {
    return <div className="container mx-auto p-4">Usuário não encontrado ou não logado.</div>;
  }

  // Barra de progresso de XP
  const xpProgress = (userProfile.xp % 100);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        
        {/* Seção Superior do Perfil */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <img 
            src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
            alt="Foto do Perfil" 
            className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover"
          />
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
            <p className="text-lg text-gray-600">{userProfile.title}</p>
            <div className="mt-2">
              <span className="font-semibold">LVL: {userProfile.level}</span>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                <div 
                  className="bg-blue-500 h-4 rounded-full" 
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-right">{userProfile.xp % 100} / 100 XP</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            {/* Aqui podem entrar botões de editar perfil, etc. */}
            <p className="text-gray-500">Membro desde: {new Date(userProfile.createdAt?.toDate()).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Seção de Conquistas/Badges */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Conquistas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userProfile.badges.length > 0 ? (
              userProfile.badges.map(badge => (
                <div key={badge.id} className="bg-white p-4 rounded-lg shadow-md text-center">
                  <img src={badge.imageUrl} alt={badge.name} className="w-20 h-20 mx-auto"/>
                  <p className="mt-2 font-semibold">{badge.name}</p>
                </div>
              ))
            ) : (
              <p>Nenhuma conquista ainda.</p>
            )}
          </div>
        </div>

        {/* Outras seções (Cursos, Blog, etc.) podem ser adicionadas aqui */}

      </div>
    </div>
  );
};

export default ProfilePage;
