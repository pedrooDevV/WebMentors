import React from 'react';

export default function Header({ user, onLogout, isBackendConnected }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <i className="fas fa-graduation-cap text-lg"></i>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Mentoria<span className="text-emerald-600">.web</span></span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">LeoApi</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{isBackendConnected ? 'Backend Conectado' : 'Modo Demo / Simulação'}</span>
          </div>

          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">{user.nome}</div>
                <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">{user.role}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <button onClick={onLogout} title="Sair" className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors">
                <i className="fas fa-sign-out-alt text-lg"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}