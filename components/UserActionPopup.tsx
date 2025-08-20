import React from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface UserActionPopupProps {
  targetUser: UserProfile;
  onClose: () => void;
  onAddFriend: (uid: string) => void;
  onSendMessage: (uid: string) => void; // Placeholder for now
}

const UserActionPopup: React.FC<UserActionPopupProps> = ({ targetUser, onClose, onAddFriend, onSendMessage }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    // This will navigate to a generic profile page in the future.
    // For now, let's assume it navigates to /profile/:uid
    navigate(`/profile/${targetUser.uid}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <img 
            src={targetUser.photoURL || '/default-avatar.png'} 
            alt={targetUser.displayName} 
            className="w-24 h-24 rounded-full mb-4 border-4 border-purple-500"
          />
          <h2 className="text-2xl font-bold text-white">{targetUser.displayName}</h2>
          <p className="text-sm text-gray-400">{targetUser.title}</p>
        </div>
        
        <div className="mt-6 flex flex-col space-y-3">
          <button 
            onClick={handleViewProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Ver Perfil
          </button>
          <button 
            onClick={() => onAddFriend(targetUser.uid)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Adicionar Amigo
          </button>
          <button 
            onClick={() => onSendMessage(targetUser.uid)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Enviar Mensagem
          </button>
        </div>

        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
    </div>
  );
};

export default UserActionPopup;
