
import React from 'react';
import { PlanningData } from '../types';

interface ExcelGridProps {
  data: PlanningData;
  zoom: number;
  highlightRowIndex?: number;
  searchTerm?: string;
}

const ExcelGrid: React.FC<ExcelGridProps> = ({ data, zoom, highlightRowIndex, searchTerm }) => {
  const { rows, merges } = data;

  // Generate Column Labels (A, B, C... Z, AA, AB...)
  const getColLabel = (index: number) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  // Helper to format Excel serial time (e.g., 0.5 -> 12:00)
  const formatTime = (value: any): string => {
    if (value === undefined || value === null || value === '') return '';
    
    if (typeof value === 'number') {
      // Excel stores time as a fraction of a 24-hour day (0 to 1)
      const totalSeconds = Math.round(value * 86400);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      return `${hStr}:${mStr}`;
    }
    
    // If it's already a string, try to clean it up or return as is
    const strVal = String(value).trim();
    // Basic regex to check if it's already in a time-like format (HH:mm:ss or HH:mm)
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(strVal)) {
      return strVal.split(':').slice(0, 2).join(':');
    }
    
    return strVal;
  };

  // Helper to get specific column widths to enhance visibility of C-H
  const getColWidth = (index: number) => {
    // C is index 2, H is index 7
    if (index >= 2 && index <= 7) return '110px'; 
    if (index < 2) return '130px'; // Nom/Prénom
    return '45px'; // Timeline cells
  };

  const formatCellValue = (value: any, cIdx: number, rIdx: number): string => {
    if (rIdx === 0) return String(value || ''); // Don't format headers
    
    // Columns C (2) to H (7) are now all treated as time-based
    if (cIdx >= 2 && cIdx <= 7) {
      return formatTime(value);
    }
    
    return String(value || '');
  };

  // Skip map for merges
  const skipMap = new Set<string>();
  merges.forEach(merge => {
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue;
        skipMap.add(`${r},${c}`);
      }
    }
  });

  const getMergeInfo = (r: number, c: number) => {
    const merge = merges.find(m => m.s.r === r && m.s.c === c);
    if (!merge) return { rowSpan: 1, colSpan: 1 };
    return {
      rowSpan: merge.e.r - merge.s.r + 1,
      colSpan: merge.e.c - merge.s.c + 1
    };
  };

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);

  return (
    <div className="excel-container flex-1 overflow-auto w-full h-full border shadow-inner bg-[#f3f3f3]">
      <div 
        className="zoom-wrapper inline-block"
        style={{ transform: `scale(${zoom})` }}
      >
        <table className="excel-table">
          <colgroup>
            <col style={{ width: '40px' }} /> {/* Row Header Column */}
            {Array.from({ length: maxCols }).map((_, i) => (
              <col key={`col-width-${i}`} style={{ width: getColWidth(i) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="corner-header"></th>
              {Array.from({ length: maxCols }).map((_, i) => (
                <th 
                  key={`col-${i}`} 
                  className={`col-header ${i >= 2 && i <= 7 ? 'bg-[#d9ead3] border-x-[#93c47d] text-[#1e4620]' : ''}`}
                >
                  {getColLabel(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              // Filtering for Agent View or Search
              if (highlightRowIndex !== undefined && rIdx !== 0 && rIdx !== highlightRowIndex) return null;
              if (searchTerm && rIdx !== 0 && !row.some(c => String(c).toLowerCase().includes(searchTerm.toLowerCase()))) return null;

              return (
                <tr key={`row-${rIdx}`} className={highlightRowIndex === rIdx ? 'bg-blue-50' : ''}>
                  <td className="row-header">{rIdx + 1}</td>
                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    if (skipMap.has(`${rIdx},${cIdx}`)) return null;
                    
                    const { rowSpan, colSpan } = getMergeInfo(rIdx, cIdx);
                    const cellValue = row[cIdx];
                    const displayValue = formatCellValue(cellValue, cIdx, rIdx);
                    
                    const isMerged = rowSpan > 1 || colSpan > 1;
                    const isHeader = rIdx === 0;
                    
                    // Highlight requested columns C to H (index 2 to 7)
                    const isHighlightedCol = cIdx >= 2 && cIdx <= 7;

                    return (
                      <td
                        key={`cell-${rIdx}-${cIdx}`}
                        rowSpan={rowSpan}
                        colSpan={colSpan}
                        className={`
                          ${isMerged ? 'merged-cell shadow-sm' : ''} 
                          ${isHeader ? 'bg-[#f8f9fa] font-bold text-center border-b-2 border-b-slate-300 text-slate-700' : 'text-slate-800'}
                          ${highlightRowIndex === rIdx && !isHeader ? 'active-cell' : ''}
                          ${isHighlightedCol && !isHeader ? 'bg-[#fafffa] font-medium text-center' : ''}
                          hover:bg-blue-50/50 cursor-cell transition-colors
                        `}
                        style={isHighlightedCol && !isHeader ? { borderLeft: '1px solid #93c47d', borderRight: '1px solid #93c47d' } : {}}
                        title={`Cell ${getColLabel(cIdx)}${rIdx + 1}: ${displayValue}`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcelGrid;
