import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Badge } from '../types';

interface NotificationPopupProps {
  badge: Badge;
  onClose: () => void;
  duration?: number;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ badge, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <Link to="/profile">
      <div className="fixed top-5 right-5 bg-gray-800 border border-purple-500 text-white py-3 px-5 rounded-lg shadow-lg animate-fade-in-down z-50 cursor-pointer flex items-center space-x-4">
        <img src={badge.imageUrl} alt={badge.name} className="w-12 h-12 object-contain" />
        <div>
          <p className="font-bold">Conquista Desbloqueada!</p>
          <p className="text-sm text-gray-300">{badge.name}</p>
        </div>
      </div>
    </Link>
  );
};
