
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AuthState, PlanningData } from './types';
import { TRANSLATIONS, MAX_HISTORY, EXPIRATION_DAYS } from './constants';
import Login from './components/Login';
import ExcelGrid from './components/ExcelGrid';
import { parseExcelFile } from './utils/excelParser';
import { getPlanningAudit } from './services/geminiService';
import { 
  Plus, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  History, 
  LogOut, 
  Trash2, 
  Sparkles,
  User,
  Clock,
  Calendar,
  Menu,
  X,
  AlertTriangle,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

const App: React.FC = () => {
  const [lang] = useState<'fr' | 'en'>(navigator.language.startsWith('fr') ? 'fr' : 'en');
  const [auth, setAuth] = useState<AuthState>({ role: UserRole.GUEST, isAuthenticated: false });
  const [plannings, setPlannings] = useState<PlanningData[]>([]);
  const [activePlanningId, setActivePlanningId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  const touchStartDistRef = useRef<number | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('planning_history');
    if (saved) {
      let history: PlanningData[] = JSON.parse(saved);
      const now = new Date();
      history = history.filter(p => {
        const uploadDate = new Date(p.uploadDate);
        const diff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff < EXPIRATION_DAYS;
      });
      if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
      setPlannings(history);
      if (history.length > 0) setActivePlanningId(history[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('planning_history', JSON.stringify(plannings));
  }, [plannings]);

  const activePlanning = plannings.find(p => p.id === activePlanningId);

  const handleLogin = (role: UserRole, matricule?: string) => {
    setAuth({ role, matricule, isAuthenticated: true });
    if (role === UserRole.AGENT) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    setAuth({ role: UserRole.GUEST, isAuthenticated: false });
    setAuditResult(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newData = await parseExcelFile(file);
        setPlannings(prev => [newData, ...prev].slice(0, MAX_HISTORY));
        setActivePlanningId(newData.id);
      } catch (err) {
        alert('Erreur Excel.');
      }
    }
  };

  const formatTime = (value: any): string => {
    if (value === undefined || value === null || value === '') return '--:--';
    if (typeof value === 'number') {
      const totalSeconds = Math.round(value * 86400);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const strVal = String(value).trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(strVal)) {
      return strVal.split(':').slice(0, 2).join(':');
    }
    return strVal || '--:--';
  };

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      
      const delta = currentDist / touchStartDistRef.current;
      
      setZoom(prevZoom => {
        const newZoom = prevZoom * delta;
        // Clamp between 0.3 and 1.5
        return Math.min(Math.max(newZoom, 0.3), 1.5);
      });
      
      touchStartDistRef.current = currentDist;
      
      // Prevent browser default pinch-zoom
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  let agentRowIndex: number | undefined;
  if (auth.role === UserRole.AGENT && activePlanning) {
    const foundIndex = activePlanning.rows.findIndex((row, idx) => idx > 0 && String(row[0]) === auth.matricule);
    if (foundIndex !== -1) agentRowIndex = foundIndex;
    else return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
          <div className="bg-amber-500 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold">Accès Refusé</h2>
          </div>
          <div className="p-8 text-center">
            <p className="text-slate-600 font-medium mb-2">Matricule : <span className="text-slate-900 font-bold">{auth.matricule}</span></p>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Désolé, votre matricule ne figure pas dans le planning actuel (Colonne A). Veuillez contacter votre responsable ou vérifier votre saisie.
            </p>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
            >
              <ArrowLeft size={18} />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Login t={t} onLogin={handleLogin} />;

  return (
    <div className="h-screen flex flex-col bg-[#f0f0f0] overflow-hidden">
      <header className="h-10 bg-[#217346] flex items-center justify-between px-3 text-white shrink-0 shadow-md z-50">
        <div className="flex items-center gap-3">
          {auth.role === UserRole.ADMIN && (
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-white/10 p-1 rounded transition-colors">
              <Menu size={18} />
            </button>
          )}
          <span className="font-bold text-sm tracking-tight flex items-center gap-2">
            <Calendar size={16} />
            Excel Planning Hub
          </span>
          {activePlanning && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-2 py-0.5 rounded text-[11px] border border-white/5">
              {activePlanning.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-black/10 rounded-md overflow-hidden border border-white/5">
            <button onClick={() => setZoom(Math.max(0.3, Math.min(1.5, zoom - 0.1)))} className="p-1.5 hover:bg-white/10 transition-colors" title={t.zoomOut}><ZoomOut size={14} /></button>
            <span className="text-[10px] font-mono w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.max(0.3, Math.min(1.5, zoom + 0.1)))} className="p-1.5 hover:bg-white/10 transition-colors" title={t.zoomIn}><ZoomIn size={14} /></button>
          </div>
          <button onClick={handleLogout} className="h-7 px-3 bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-600/20 rounded-md flex items-center gap-2 transition-all group">
            <LogOut size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold hidden xs:inline">{t.logout}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {auth.role === UserRole.ADMIN && isSidebarOpen && (
          <aside className="w-60 bg-white border-r flex flex-col shrink-0 animate-in slide-in-from-left-4 duration-200 z-40 shadow-xl shadow-slate-200/50">
            <div className="p-4 border-b bg-slate-50/50">
              <label className="flex items-center gap-2 bg-[#217346] text-white px-3 py-3 rounded-xl cursor-pointer hover:bg-[#1a5c38] transition-all text-xs font-bold justify-center shadow-lg shadow-[#217346]/20 group active:scale-[0.98]">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
                {t.uploadTitle.split(' ')[0]}...
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-widest">{t.historyTitle}</p>
              {plannings.length === 0 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-slate-300 font-medium italic">Aucun fichier</p>
                </div>
              )}
              {plannings.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setActivePlanningId(p.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${activePlanningId === p.id ? 'bg-[#217346]/5 text-[#217346] ring-1 ring-[#217346]/20 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Calendar size={14} className={activePlanningId === p.id ? 'text-[#217346]' : 'text-slate-400'} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(t.delete + ' ?')) setPlannings(prev => prev.filter(pl => pl.id !== p.id)); }}
                    className={`p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all ${activePlanningId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-slate-50/50">
              <button 
                onClick={async () => { setIsAuditing(true); setAuditResult(await getPlanningAudit(activePlanning!)); setIsAuditing(false); }}
                disabled={!activePlanning || isAuditing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#217346] border border-[#217346]/20 rounded-xl text-xs font-bold hover:bg-[#217346] hover:text-white transition-all disabled:opacity-50 shadow-sm"
              >
                <Sparkles size={14} className={isAuditing ? 'animate-pulse' : ''} /> 
                {isAuditing ? 'Analyse en cours...' : t.smartAudit}
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
          <div className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
            {auth.role === UserRole.AGENT && activePlanning && agentRowIndex ? (
              <div className="flex items-center gap-6 text-xs font-medium text-slate-600 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-3 shrink-0 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm shadow-blue-200"><User size={14} /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-blue-400 font-bold leading-tight">Agent</span>
                    <span className="font-bold text-blue-900 text-sm leading-none tracking-tight">
                      {activePlanning.rows[agentRowIndex][0]} — {activePlanning.rows[agentRowIndex][1]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-100/50">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm shadow-emerald-100 mr-2"><Briefcase size={14} /></div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-emerald-500 font-bold leading-tight">Shift</span>
                      <div className="flex items-center gap-3">
                        <b className="text-slate-900 text-sm leading-none flex items-center gap-1.5">
                          <span className="text-emerald-600 font-black">E /</span> 
                          {formatTime(activePlanning.rows[agentRowIndex][2])}
                        </b>
                        <div className="h-3 w-px bg-emerald-200"></div>
                        <b className="text-slate-900 text-sm leading-none flex items-center gap-1.5">
                          <span className="text-amber-600 font-black">S /</span> 
                          {formatTime(activePlanning.rows[agentRowIndex][3])}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            )}
            
            {auditResult && (
              <div className="absolute top-16 left-6 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl text-xs z-30 flex justify-between items-start animate-in slide-in-from-top-4 duration-500 border border-white/10 ring-1 ring-black/5">
                <div className="flex-1 mr-6">
                  <div className="flex items-center gap-2 font-bold mb-2 text-blue-400 tracking-wider uppercase text-[10px]">
                    <Sparkles size={14} /> Intelligence Artificielle
                  </div>
                  <p className="leading-relaxed font-medium text-slate-200">{auditResult}</p>
                </div>
                <button 
                  onClick={() => setAuditResult(null)} 
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div 
            className="flex-1 relative overflow-hidden flex flex-col bg-slate-50 shadow-inner touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {activePlanning ? (
              <ExcelGrid 
                data={activePlanning} 
                zoom={zoom} 
                highlightRowIndex={agentRowIndex}
                searchTerm={searchTerm}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <History size={40} className="text-slate-200" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 mb-2">{t.noData}</p>
                  <p className="text-sm text-slate-400 text-center max-w-xs">
                    Veuillez téléverser un fichier Excel pour commencer à gérer vos plannings.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 bg-slate-100 border-t flex items-center justify-between px-4 text-[10px] text-slate-500 shrink-0 select-none font-medium">
            <div className="flex items-center gap-3">
              <span className="bg-[#217346] text-white px-1.5 rounded uppercase font-bold text-[8px]">Prêt</span>
              <span>Lignes: {activePlanning?.rows.length || 0}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">Zoom: {Math.round(zoom * 100)}%</span>
              <span className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${activePlanning ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`}></div>
                Système Connecté
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
