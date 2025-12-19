import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Users, UserCircle, KeyRound, Plane } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (inputVal === 'admin123') {
        onLogin({ role: 'admin', name: 'Administrateur' });
      } else {
        setError('Accès refusé. Mot de passe incorrect.');
      }
    } else {
      const trimmed = inputVal.trim();
      if (trimmed.length > 0) {
        onLogin({ role: 'agent', name: trimmed, searchTerm: trimmed });
      } else {
        setError('Veuillez entrer votre nom ou matricule.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109c05c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
      
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4 text-white">
            <Plane size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Airport Planning</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion des Ressources & Plannings</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => { setRole('admin'); setInputVal(''); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield size={16} /> Admin
          </button>
          <button
            onClick={() => { setRole('agent'); setInputVal(''); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              role === 'agent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Agent
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
              {role === 'admin' ? 'Clé de sécurité' : 'Identifiant Agent'}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {role === 'admin' ? <KeyRound size={18} /> : <UserCircle size={18} />}
              </div>
              <input
                type={role === 'admin' ? 'password' : 'text'}
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-300"
                placeholder={role === 'admin' ? '••••••••' : 'Entrez votre nom ou matricule'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-semibold mt-2 animate-pulse">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all ${
              role === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {role === 'admin' ? 'Se connecter' : 'Consulter mon planning'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          Système Sécurisé • v1.2.0
        </p>
      </div>
    </div>
  );
};