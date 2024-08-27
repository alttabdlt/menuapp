import React, { useEffect } from 'react';

type NotificationModalProps = {
  message: string;
  onClose: () => void;
};

const NotificationModal: React.FC<NotificationModalProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default NotificationModal;