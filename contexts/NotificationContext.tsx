import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { NotificationPopup } from '../components/NotificationPopup';
import type { Badge } from '../types';
import eventEmitter from '../utils/eventEmitter';

interface NotificationContextType {
  showAchievementNotification: (badge: Badge) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<Badge | null>(null);

  useEffect(() => {
    const handleAchievementGranted = (badge: Badge) => {
      setNotification(badge);
    };

    eventEmitter.on('achievementGranted', handleAchievementGranted);

    // Não há necessidade de remover o listener, pois o contexto vive durante toda a aplicação
  }, []);

  const showAchievementNotification = (badge: Badge) => {
    setNotification(badge);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showAchievementNotification }}>
      {children}
      {notification && (
        <NotificationPopup
          badge={notification}
          onClose={handleCloseNotification}
          duration={5000}
        />
      )}
    </NotificationContext.Provider>
  );
};
