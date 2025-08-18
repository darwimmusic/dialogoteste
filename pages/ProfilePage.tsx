import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../services/userService';
import { getPostsByAuthor } from '../services/forumService'; // Importa a nova função
import type { UserProfile, ForumPost } from '../types';
import { LoadingPage } from './LoadingPage';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<(ForumPost & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          const [profile, posts] = await Promise.all([
            getUserProfile(user.uid),
            getPostsByAuthor(user.uid)
          ]);
          setUserProfile(profile);
          setUserPosts(posts);
        } catch (error) {
          console.error("Erro ao buscar dados do perfil:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProfileData();
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
    <div className="min-h-screen text-white">
      <div className="container mx-auto p-4 md:p-8">
        
        {/* Seção Superior do Perfil */}
        <div className="bg-gray-800/50 rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <img 
            src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
            alt="Foto do Perfil" 
            className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover"
          />
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">{userProfile.displayName}</h1>
            <p className="text-lg text-gray-400">{userProfile.title}</p>
            <div className="mt-2">
              <span className="font-semibold text-gray-200">LVL: {userProfile.level}</span>
              <div className="w-full bg-gray-700 rounded-full h-4 mt-1">
                <div 
                  className="bg-blue-500 h-4 rounded-full" 
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-right text-gray-400">{userProfile.xp % 100} / 100 XP</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            {/* Aqui podem entrar botões de editar perfil, etc. */}
            <p className="text-gray-500">Membro desde: {new Date(userProfile.createdAt?.toDate()).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Seção de Conquistas/Badges */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Conquistas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userProfile.badges && userProfile.badges.length > 0 ? (
              userProfile.badges.map(badge => (
                <div key={badge.id} className="bg-gray-800/50 p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
                  <img src={badge.imageUrl} alt={badge.name} className="w-20 h-20 mx-auto object-contain"/>
                  <p className="mt-2 font-semibold text-gray-200 text-sm">{badge.name}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400">Nenhuma conquista ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Posts no Fórum */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Meus Posts no Fórum</h2>
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <div key={post.id} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <Link to={`/forum/post/${post.id}`} className="block">
                    <h3 className="text-lg font-semibold text-blue-400">{post.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(post.createdAt?.toDate()).toLocaleDateString()}
                    </p>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center p-6 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 mb-4">Você ainda não criou nenhum post.</p>
                <Link to="/forum">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                    CRIAR MEU PRIMEIRO POST
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
