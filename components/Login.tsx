import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Users, UserCircle, KeyRound, Plane } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('admin'); // Default to admin for UI selection
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (inputVal === 'admin123') {
        onLogin({ role: 'admin', name: 'Administrateur' });
      } else {
        setError('Mot de passe incorrect.');
      }
    } else {
      if (inputVal.trim().length > 0) {
        onLogin({ 
          role: 'agent', 
          name: inputVal, 
          searchTerm: inputVal 
        });
      } else {
        setError('Veuillez entrer votre nom ou ID.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transition-all transform duration-300">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
                <Plane className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Airport Planning</h1>
          <p className="text-gray-500 text-sm mt-1">Système de Gestion de Planning</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => { setRole('admin'); setInputVal(''); setError(''); }}
            className={`p-6 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
              role === 'admin' 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md transform -translate-y-1' 
                : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Shield className={`w-8 h-8 ${role === 'admin' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-sm">Administrateur</span>
            <span className="text-[10px] opacity-75">Accès Complet</span>
          </button>

          <button
            onClick={() => { setRole('agent'); setInputVal(''); setError(''); }}
            className={`p-6 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
              role === 'agent' 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md transform -translate-y-1' 
                : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Users className={`w-8 h-8 ${role === 'agent' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-sm">Agent</span>
            <span className="text-[10px] opacity-75">Lecture Seule</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {role === 'admin' ? 'Mot de passe' : 'Nom / ID Agent'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {role === 'admin' ? <KeyRound size={16} /> : <UserCircle size={16} />}
              </span>
              <input
                type={role === 'admin' ? 'password' : 'text'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder={role === 'admin' ? '••••••••' : 'ex: 68046'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${
              role === 'admin' 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {role === 'admin' ? 'Se connecter' : 'Voir le Planning'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Accès Sécurisé • v1.1.0</p>
        </div>
      </div>
    </div>
  );
};