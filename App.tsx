// src/App.tsx - Roteamento Final

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LessonPlayerPage } from './pages/LessonPlayerPage';
import { ForumPage } from './pages/ForumPage';
import { PostEditorPage } from './pages/PostEditorPage';
import { PostPage } from './pages/PostPage';
import { LiveSessionsPage } from './pages/LiveSessionsPage';
import { NewsPage } from './pages/NewsPage';
import { NewsEditorPage } from './pages/NewsEditorPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import ProfilePage from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/icons/LoadingSpinner';

function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#181818] flex justify-center items-center"><LoadingSpinner /></div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#181818] text-gray-100 font-sans">
        {user && <Header />}
        <main>
          <Routes>
            {!user && <Route path="*" element={<LoginPage />} />}
            {user && (
              <>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/forum" element={<ForumPage />} />
                <Route path="/forum/create-post" element={<PostEditorPage />} /> {/* Rota simplificada */}
                <Route path="/forum/post/:postId" element={<PostPage />} /> {/* Rota simplificada */}
                <Route path="/live" element={<LiveSessionsPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/create" element={isAdmin ? <NewsEditorPage /> : <Navigate to="/news" />} />
                <Route path="/news/edit/:newsId" element={isAdmin ? <NewsEditorPage /> : <Navigate to="/news" />} />
                <Route path="/news/:newsId" element={<NewsDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* ROTA ATUALIZADA: Leva para o player de aula, que agora é a página de detalhes do curso */}
                <Route path="/course/:courseId" element={<LessonPlayerPage />} />
                
                <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
