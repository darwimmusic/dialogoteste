// src/components/Header.tsx - Versão Final com Roteamento e Lógica de Admin

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOutUser } from '../services/authService';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db } from '../services/firebase';
import { HomeIcon } from './icons/HomeIcon';
import { ForumIcon } from './icons/ForumIcon';
import { LiveIcon } from './icons/LiveIcon';
import { NewsIcon } from './icons/NewsIcon';
import SocialIcon from './icons/SocialIcon';
import { UserIcon } from './icons/UserIcon'; // Adicionado para consistência

export const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const liveSessionRef = doc(db, 'liveSessions', 'current');
  const [liveSessionData] = useDocumentData(liveSessionRef);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // O App.tsx irá redirecionar para a página de login automaticamente
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Estilo para o NavLink ativo, para o usuário saber em qual página está
  const activeLinkStyle = ({ isActive }: { isActive: boolean }) => 
    isActive ? { color: '#a78bfa', /* roxo claro */ } : {};

  return (
    <header className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* O Logo agora é um Link para a página inicial */}
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
                d.IA.logo
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              {/* Cada item de navegação agora é um NavLink */}
              <NavLink to="/" style={activeLinkStyle} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white">
                <HomeIcon /> Dashboard
              </NavLink>
              <NavLink to="/forum" style={activeLinkStyle} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white">
                <ForumIcon /> Fórum
              </NavLink>
              <NavLink to="/live" style={activeLinkStyle} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white relative`}>
                {liveSessionData?.isLive && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
                <LiveIcon /> Ao Vivo
              </NavLink>
              <NavLink to="/news" style={activeLinkStyle} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white">
                <NewsIcon /> Notícias
              </NavLink>
              <NavLink to="/social" style={activeLinkStyle} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white">
                <SocialIcon /> Social
              </NavLink>
              
              {/* Lógica condicional: O link de Admin só aparece se isAdmin for true */}
              {isAdmin && (
                <NavLink to="/admin" style={activeLinkStyle} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold text-yellow-300 hover:bg-gray-700/50 hover:text-white">
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* O ícone do perfil agora é um Link para a página de perfil */}
            <Link to="/profile">
              {user?.photoURL ? (
                <img
                  className="h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-gray-800 ring-purple-500"
                  src={user.photoURL}
                  alt="User profile"
                />
              ) : (
                <div className="h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-gray-800 ring-purple-500 bg-gray-600 flex items-center justify-center">
                  <UserIcon />
                </div>
              )}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-gray-400 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
