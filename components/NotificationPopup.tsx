import React, { useEffect } from 'react';

interface NotificationPopupProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ message, onClose, duration = 2000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down z-50">
      <p>{message}</p>
    </div>
  );
};
