import React from 'react';

export default function Toast({ message, type, onClose }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div 
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl text-white shadow-2xl transition-all duration-300 ${
        isError ? 'bg-rose-600' : 'bg-emerald-600'
      }`}
    >
      <div className="text-lg">
        {isError ? '⚠️' : '✅'}
      </div>
      <div className="text-sm font-semibold">
        {message}
      </div>
      <button 
        onClick={onClose} 
        className="ml-4 text-white/80 hover:text-white font-bold"
      >
        ✕
      </button>
    </div>
  );
}