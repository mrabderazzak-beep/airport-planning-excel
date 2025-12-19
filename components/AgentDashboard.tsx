import React, { useState, useEffect, useCallback } from 'react';
import { User, GridData } from '../types';
import { Grid } from './Grid';
import { Button } from './Button';
import { Search, LogOut, User as UserIcon, Clock, MapPin, Hash, X, ZoomIn, ZoomOut, Plane } from 'lucide-react';

interface AgentDashboardProps {
  user: User;
  data: GridData;
  onLogout: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user, data, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState(user.searchTerm || '');
  const [filteredData, setFilteredData] = useState<GridData>([]); 
  const [zoom, setZoom] = useState<number>(1);
  const [agentInfo, setAgentInfo] = useState<{
    name: string;
    id: string;
    shift: string;
    poste: string;
  } | null>(null);

  const performSearch = useCallback((term: string) => {
    if (data.length === 0) return;
    const headerRow = data[0];

    if (!term.trim()) {
        setFilteredData([headerRow]);
        setAgentInfo(null);
        return;
    }

    const lowerTerm = term.toLowerCase();
    const matches = data.slice(1).filter(row => 
        row.some(cell => cell.value.toLowerCase().includes(lowerTerm))
    );

    if (matches.length > 0) {
        setFilteredData([headerRow, ...matches]);
        const firstMatch = matches[0];
        setAgentInfo({
            id: firstMatch[0]?.value || '-',
            name: firstMatch[1]?.value || '-',
            shift: firstMatch[2]?.value || '-',
            poste: firstMatch[3]?.value || '-'
        });
    } else {
        setFilteredData([headerRow]);
        setAgentInfo(null);
    }
  }, [data]);

  useEffect(() => {
    performSearch(searchTerm);
  }, [data, performSearch]);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => Math.round(Math.min(Math.max(0.1, direction === 'in' ? prev + 0.1 : prev - 0.1), 3.0) * 10) / 10);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
       <header className="bg-emerald-700 text-white px-4 py-2 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-emerald-200" />
          <h1 className="font-bold text-base tracking-tight">Airport Portal</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
            <UserIcon size={12} className="text-emerald-200" />
            <span>{user.name}</span>
          </div>
          <Button variant="ghost" className="!px-2 !py-1 !text-xs opacity-80 hover:opacity-100" onClick={onLogout} icon={<LogOut size={12} />}>Sortir</Button>
        </div>
      </header>

      <div className="bg-white border-b border-emerald-100 p-2 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex gap-2 items-center w-full max-w-xl">
            <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input 
                    type="text" 
                    className="w-full pl-9 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Chercher par nom, ID ou poste..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                />
                {searchTerm && (
                    <button onClick={() => {setSearchTerm(''); performSearch('');}} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                )}
            </div>
            <Button variant="primary" className="!bg-emerald-600 !py-1.5 !px-4 !text-xs" onClick={() => performSearch(searchTerm)}>Rechercher</Button>
        </div>

        <div className="flex gap-2 items-center bg-gray-50 rounded-lg border border-gray-200 px-2 py-1 ml-auto">
             <Button className="!p-1 !border-none !bg-transparent" onClick={() => handleZoom('out')} icon={<ZoomOut size={14} />} />
             <span className="text-[10px] font-mono w-10 text-center font-bold text-gray-500">{Math.round(zoom * 100)}%</span>
             <Button className="!p-1 !border-none !bg-transparent" onClick={() => handleZoom('in')} icon={<ZoomIn size={14} />} />
        </div>
      </div>

      {agentInfo && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 animate-in slide-in-from-top-1 duration-300">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">Agent</span>
                    <span className="font-semibold">{agentInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">ID</span>
                    <span className="font-semibold">{agentInfo.id}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">Service</span>
                    <span className="font-semibold">{agentInfo.shift}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin size={12} className="opacity-60" />
                    <span className="font-semibold">{agentInfo.poste}</span>
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden p-3">
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <Grid 
                data={filteredData} 
                readOnly 
                scale={zoom}
                onZoomChange={setZoom}
                frozenRows={1}
            />
        </div>
      </div>
    </div>
  );
};