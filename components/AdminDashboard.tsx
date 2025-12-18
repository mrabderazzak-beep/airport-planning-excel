import React, { useState, useRef } from 'react';
import { User, GridData, CellData, GridSelection } from '../types';
import { Grid } from './Grid';
import { Button } from './Button';
import { parseExcelFile, exportToExcel, generateEmptyGrid, numberToColumn } from '../utils/excelUtils';
import { 
    Save, FolderOpen, FilePlus, PlusSquare, Grid3X3, 
    Download, Trash2, LogOut, ZoomIn, ZoomOut, Pin 
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  data: GridData;
  onDataUpdate: (newData: GridData) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, data, onDataUpdate, onLogout }) => {
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [frozenRows, setFrozenRows] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCellChange = (row: number, col: number, value: string) => {
    const newData = [...data];
    newData[row] = [...newData[row]]; 
    newData[row][col] = { ...newData[row][col], value };
    onDataUpdate(newData);
  };

  const handleAddRow = () => {
    const cols = data[0].length;
    const newRow: CellData[] = Array(cols).fill(null).map(() => ({ value: '' }));
    onDataUpdate([...data, newRow]);
  };

  const handleAddCol = () => {
    const newData = data.map(row => [...row, { value: '' }]);
    onDataUpdate(newData);
  };

  const handleNewFile = () => {
    if (confirm("Create new file? Unsaved changes will be lost.")) {
      onDataUpdate(generateEmptyGrid(50, 30));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const newData = await parseExcelFile(e.target.files[0]);
        onDataUpdate(newData);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert("Error loading file");
      }
    }
  };

  const handleExport = () => {
    exportToExcel(data, `Planning_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const step = 0.1;
      let newZoom = direction === 'in' ? prev + step : prev - step;
      newZoom = Math.max(0.1, Math.min(newZoom, 3.0));
      return Math.round(newZoom * 10) / 10;
    });
  };

  const toggleFreeze = () => {
    if (frozenRows > 0) {
        setFrozenRows(0);
    } else {
        if (selection) {
            let target = 1;
            if (selection.type === 'row') target = selection.row;
            else if (selection.type === 'cell') target = selection.row;
            else if (selection.type === 'range') target = selection.startRow;
            target = target > 0 ? target : 1;
            setFrozenRows(target);
        } else {
            setFrozenRows(1);
        }
    }
  };

  const getSelectionLabel = () => {
    if (!selection) return 'Ready';
    if (selection.type === 'cell') return `Pos: ${numberToColumn(selection.col)}${selection.row + 1}`;
    if (selection.type === 'range') return `Range: ${numberToColumn(selection.startCol)}${selection.startRow + 1}:${numberToColumn(selection.endCol)}${selection.endRow + 1}`;
    return 'Selection';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-sm font-sans">
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <Grid3X3 className="w-4 h-4" />
          </div>
          <div><h1 className="font-bold leading-tight">Admin</h1></div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">{user.name}</span>
          <Button variant="ghost" className="!px-2 !py-1" onClick={onLogout} icon={<LogOut size={12} />}>Logout</Button>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="bg-white border-b px-2 py-1 flex flex-wrap gap-1 items-center shadow-sm z-10 select-none">
        {/* File Ops */}
        <div className="flex gap-1 border-r pr-2 mr-1">
            <Button className="!px-2 !py-1 !text-xs" onClick={handleNewFile} icon={<FilePlus size={14} />} title="New" />
            <Button className="!px-2 !py-1 !text-xs" onClick={() => fileInputRef.current?.click()} icon={<FolderOpen size={14} />} title="Open" />
            <Button variant="primary" className="!px-2 !py-1 !text-xs" onClick={handleExport} icon={<Save size={14} />} title="Save" />
            <input type="file" ref={fileInputRef} hidden accept=".xlsx,.csv" onChange={handleFileUpload} />
        </div>
        
        {/* Structure */}
        <div className="flex gap-1 border-r pr-2 mr-1">
             <Button className="!px-2 !py-1 !text-xs" onClick={handleAddRow} icon={<PlusSquare size={14} />} title="Add Row" />
             <Button className="!px-2 !py-1 !text-xs" onClick={handleAddCol} icon={<Grid3X3 size={14} />} title="Add Column" />
        </div>

        {/* View */}
        <div className="flex gap-1 items-center border-r pr-2 mr-1">
            <Button className="!px-2 !py-1 !text-xs" onClick={() => handleZoom('out')} icon={<ZoomOut size={14} />} />
            <span className="text-xs font-mono w-10 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
            <Button className="!px-2 !py-1 !text-xs" onClick={() => handleZoom('in')} icon={<ZoomIn size={14} />} />
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <Button 
                variant={frozenRows > 0 ? 'primary' : 'secondary'}
                className="!px-2 !py-1 !text-xs w-28" 
                onClick={toggleFreeze} 
                icon={<Pin size={14} className={frozenRows > 0 ? "fill-current" : ""} />}
            >
                {frozenRows > 0 ? "Unfreeze" : "Freeze"}
            </Button>
        </div>

        {/* System */}
        <div className="flex gap-1">
            <Button className="!px-2 !py-1 !text-xs" icon={<Download size={14} />} onClick={handleExport} title="Export" />
            <Button className="!px-2 !py-1 !text-xs text-red-600 hover:text-red-700 hover:bg-red-50" icon={<Trash2 size={14} />} onClick={() => {
                if(confirm('Clear all data?')) onDataUpdate(generateEmptyGrid(50, 30));
            }} title="Clear" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-2">
        <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <Grid 
            data={data} 
            selection={selection}
            onSelectionChange={setSelection}
            onCellChange={handleCellChange}
            scale={zoom}
            onZoomChange={setZoom}
            frozenRows={frozenRows}
          />
          <div className="bg-gray-50 border-t px-2 py-0.5 text-[10px] text-gray-500 flex justify-between select-none">
            <span>{getSelectionLabel()}</span>
            <div className="flex gap-4">
                {frozenRows > 0 && <span className="text-blue-600 font-medium">Frozen: {frozenRows} row(s)</span>}
                <span>{data.length}x{data[0]?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};