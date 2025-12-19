import React, { useState, useEffect } from 'react';
import { User, GridData } from '../types';
import { Grid } from './Grid';
import { Button } from './Button';
import { Search, LogOut, User as UserIcon, Clock, MapPin, Hash, X, ZoomIn, ZoomOut } from 'lucide-react';

interface AgentDashboardProps {
  user: User;
  data: GridData;
  onLogout: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user, data, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState(user.searchTerm || '');
  const [filteredData, setFilteredData] = useState<GridData>([]); 
  const [zoom, setZoom] = useState<number>(1);
  const frozenRows = 1; // Always freeze the header row
  const [agentInfo, setAgentInfo] = useState<{
    name: string;
    id: string;
    shift: string;
    poste: string;
  } | null>(null);

  const performSearch = (term: string) => {
    // Always start with just the header (assuming row 0 is header)
    const headerRow = data.length > 0 ? [data[0]] : [];

    if (!term.trim()) {
        setFilteredData(headerRow);
        setAgentInfo(null);
        return;
    }

    const lowerTerm = term.toLowerCase();
    let foundRowIndex = -1;

    // Start search from row 1 to skip header
    for (let r = 1; r < data.length; r++) {
        const rowString = data[r].map(c => c.value.toLowerCase()).join(' ');
        if (rowString.includes(lowerTerm)) {
            foundRowIndex = r;
            break;
        }
    }

    if (foundRowIndex !== -1) {
        // Show Header + Agent Row
        setFilteredData([data[0], data[foundRowIndex]]);
        
        const row = data[foundRowIndex];
        const nameCell = row.find(c => c.value.toLowerCase().includes(lowerTerm));
        
        setAgentInfo({
            id: row[0]?.value || '-',
            name: nameCell?.value || row[1]?.value || '-',
            shift: row[2]?.value || '-',
            poste: row[3]?.value || '-'
        });
    } else {
        // Not found: Show only header
        setFilteredData(headerRow);
        setAgentInfo(null);
    }
  };

  // React to data changes (e.g. if loaded async)
  useEffect(() => {
    if (searchTerm) {
        performSearch(searchTerm);
    } else {
        setFilteredData(data.length > 0 ? [data[0]] : []);
    }
  }, [data]);

  // Initial load
  useEffect(() => {
    if (user.searchTerm) {
        performSearch(user.searchTerm);
    } else {
        setFilteredData(data.length > 0 ? [data[0]] : []);
    }
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const step = 0.1;
      let newZoom = direction === 'in' ? prev + step : prev - step;
      newZoom = Math.max(0.1, Math.min(newZoom, 3.0));
      return Math.round(newZoom * 10) / 10;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
       <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 shadow-lg flex justify-between items-center z-20 text-sm">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1 rounded-lg">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold leading-tight">Agent Portal</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">{user.name}</span>
          <Button variant="ghost" className="!px-2 !py-1 !h-auto" onClick={onLogout} icon={<LogOut size={12} />}>Logout</Button>
        </div>
      </header>

      <div className="bg-emerald-50 border-b border-emerald-100 p-2 flex flex-col md:flex-row gap-2 justify-between items-center">
        <div className="flex gap-2 items-center w-full max-w-2xl">
            <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 w-3 h-3" />
                <input 
                    type="text" 
                    className="w-full pl-7 pr-3 py-1 text-xs border border-emerald-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-900 placeholder-emerald-300"
                    placeholder="Search name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                />
            </div>
            <Button variant="primary" className="!bg-emerald-600 !hover:bg-emerald-700 !py-1 !px-3 !text-xs !h-auto" onClick={() => performSearch(searchTerm)}>
                Find
            </Button>
            {searchTerm && (
                <Button variant="secondary" className="!py-1 !px-2 !text-xs !h-auto" onClick={() => {
                    setSearchTerm('');
                    performSearch('');
                }}>
                    <X size={12} />
                </Button>
            )}
        </div>

        <div className="flex gap-1 items-center bg-white rounded border px-1">
             <Button className="!px-2 !py-1 !text-xs !border-none" onClick={() => handleZoom('out')} icon={<ZoomOut size={12} />} />
             <span className="text-[10px] font-mono w-8 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
             <Button className="!px-2 !py-1 !text-xs !border-none" onClick={() => handleZoom('in')} icon={<ZoomIn size={12} />} />
        </div>
      </div>

      {agentInfo && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-1.5 animate-in slide-in-from-top-2 duration-300">
            <div className="max-w-5xl mx-auto flex flex-wrap gap-4 text-[10px] md:text-xs">
                <div className="flex items-center gap-1 text-yellow-800">
                    <UserIcon size={12} />
                    <span className="font-bold uppercase">Agent:</span>
                    <span className="font-medium">{agentInfo.name}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-800">
                    <Hash size={12} />
                    <span className="font-bold uppercase">ID:</span>
                    <span className="font-medium">{agentInfo.id}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-800">
                    <Clock size={12} />
                    <span className="font-bold uppercase">Shift:</span>
                    <span className="font-medium">{agentInfo.shift}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-800">
                    <MapPin size={12} />
                    <span className="font-bold uppercase">to</span>
                    <span className="font-medium">{agentInfo.poste}</span>
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden p-2">
        <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <Grid 
                data={filteredData} 
                readOnly 
                scale={zoom}
                onZoomChange={setZoom}
                frozenRows={frozenRows}
            />
        </div>
      </div>
    </div>
  );
};
