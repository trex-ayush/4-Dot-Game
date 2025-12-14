import React from 'react';

const ConnectionStatus = ({ isConnected }) => {
  if (isConnected) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="font-semibold">Disconnected</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;