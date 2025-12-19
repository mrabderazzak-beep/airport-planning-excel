import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { GridData, GridSelection, CellData } from '../types';
import { numberToColumn } from '../utils/excelUtils';

interface GridProps {
  data: GridData;
  readOnly?: boolean;
  highlightRowIndex?: number | null;
  onCellChange?: (row: number, col: number, value: string) => void;
  onSelectionChange?: (selection: GridSelection | null) => void;
  selection?: GridSelection | null;
  scale?: number;
  onZoomChange?: (scale: number) => void;
  frozenRows?: number;
}

// Cellule mémoïsée pour des performances maximales
const GridCell = React.memo(({ 
  cell, rowIndex, colIndex, isSelected, isEditing, readOnly, isHeaderRow, isBubble, 
  fontSize, verticalAlign, textAlign, borderClass, textColor, bubbleBgColor, 
  onMouseDown, onMouseEnter, onClick, textareaRef, handleInput, displayValue
}: any) => {
  const isHexColor = textColor && textColor.startsWith('#');
  
  return (
    <td
      className={`relative align-top ${borderClass}`}
      style={{
        backgroundColor: (readOnly && isHeaderRow) ? '#f9fafb' : (isBubble ? 'transparent' : (cell.color || 'transparent')),
        height: '1px',
        fontWeight: cell.bold ? 'bold' : 'normal',
        color: !isBubble && isHexColor ? textColor : undefined,
      }}
      onMouseDown={() => onMouseDown(rowIndex, colIndex)}
      onMouseEnter={(e) => onMouseEnter(e, rowIndex, colIndex, isBubble, cell.value, cell.colSpan || 1)}
      onClick={(e) => readOnly && onClick(e, cell.value, colIndex, cell.colSpan || 1)}
    >
      <div className="relative w-full h-full overflow-hidden">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="absolute inset-0 w-full h-full bg-white z-10 resize-none focus:outline-none p-0.5 border-none shadow-sm"
            style={{ fontSize: `${fontSize}px` }}
            value={cell.value}
            onChange={(e) => handleInput(e, rowIndex, colIndex)}
            spellCheck={false}
          />
        ) : (
          <div className={`w-full h-full ${isBubble ? 'flex items-center justify-center' : 'flex flex-col'}`} style={{ justifyContent: verticalAlign }}>
            {isBubble ? (
              <div 
                className="rounded shadow-sm mx-0.5 my-0.5 px-1 truncate flex items-center border border-black/5"
                style={{
                  backgroundColor: bubbleBgColor,
                  color: isHexColor ? textColor : undefined,
                  fontSize: `${fontSize}px`,
                  height: 'calc(100% - 2px)',
                  justifyContent: textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center'),
                }}
              >
                {cell.value}
              </div>
            ) : (
              <div className="w-full h-full p-0.5" style={{ fontSize: `${fontSize}px`, textAlign: textAlign as any }}>
                {displayValue || '\u00A0'}
              </div>
            )}
          </div>
        )}
      </div>
    </td>
  );
});

// Ligne mémoïsée : l'élément clé pour la fluidité mobile
const GridRow = React.memo(({ 
  row, rowIndex, isFrozen, isHeaderRow, isHighlighted, rowHeight, rowOffset, 
  fontSize, readOnly, selection, parseHeaderTime, isCellSelected, ...cellProps 
}: any) => {
  return (
    <tr 
      style={{ 
        height: `${rowHeight}px`,
        contentVisibility: isFrozen ? 'visible' : 'auto',
        containIntrinsicSize: `auto ${rowHeight}px`
      }}
      className={isHighlighted ? 'bg-yellow-50/50' : ''}
    >
      <td 
        className={`border-r text-center font-medium text-gray-500 sticky left-0 z-30 transition-colors bg-gray-50 ${isFrozen ? 'z-40' : 'border-b border-gray-300'}`}
        style={{ fontSize: `${fontSize * 0.9}px`, top: isFrozen ? `${rowOffset}px` : undefined }}
      >
        {rowIndex + 1}
      </td>
      {row.map((cell: any, colIndex: number) => {
        if (cell.hidden) return null;
        
        const isSelected = isCellSelected(rowIndex, colIndex);
        const isBubble = readOnly && !isHeaderRow && cell.value.trim() !== '';
        const timeData = parseHeaderTime(cell.value);
        const isMajorTick = readOnly && timeData && timeData.minute === '00';

        let borderClass = 'border-r border-b border-gray-300';
        if (readOnly) {
          const l = isMajorTick ? 'border-l-2 border-l-gray-400' : 'border-l border-l-gray-200';
          borderClass = isHeaderRow ? `${l} border-b-2 border-b-gray-400` : `border-b border-gray-100 ${isMajorTick ? 'border-l border-l-gray-300' : 'border-l border-l-gray-100'}`;
        }

        let displayValue = cell.value;
        if (readOnly && isHeaderRow) {
          displayValue = timeData ? (timeData.minute === '00' ? timeData.hour : '') : cell.value;
        }

        return (
          <GridCell
            key={colIndex}
            cell={cell}
            rowIndex={rowIndex}
            colIndex={colIndex}
            isSelected={isSelected}
            isEditing={!readOnly && selection?.type === 'cell' && isSelected}
            readOnly={readOnly}
            isHeaderRow={isHeaderRow}
            isBubble={isBubble}
            fontSize={fontSize}
            verticalAlign={cell.valign === 'top' ? 'flex-start' : (cell.valign === 'bottom' ? 'flex-end' : 'center')}
            textAlign={cell.align || 'center'}
            borderClass={borderClass}
            textColor={cell.textColor || (cell.value.toLowerCase().includes('service') ? '#ffffff' : '#1e293b')}
            bubbleBgColor={cell.color || '#f3f4f6'}
            displayValue={displayValue}
            {...cellProps}
          />
        );
      })}
    </tr>
  );
});

