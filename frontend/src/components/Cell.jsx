import React from 'react';

const Cell = ({ value, onClick, isClickable }) => {
  const getCellClass = () => {
    if (value === 1) return 'disc-player1';
    if (value === 2) return 'disc-player2';
    return 'disc-empty';
  };

  return (
    <div
      className={`
        w-16 h-16 rounded-full border-2 border-slate-700
        ${getCellClass()}
        ${isClickable ? 'cell-hover' : 'cursor-not-allowed'}
        transition-all duration-300
      `}
      onClick={isClickable ? onClick : undefined}
    />
  );
};

export default Cell;