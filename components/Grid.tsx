import React, { useCallback, useState, useRef, useEffect } from 'react';
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

  // Auto-focus textarea
  useEffect(() => {
    if (selection?.type === 'cell' && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [selection]);

  // Hide tooltip on scroll or zoom interaction
  useEffect(() => {
    const handleScroll = () => setActiveTooltip(null);
    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, rowIndex: number, colIndex: number) => {
    if (onCellChange) {
      onCellChange(rowIndex, colIndex, e.target.value);
    }
  }, [onCellChange]);

  const handleMouseDown = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    if (readOnly) return;
    setIsDragging(true);
    dragStartRef.current = { row: rowIndex, col: colIndex };
    onSelectionChange?.({ type: 'cell', row: rowIndex, col: colIndex });
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleMouseEnter = (e: React.MouseEvent, rowIndex: number, colIndex: number, isBubble: boolean, cellValue: string, colSpan: number) => {
    // Drag Selection Logic (Admin Only)
    if (!readOnly && isDragging && dragStartRef.current) {
      const start = dragStartRef.current;
      const minRow = Math.min(start.row, rowIndex);
      const maxRow = Math.max(start.row, rowIndex);
      const minCol = Math.min(start.col, colIndex);
      const maxCol = Math.max(start.col, colIndex);

      if (minRow === maxRow && minCol === maxCol) {
         onSelectionChange?.({ type: 'cell', row: minRow, col: minCol });
      } else {
         onSelectionChange?.({ 
            type: 'range', 
            startRow: minRow, 
            startCol: minCol, 
            endRow: maxRow, 
            endCol: maxCol 
         });
      }
    }

    // Tooltip Logic (ReadOnly Hover)
    if (readOnly && isBubble) {
       showTooltip(e.clientX, e.clientY, cellValue, colIndex, colSpan);
    }
  };

  const handleMouseLeave = () => {
      setActiveTooltip(null);
  };

  const handleTaskClick = (e: React.MouseEvent, cellValue: string, colIndex: number, colSpan: number) => {
      if (readOnly) {
          if (activeTooltip) {
              setActiveTooltip(null);
          } else {
              showTooltip(e.clientX, e.clientY, cellValue, colIndex, colSpan);
          }
      }
  };

  const showTooltip = (x: number, y: number, cellValue: string, colIndex: number, colSpan: number) => {
      const startHeader = data[0][colIndex]?.value;
      const endHeader = data[0][colIndex + (colSpan || 1)]?.value;
      
      const startT = parseHeaderTime(startHeader);
      const endT = parseHeaderTime(endHeader);
      
      let timeStr = '';
      if (startT) {
           const startStr = startT.full;
           const endStr = endT ? endT.full : ''; 
           timeStr = endStr ? `${startStr} - ${endStr}` : `Début: ${startStr}`;
      }

      const tooltipWidth = 180;
      let finalX = x;
      if (x + tooltipWidth / 2 > window.innerWidth) {
          finalX = window.innerWidth - tooltipWidth / 2 - 10;
      } else if (x - tooltipWidth / 2 < 0) {
          finalX = tooltipWidth / 2 + 10;
      }

      setActiveTooltip({
          x: finalX,
          y: y + 20,
          title: cellValue,
          sub: timeStr
      });
  };

  // HELPER: Extract time
  const parseHeaderTime = (val: string) => {
      const match = String(val || '').match(/\b([0-9]{1,2})[:hH]([0-9]{2})\b/);
      if (match) return { full: match[0], hour: match[1], minute: match[2] };
      return null;
  };

  // TOUCH HANDLERS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && containerRef.current) {
        panStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDist.current = dist;
      pinchStartScale.current = scale;
      panStartRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if(e.cancelable && e.touches.length > 1) e.preventDefault(); 
    if (e.touches.length === 1 && panStartRef.current && containerRef.current) {
        const dx = e.touches[0].clientX - panStartRef.current.x;
        const dy = e.touches[0].clientY - panStartRef.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setActiveTooltip(null);
        containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
        containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    } else if (e.touches.length === 2 && pinchStartDist.current !== null && onZoomChange) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const ratio = dist / pinchStartDist.current;
      const newScale = Math.min(Math.max(0.1, pinchStartScale.current * ratio), 3.0);
      onZoomChange(newScale);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDist.current = null;
    panStartRef.current = null;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => isDragging && handleMouseUp();
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, selection, handleMouseUp]);

  if (!data || data.length === 0) return null;

  const colsCount = data[0].length;
  const colHeaders = Array.from({ length: colsCount }, (_, i) => numberToColumn(i));

  // COMPACT THEME DIMENSIONS
  const fontSize = 10 * scale; 
  const lineHeight = 1.1;
  const cellPadding = 2 * scale;
  const headerHeight = 22 * scale;
  const rowNumWidth = 26 * scale;

  const getRowHeight = (rowIndex: number) => {
    const definedHeight = data[rowIndex][0]?.height;
    return definedHeight ? definedHeight * scale : 20 * scale; 
  };

  const rowOffsets: number[] = [];
  let currentOffset = readOnly ? 0 : headerHeight; 
  for (let i = 0; i < frozenRows; i++) {
    rowOffsets[i] = currentOffset;
    currentOffset += getRowHeight(i);
  }

  const isCellSelected = (sel: GridSelection | null, r: number, c: number) => {
      if (!sel) return false;
      if (sel.type === 'cell') return sel.row === r && sel.col === c;
      if (sel.type === 'row') return sel.row === r;
      if (sel.type === 'col') return sel.col === c;
      if (sel.type === 'range') return r >= sel.startRow && r <= sel.endRow && c >= sel.startCol && c <= sel.endCol;
      return false;
  };

  const getSelectionBorders = (sel: GridSelection | null, r: number, c: number) => {
      if (!sel || !isCellSelected(sel, r, c)) return { top: false, bottom: false, left: false, right: false };
      let top = false, bottom = false, left = false, right = false;
      if (sel.type === 'cell') { top = bottom = left = right = true; }
      else if (sel.type === 'row') { top = bottom = true; left = c === 0; right = c === data[0].length - 1; }
      else if (sel.type === 'col') { left = right = true; top = r === 0; bottom = r === data.length - 1; }
      else if (sel.type === 'range') { top = r === sel.startRow; bottom = r === sel.endRow; left = c === sel.startCol; right = c === sel.endCol; }
      return { top, bottom, left, right };
  };

  const isMajorTickColumn = (colIndex: number) => {
      const timeData = parseHeaderTime(data[0][colIndex]?.value);
      return timeData?.minute === '00';
  };

  return (
    <>
    <div 
        ref={containerRef}
        className="relative overflow-auto flex-1 custom-scrollbar bg-white w-full h-full select-none cursor-cell"
        style={{ touchAction: 'none' }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
    >
      <table className="border-collapse table-fixed bg-white" style={{ minWidth: '100%' }}>
        <colgroup>
            <col style={{ width: `${rowNumWidth}px` }} />
            {colHeaders.map((col, index) => {
                const baseWidth = data[0][index]?.width || 80; 
                const appliedBaseWidth = readOnly ? 18 : baseWidth;
                const scaledWidth = Math.max(5, appliedBaseWidth * scale); 
                return <col key={index} style={{ width: `${scaledWidth}px` }} />;
            })}
        </colgroup>

        {!readOnly && (
            <thead className="sticky top-0 z-30 bg-gray-50 shadow-sm ring-1 ring-gray-200">
            <tr>
                <th 
                    className="bg-gray-100 border-r border-b border-gray-300 sticky left-0 z-40 cursor-pointer hover:bg-gray-200" 
                    style={{ width: `${rowNumWidth}px`, height: `${headerHeight}px` }}
                    onClick={() => onSelectionChange?.(null)}
                ></th>
                {colHeaders.map((col, index) => {
                const isColSelected = (selection?.type === 'col' && selection.col === index) || (selection?.type === 'range' && index >= selection.startCol && index <= selection.endCol);
                return (
                    <th 
                        key={index} 
                        className={`border-r border-b border-gray-300 font-semibold text-gray-600 text-center leading-none transition-colors ${isColSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                        style={{ height: `${headerHeight}px`, fontSize: `${fontSize}px` }}
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
              <tr key={rowIndex} className={`${isHighlighted ? 'bg-yellow-50' : ''}`} style={{ height: getRowHeight(rowIndex) }}>
                <td 
                    className={`border-r text-center font-medium text-gray-500 sticky left-0 select-none cursor-pointer transition-colors 
                        ${isRowSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 hover:bg-gray-100'}
                        ${isFrozenRow ? 'z-30' : 'border-b border-gray-300 z-20'}
                        ${isLastFrozenRow && !readOnly ? 'border-b-2 border-gray-400' : (isFrozenRow ? 'border-b border-gray-200' : '')}
                    `}
                    style={{ fontSize: `${fontSize * 0.9}px`, width: `${rowNumWidth}px`, top: isFrozenRow ? `${rowOffsets[rowIndex]}px` : undefined }}
                    onClick={() => onSelectionChange?.({ type: 'row', row: rowIndex })}
                >
                  {rowIndex + 1}
                </td>

                {row.map((cell, colIndex) => {
                  if (cell.hidden) return null; 

                  const isSelected = isCellSelected(selection, rowIndex, colIndex);
                  const borders = getSelectionBorders(selection, rowIndex, colIndex);
                  
                  let bgColor = cell.color || 'transparent'; 
                  let textColor = cell.textColor || 'text-gray-900';
                  
                  if (!cell.color && !cell.textColor) {
                     const isServiceRow = cell.value.toLowerCase().includes('service'); 
                     if (isHighlighted) bgColor = '#fffde7'; 
                     else if (isHeaderRow) { bgColor = '#f8fafc'; textColor = '#475569'; } 
                     else if (isServiceRow) { bgColor = '#2563eb'; textColor = '#ffffff'; } 
                  }
                  
                  const isBubble = readOnly && !isHeaderRow && cell.value.trim() !== '';
                  const cellBgColor = isBubble ? 'transparent' : bgColor;
                  const bubbleBgColor = isBubble ? (bgColor !== 'transparent' ? bgColor : '#f3f4f6') : 'transparent';
                  const bubbleTextColor = isBubble ? (bgColor !== 'transparent' && !cell.textColor ? 'inherit' : textColor) : textColor;
                  
                  const textAlign = cell.align || 'center';
                  const verticalAlign = cell.valign === 'top' ? 'flex-start' : (cell.valign === 'bottom' ? 'flex-end' : 'center');

                  const isMajorTick = readOnly && isMajorTickColumn(colIndex);
                  let displayValue = cell.value;
                  
                  // UPDATED HEADER LOGIC FOR READ-ONLY (Agent View)
                  if (readOnly && isHeaderRow) {
                      const timeData = parseHeaderTime(cell.value);
                      if (timeData) {
                          // It's a time string, apply "Ruler" behavior
                          displayValue = (timeData.minute === '00') ? timeData.hour : '';
                      } else {
                          // Not a time string (e.g., "ID", "Poste", "Nom"), show full text!
                          displayValue = cell.value;
                      }
                  }

                  const isHexColor = bubbleTextColor.startsWith('#');
                  const textColorClass = !isHexColor ? bubbleTextColor : '';
                  const isEditing = !readOnly && selection?.type === 'cell' && isSelected;

                  // RULER BORDERS
                  let cellBorderClass = 'border-r border-b border-gray-300';
                  if (readOnly) {
                      if (isHeaderRow) {
                          const left = isMajorTick ? 'border-l-2 border-l-gray-400' : 'border-l border-l-gray-200';
                          cellBorderClass = `${left} border-b-2 border-b-gray-400 bg-gray-50`;
                      } else {
                          const left = isMajorTick ? 'border-l border-l-gray-300' : 'border-l border-l-gray-100';
                          cellBorderClass = `border-b border-gray-100 ${left}`;
                      }
                  }

                  const contentStyle = {
                    fontSize: `${fontSize}px`,
                    padding: `${cellPadding}px`,
                    lineHeight: lineHeight,
                    fontFamily: 'Inter, sans-serif',
                    textAlign: textAlign as any,
                    color: isHexColor ? bubbleTextColor : undefined,
                  };

                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      className={`relative align-top transition-colors 
                        ${readOnly ? 'cursor-default' : 'cursor-cell'} 
                        ${isFrozenRow ? 'sticky z-20' : ''} 
                        ${cellBorderClass}
                        ${isLastFrozenRow && !readOnly ? 'border-b-2 border-gray-400 shadow-sm' : ''}
                        ${!isBubble ? textColorClass : ''}
                      `}
                      style={{
                        backgroundColor: (readOnly && isHeaderRow) ? '#f9fafb' : cellBgColor,
                        top: isFrozenRow ? `${rowOffsets[rowIndex]}px` : undefined,
                        height: '1px',
                        fontWeight: cell.bold ? 'bold' : 'normal',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                      onMouseEnter={(e) => handleMouseEnter(e, rowIndex, colIndex, isBubble || false, cell.value, cell.colSpan || 1)}
                      onMouseLeave={handleMouseLeave}
                      onClick={(e) => handleTaskClick(e, cell.value, colIndex, cell.colSpan || 1)}
                    >
                       <div className="relative w-full h-full min-h-full">
                            {isEditing ? (
                                <textarea
                                    ref={textareaRef}
                                    className="absolute inset-0 w-full h-full bg-transparent resize-none overflow-hidden focus:outline-none z-10"
                                    style={{ ...contentStyle, paddingTop: verticalAlign === 'flex-start' ? `${cellPadding}px` : undefined }}
                                    value={cell.value}
                                    onChange={(e) => handleInput(e, rowIndex, colIndex)}
                                    spellCheck={false}
                                />
                            ) : (
                                <div className={`w-full h-full ${isBubble ? 'flex items-center justify-center' : ''}`}>
                                    {isBubble ? (
                                        <div 
                                            className={`rounded shadow-sm w-full mx-0.5 my-0.5 px-1 truncate ${textColorClass}`}
                                            style={{
                                                backgroundColor: bubbleBgColor,
                                                color: isHexColor ? bubbleTextColor : undefined,
                                                fontSize: `${fontSize}px`,
                                                height: 'calc(100% - 2px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center'),
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {cell.value}
                                        </div>
                                    ) : (
                                        <div 
                                            className={`w-full h-full whitespace-pre-wrap break-words`}
                                            style={{
                                                ...contentStyle,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: verticalAlign,
                                                minHeight: `${getRowHeight(rowIndex)}px`,
                                                fontWeight: cell.bold ? 'bold' : (isHeaderRow ? 'bold' : 'normal'),
                                                alignItems: (readOnly && isHeaderRow) ? 'flex-start' : undefined,
                                            }}
                                        >
                                            {displayValue || (readOnly && isHeaderRow ? '' : '\u00A0')}
                                        </div>
                                    )}
                                </div>
                            )}
                       </div>
                       
                       {isSelected && !readOnly && (
                           <>
                               {borders.top && <div className="absolute top-[-1px] left-[-1px] right-[-1px] h-[2px] bg-blue-600 pointer-events-none z-20"></div>}
                               {borders.bottom && <div className="absolute bottom-[-1px] left-[-1px] right-[-1px] h-[2px] bg-blue-600 pointer-events-none z-20"></div>}
                               {borders.left && <div className="absolute left-[-1px] top-[-1px] bottom-[-1px] w-[2px] bg-blue-600 pointer-events-none z-20"></div>}
                               {borders.right && <div className="absolute right-[-1px] top-[-1px] bottom-[-1px] w-[2px] bg-blue-600 pointer-events-none z-20"></div>}
                           </>
                       )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    
    {/* CUSTOM TOOLTIP */}
    {activeTooltip && (
        <div 
            className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
            style={{ left: activeTooltip.x, top: activeTooltip.y }}
        >
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