export const Grid: React.FC<GridProps> = ({
  data, readOnly = false, highlightRowIndex, onCellChange, onSelectionChange, 
  selection, scale = 1, onZoomChange, frozenRows = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ x: number, y: number, title: string, sub: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ row: number, col: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(scale);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const handleScroll = () => setActiveTooltip(null);
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      el?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const parseHeaderTime = useCallback((val: string) => {
    const match = String(val || '').match(/\b([0-9]{1,2})[:hH]([0-9]{2})\b/);
    return match ? { full: match[0], hour: match[1], minute: match[2] } : null;
  }, []);

  const showTooltip = useCallback((x: number, y: number, cellValue: string, colIndex: number, colSpan: number) => {
    const startT = parseHeaderTime(data[0][colIndex]?.value);
    const endT = parseHeaderTime(data[0][colIndex + colSpan]?.value);
    const timeStr = startT ? (endT ? `${startT.full} - ${endT.full}` : `Début: ${startT.full}`) : '';
    const finalX = Math.min(Math.max(x, 100), window.innerWidth - 100);
    setActiveTooltip({ x: finalX, y: y + 20, title: cellValue, sub: timeStr });
  }, [data, parseHeaderTime]);

  const rowHeights = useMemo(() => data.map(row => (row[0]?.height || 20) * scale), [data, scale]);
  const rowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let current = readOnly ? 0 : 22 * scale;
    for (let i = 0; i < frozenRows; i++) {
      offsets[i] = current;
      current += rowHeights[i];
    }
    return offsets;
  }, [frozenRows, readOnly, scale, rowHeights]);

  const isCellSelected = useCallback((r: number, c: number) => {
    if (!selection) return false;
    if (selection.type === 'cell') return selection.row === r && selection.col === c;
    if (selection.type === 'row') return selection.row === r;
    if (selection.type === 'col') return selection.col === c;
    if (selection.type === 'range') return r >= selection.startRow && r <= selection.endRow && c >= selection.startCol && c <= selection.endCol;
    return false;
  }, [selection]);

  if (!data || data.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto flex-1 custom-scrollbar bg-white w-full h-full transform-gpu"
      style={{ touchAction: 'pan-x pan-y' }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          pinchStartDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          pinchStartScale.current = scale;
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && pinchStartDist.current && onZoomChange) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          onZoomChange(Math.min(Math.max(0.1, pinchStartScale.current * (dist / pinchStartDist.current)), 3.0));
        }
      }}
    >
      <table className="border-collapse table-fixed bg-white min-w-full transform-gpu">
        <colgroup>
          <col style={{ width: `${26 * scale}px` }} />
          {data[0].map((_, idx) => (
            <col key={idx} style={{ width: `${Math.max(5, (readOnly ? 18 : (data[0][idx]?.width || 80)) * scale)}px` }} />
          ))}
        </colgroup>
        {!readOnly && (
          <thead className="sticky top-0 z-40 bg-gray-50 shadow-sm">
            <tr>
              <th className="bg-gray-100 border-r border-b border-gray-300 sticky left-0 z-50" style={{ height: `${22 * scale}px` }}></th>
              {data[0].map((_, idx) => (
                <th key={idx} className="border-r border-b border-gray-300 text-gray-600 text-center" style={{ fontSize: `${10 * scale}px` }}>
                  {numberToColumn(idx)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((row, rowIndex) => (
            <GridRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              isFrozen={rowIndex < frozenRows}
              isHeaderRow={rowIndex === 0}
              isHighlighted={highlightRowIndex === rowIndex}
              rowHeight={rowHeights[rowIndex]}
              rowOffset={rowOffsets[rowIndex]}
              fontSize={10 * scale}
              readOnly={readOnly}
              selection={selection}
              parseHeaderTime={parseHeaderTime}
              isCellSelected={isCellSelected}
              textareaRef={textareaRef}
              onMouseDown={(r: number, c: number) => {
                if (readOnly) return;
                setIsDragging(true);
                dragStartRef.current = { row: r, col: c };
                onSelectionChange?.({ type: 'cell', row: r, col: c });
              }}
              onMouseEnter={(e: any, r: number, c: number, bubble: boolean, val: string, span: number) => {
                if (!readOnly && isDragging && dragStartRef.current) {
                  const s = dragStartRef.current;
                  onSelectionChange?.({ 
                    type: 'range', 
                    startRow: Math.min(s.row, r), startCol: Math.min(s.col, c), 
                    endRow: Math.max(s.row, r), endCol: Math.max(s.col, c) 
                  });
                }
                if (readOnly && bubble) showTooltip(e.clientX, e.clientY, val, c, span);
              }}
              handleInput={(e: any, r: number, c: number) => onCellChange?.(r, c, e.target.value)}
              onClick={(e: any, val: string, c: number, span: number) => showTooltip(e.clientX, e.clientY, val, c, span)}
            />
          ))}
        </tbody>
      </table>
      {activeTooltip && (
        <div className="fixed z-[100] pointer-events-none" style={{ left: activeTooltip.x, top: activeTooltip.y }}>
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-2xl border border-white/10 text-[10px] transform -translate-x-1/2 -translate-y-full mb-4">
            <div className="font-bold text-xs mb-0.5">{activeTooltip.title}</div>
            <div className="text-blue-300 font-mono">{activeTooltip.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
};