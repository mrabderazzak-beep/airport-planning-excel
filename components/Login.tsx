
import React, { useState, useEffect } from 'react';
import { UserRole, AppTranslation } from '../types';
import { ADMIN_PASSWORD, AGENT_PASSWORD } from '../constants';
import { LogIn, UserCircle, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginProps {
  t: AppTranslation;
  onLogin: (role: UserRole, matricule?: string) => void;
}

const Login: React.FC<LoginProps> = ({ t, onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.AGENT);
  const [password, setPassword] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [matricule, setMatricule] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedMatricule = localStorage.getItem('remembered_matricule');
    if (savedMatricule) {
      setMatricule(savedMatricule);
      setRememberMe(true);
    }
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez saisir le mot de passe');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    await new Promise(r => setTimeout(r, 600));
    
    if (password === ADMIN_PASSWORD) {
      onLogin(UserRole.ADMIN);
    } else {
      setError('Mot de passe administrateur incorrect');
      setIsSubmitting(false);
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricule.trim()) {
      setError('Veuillez saisir votre matricule');
      return;
    }
    if (!agentPassword) {
      setError('Le mot de passe agent est requis');
      return;
    }

    setIsSubmitting(true);
    setError('');

    await new Promise(r => setTimeout(r, 800));

    if (agentPassword === AGENT_PASSWORD) {
      if (rememberMe) {
        localStorage.setItem('remembered_matricule', matricule);
      } else {
        localStorage.removeItem('remembered_matricule');
      }
      onLogin(UserRole.AGENT, matricule);
    } else {
      setError('Mot de passe agent incorrect');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-500 transform hover:shadow-emerald-900/10">
        {/* Header Section */}
        <div className="bg-[#217346] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute rotate-45 -top-10 -left-10 w-40 h-40 bg-white"></div>
            <div className="absolute rotate-45 -bottom-10 -right-10 w-40 h-40 bg-white"></div>
          </div>
          
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner rotate-3 hover:rotate-0 transition-transform duration-300">
              <LogIn size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Planning Hub</h1>
            <p className="text-white/80 text-xs font-medium uppercase tracking-widest">{t.loginTitle}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="p-1 flex bg-slate-100/50 m-6 rounded-2xl border border-slate-200">
          <button 
            onClick={() => { setActiveTab(UserRole.AGENT); setError(''); setShowPassword(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-sm ${activeTab === UserRole.AGENT ? 'bg-white text-[#217346] shadow-md font-bold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCircle size={16} /> Agent
          </button>
          <button 
            onClick={() => { setActiveTab(UserRole.ADMIN); setError(''); setShowPassword(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-sm ${activeTab === UserRole.ADMIN ? 'bg-white text-[#217346] shadow-md font-bold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck size={16} /> Admin
          </button>
        </div>

        <div className="px-8 pb-8">
          {activeTab === UserRole.AGENT ? (
            <form onSubmit={handleAgentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.agentMatricule}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#217346] transition-colors">
                    <UserCircle size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder="Ex: 68045"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#217346]/5 focus:border-[#217346] outline-none transition-all text-sm font-medium placeholder:text-slate-300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mot de passe Agent</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#217346] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    placeholder="Saisir le code d'accès"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-[#217346]/5 focus:border-[#217346] outline-none transition-all text-sm font-medium placeholder:text-slate-300"
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#217346] border-[#217346]' : 'bg-white border-slate-300 group-hover:border-[#217346]'}`}>
                    {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="hidden"
                  />
                  <span className="text-xs text-slate-500 font-medium select-none tracking-tight">Se souvenir de moi</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#217346] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1a5c38] active:scale-[0.98] transition-all shadow-lg shadow-[#217346]/10 flex items-center justify-center gap-3 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Accéder à mon planning</span>
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.adminPassword}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-800 outline-none transition-all text-sm font-medium tracking-widest placeholder:text-slate-300"
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-900 active:scale-[0.98] transition-all shadow-lg shadow-slate-800/20 flex items-center justify-center gap-3 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t.loginButton}</span>
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 justify-center text-red-600 bg-red-50 py-3 px-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={16} />
              <p className="text-[11px] font-bold">{error}</p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50/80 p-5 text-center border-t border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Sécurisé par Excel Planning Engine v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
