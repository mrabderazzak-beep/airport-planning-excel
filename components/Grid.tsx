import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { GridData, GridSelection } from '../types';
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

export const Grid: React.FC<GridProps> = ({
  data,
  readOnly = false,
  highlightRowIndex,
  onCellChange,
  onSelectionChange,
  selection,
  scale = 1,
  onZoomChange,
  frozenRows = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ x: number, y: number, title: string, sub: string } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ row: number, col: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Touch / Pan / Zoom Refs
  const panStartRef = useRef<{ x: number, y: number, scrollLeft: number, scrollTop: number } | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(scale);

  // Auto-focus textarea when selecting a cell in edit mode
  useEffect(() => {
    if (selection?.type === 'cell' && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [selection]);

  // Handle global events
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    const handleScroll = () => setActiveTooltip(null);
    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      el?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, rowIndex: number, colIndex: number) => {
    if (onCellChange) onCellChange(rowIndex, colIndex, e.target.value);
  }, [onCellChange]);

  const parseHeaderTime = useCallback((val: string) => {
    const match = String(val || '').match(/\b([0-9]{1,2})[:hH]([0-9]{2})\b/);
    if (match) return { full: match[0], hour: match[1], minute: match[2] };
    return null;
  }, []);

  const showTooltip = useCallback((x: number, y: number, cellValue: string, colIndex: number, colSpan: number) => {
    const startHeader = data[0][colIndex]?.value;
    const endHeader = data[0][colIndex + (colSpan || 1)]?.value;
    
    const startT = parseHeaderTime(startHeader);
    const endT = parseHeaderTime(endHeader);
    
    let timeStr = '';
    if (startT) {
      timeStr = endT ? `${startT.full} - ${endT.full}` : `Début: ${startT.full}`;
    }

    const tooltipWidth = 180;
    let finalX = x;
    if (x + tooltipWidth / 2 > window.innerWidth) {
      finalX = window.innerWidth - tooltipWidth / 2 - 10;
    } else if (x - tooltipWidth / 2 < 0) {
      finalX = tooltipWidth / 2 + 10;
    }

    setActiveTooltip({ x: finalX, y: y + 20, title: cellValue, sub: timeStr });
  }, [data, parseHeaderTime]);

  // Event Handlers
  const handleMouseDown = (rowIndex: number, colIndex: number) => {
    if (readOnly) return;
    setIsDragging(true);
    dragStartRef.current = { row: rowIndex, col: colIndex };
    onSelectionChange?.({ type: 'cell', row: rowIndex, col: colIndex });
  };

  const handleMouseEnter = (e: React.MouseEvent, rowIndex: number, colIndex: number, isBubble: boolean, cellValue: string, colSpan: number) => {
    if (!readOnly && isDragging && dragStartRef.current) {
      const start = dragStartRef.current;
      const minRow = Math.min(start.row, rowIndex);
      const maxRow = Math.max(start.row, rowIndex);
      const minCol = Math.min(start.col, colIndex);
      const maxCol = Math.max(start.col, colIndex);

      if (minRow === maxRow && minCol === maxCol) {
        onSelectionChange?.({ type: 'cell', row: minRow, col: minCol });
      } else {
        onSelectionChange?.({ type: 'range', startRow: minRow, startCol: minCol, endRow: maxRow, endCol: maxCol });
      }
    }

    if (readOnly && isBubble) {
      showTooltip(e.clientX, e.clientY, cellValue, colIndex, colSpan);
    }
  };

  // Viewport dimensions (Compact Theme)
  const fontSize = 10 * scale; 
  const cellPadding = 2 * scale;
  const headerHeight = 22 * scale;
  const rowNumWidth = 26 * scale;

  const getRowHeight = (rowIndex: number) => {
    const h = data[rowIndex][0]?.height;
    return h ? h * scale : 20 * scale; 
  };

  const rowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = readOnly ? 0 : headerHeight; 
    for (let i = 0; i < frozenRows; i++) {
      offsets[i] = currentOffset;
      currentOffset += getRowHeight(i);
    }
    return offsets;
  }, [frozenRows, readOnly, headerHeight, scale, data]);

  const isCellSelected = (r: number, c: number) => {
    if (!selection) return false;
    const s = selection;
    if (s.type === 'cell') return s.row === r && s.col === c;
    if (s.type === 'row') return s.row === r;
    if (s.type === 'col') return s.col === c;
    if (s.type === 'range') return r >= s.startRow && r <= s.endRow && c >= s.startCol && c <= s.endCol;
    return false;
  };

  if (!data || data.length === 0) return null;

  const colsCount = data[0].length;
  const colHeaders = Array.from({ length: colsCount }, (_, i) => numberToColumn(i));

  return (
    <>
    <div 
        ref={containerRef}
        className="relative overflow-auto flex-1 custom-scrollbar bg-white w-full h-full select-none"
        style={{ touchAction: 'none' }} 
        onTouchStart={(e) => {
            if (e.touches.length === 1 && containerRef.current) {
                panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, scrollLeft: containerRef.current.scrollLeft, scrollTop: containerRef.current.scrollTop };
            } else if (e.touches.length === 2) {
                pinchStartDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                pinchStartScale.current = scale;
                panStartRef.current = null;
            }
        }}
        onTouchMove={(e) => {
            if(e.cancelable && e.touches.length > 1) e.preventDefault(); 
            if (e.touches.length === 1 && panStartRef.current && containerRef.current) {
                const dx = e.touches[0].clientX - panStartRef.current.x;
                const dy = e.touches[0].clientY - panStartRef.current.y;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setActiveTooltip(null);
                containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
                containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
            } else if (e.touches.length === 2 && pinchStartDist.current !== null && onZoomChange) {
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                onZoomChange(Math.min(Math.max(0.1, pinchStartScale.current * (dist / pinchStartDist.current)), 3.0));
            }
        }}
    >
      <table className="border-collapse table-fixed bg-white w-full">
        <colgroup>
            <col style={{ width: `${rowNumWidth}px` }} />
            {colHeaders.map((_, index) => {
                const baseWidth = data[0][index]?.width || 80; 
                const appliedBaseWidth = readOnly ? 18 : baseWidth;
                return <col key={index} style={{ width: `${Math.max(5, appliedBaseWidth * scale)}px` }} />;
            })}
        </colgroup>

        {!readOnly && (
            <thead className="sticky top-0 z-30 bg-gray-50 shadow-sm ring-1 ring-gray-200">
            <tr>
                <th 
                    className="bg-gray-100 border-r border-b border-gray-300 sticky left-0 z-40 cursor-pointer hover:bg-gray-200" 
                    style={{ height: `${headerHeight}px` }}
                    onClick={() => onSelectionChange?.(null)}
                ></th>
                {colHeaders.map((col, index) => {
                const isColSelected = (selection?.type === 'col' && selection.col === index) || (selection?.type === 'range' && index >= selection.startCol && index <= selection.endCol);
                return (
                    <th 
                        key={index} 
                        className={`border-r border-b border-gray-300 font-semibold text-gray-600 text-center leading-none transition-colors ${isColSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                        style={{ fontSize: `${fontSize}px` }}
                        onClick={() => onSelectionChange?.({ type: 'col', col: index })}
                    >
                        {col}
                    </th>
                );
                })}
            </tr>
            </thead>
        )}

        <tbody>
          {data.map((row, rowIndex) => {
            const isHighlighted = highlightRowIndex === rowIndex; 
            const isHeaderRow = rowIndex === 0; 
            const isFrozenRow = rowIndex < frozenRows;
            const isLastFrozenRow = rowIndex === frozenRows - 1;
            const isRowSelected = (selection?.type === 'row' && selection.row === rowIndex) || (selection?.type === 'range' && rowIndex >= selection.startRow && rowIndex <= selection.endRow);

            return (
              <tr key={rowIndex} className={`${isHighlighted ? 'bg-yellow-50/50' : ''}`} style={{ height: `${getRowHeight(rowIndex)}px` }}>
                <td 
                    className={`border-r text-center font-medium text-gray-500 sticky left-0 select-none cursor-pointer transition-colors 
                        ${isRowSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 hover:bg-gray-100'}
                        ${isFrozenRow ? 'z-30' : 'border-b border-gray-300 z-20'}
                        ${isLastFrozenRow && !readOnly ? 'border-b-2 border-gray-400' : (isFrozenRow ? 'border-b border-gray-200' : '')}
                    `}
                    style={{ fontSize: `${fontSize * 0.9}px`, top: isFrozenRow ? `${rowOffsets[rowIndex]}px` : undefined }}
                    onClick={() => onSelectionChange?.({ type: 'row', row: rowIndex })}
                >
                  {rowIndex + 1}
                </td>

                {row.map((cell, colIndex) => {
                  if (cell.hidden) return null; 

                  const isSelected = isCellSelected(rowIndex, colIndex);
                  let bgColor = cell.color || 'transparent'; 
                  let textColor = cell.textColor || 'text-gray-900';
                  
                  if (!cell.color && !cell.textColor) {
                     if (isHighlighted) bgColor = '#fffde7'; 
                     else if (isHeaderRow) { bgColor = '#f8fafc'; textColor = '#475569'; } 
                     else if (cell.value.toLowerCase().includes('service')) { bgColor = '#2563eb'; textColor = '#ffffff'; } 
                  }
                  
                  const isBubble = readOnly && !isHeaderRow && cell.value.trim() !== '';
                  const cellBgColor = isBubble ? 'transparent' : bgColor;
                  const bubbleBgColor = isBubble ? (bgColor !== 'transparent' ? bgColor : '#f3f4f6') : 'transparent';
                  
                  const textAlign = cell.align || 'center';
                  const verticalAlign = cell.valign === 'top' ? 'flex-start' : (cell.valign === 'bottom' ? 'flex-end' : 'center');

                  let displayValue = cell.value;
                  const timeData = parseHeaderTime(cell.value);
                  if (readOnly && isHeaderRow) {
                      displayValue = timeData ? (timeData.minute === '00' ? timeData.hour : '') : cell.value;
                  }

                  const isEditing = !readOnly && selection?.type === 'cell' && isSelected;
                  const isMajorTick = readOnly && timeData?.minute === '00';

                  let borderClass = 'border-r border-b border-gray-300';
                  if (readOnly) {
                    const l = isMajorTick ? 'border-l-2 border-l-gray-400' : 'border-l border-l-gray-200';
                    borderClass = isHeaderRow ? `${l} border-b-2 border-b-gray-400` : `border-b border-gray-100 ${isMajorTick ? 'border-l border-l-gray-300' : 'border-l border-l-gray-100'}`;
                  }

                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      className={`relative align-top ${borderClass} ${isFrozenRow ? 'sticky z-20' : ''}`}
                      style={{
                        backgroundColor: (readOnly && isHeaderRow) ? '#f9fafb' : cellBgColor,
                        top: isFrozenRow ? `${rowOffsets[rowIndex]}px` : undefined,
                        height: '1px',
                        fontWeight: cell.bold ? 'bold' : 'normal',
                        color: !isBubble && textColor.startsWith('#') ? textColor : undefined,
                      }}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={(e) => handleMouseEnter(e, rowIndex, colIndex, isBubble, cell.value, cell.colSpan || 1)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={(e) => readOnly && showTooltip(e.clientX, e.clientY, cell.value, colIndex, cell.colSpan || 1)}
                    >
                       <div className="relative w-full h-full">
                            {isEditing ? (
                                <textarea
                                    ref={textareaRef}
                                    className="absolute inset-0 w-full h-full bg-white z-10 resize-none focus:outline-none p-0.5"
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
                                                color: textColor.startsWith('#') ? textColor : undefined,
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
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    
    {activeTooltip && (
        <div className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100" style={{ left: activeTooltip.x, top: activeTooltip.y }}>
            <div className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-xl border border-white/10 text-[10px] transform -translate-x-1/2 mt-2">
                <div className="font-bold text-xs mb-0.5">{activeTooltip.title}</div>
                <div className="text-gray-300 font-mono">{activeTooltip.sub}</div>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-900/90"></div>
            </div>
        </div>
    )}
    </>
  );
};