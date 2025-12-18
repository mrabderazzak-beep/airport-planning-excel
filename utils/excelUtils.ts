import * as XLSX from 'xlsx';
import { GridData, CellData } from '../types';

export const generateEmptyGrid = (rows: number, cols: number): GridData => {
  return Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({ value: '' }))
  );
};

export const parseExcelFile = async (file: File): Promise<GridData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // cellStyles: true is required to read styling info if available
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Decode range to get dimensions
        const ref = worksheet['!ref'];
        if (!ref) {
            resolve(generateEmptyGrid(10, 10));
            return;
        }
        
        const range = XLSX.utils.decode_range(ref);
        
        // STRICT DIMENSIONS: Use the exact range from the file
        const rows = range.e.r + 1;
        const cols = range.e.c + 1;
        
        // Initialize grid with empty cells
        const grid: GridData = Array(rows).fill(null).map(() => 
            Array(cols).fill(null).map(() => ({ value: '' }))
        );

        // COLUMN WIDTHS: Extract !cols and store in the first row
        const colWidths = worksheet['!cols'] || [];
        
        // ROW HEIGHTS: Extract !rows
        const rowHeights = worksheet['!rows'] || [];
        
        // Fill values and styles
        for (let R = 0; R <= range.e.r; ++R) {
            for (let C = 0; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
                const cell = worksheet[cellAddress];
                
                const gridCell = grid[R][C];

                // Store Column Width in first row cells
                if (R === 0) {
                   const colInfo = colWidths[C];
                   if (colInfo) {
                       if (colInfo.wpx) {
                           gridCell.width = colInfo.wpx;
                       } else if (colInfo.wch) {
                           gridCell.width = colInfo.wch * 7.5; 
                       }
                   }
                }

                // Store Row Height in first column cells of each row
                if (C === 0) {
                    const rowInfo = rowHeights[R];
                    if (rowInfo) {
                        if (rowInfo.hpx) {
                            gridCell.height = rowInfo.hpx;
                        } else if (rowInfo.hpt) {
                            gridCell.height = rowInfo.hpt * 1.33;
                        }
                    }
                }

                if (cell) {
                    // 1. VALUE
                    // Use formatted text (w) if available, otherwise value (v)
                    gridCell.value = String(cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : ''));

                    // 2. STYLES (Try to extract from cell.s if available)
                    if (cell.s) {
                        // Background Color
                        if (cell.s.fgColor && cell.s.fgColor.rgb) {
                            gridCell.color = '#' + cell.s.fgColor.rgb;
                        } else if (cell.s.fill && cell.s.fill.fgColor && cell.s.fill.fgColor.rgb) {
                             gridCell.color = '#' + cell.s.fill.fgColor.rgb;
                        }

                        // Font Styles
                        if (cell.s.font) {
                            if (cell.s.font.bold) gridCell.bold = true;
                            if (cell.s.font.italic) gridCell.italic = true;
                            if (cell.s.font.underline) gridCell.underline = true;
                            if (cell.s.font.color && cell.s.font.color.rgb) {
                                gridCell.textColor = '#' + cell.s.font.color.rgb;
                            }
                        }

                        // Alignment
                        if (cell.s.alignment) {
                            if (cell.s.alignment.horizontal) gridCell.align = cell.s.alignment.horizontal;
                            if (cell.s.alignment.vertical) {
                                const v = cell.s.alignment.vertical;
                                if (v === 'center' || v === 'top' || v === 'bottom') {
                                    gridCell.valign = v as any;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Handle Merges
        if (worksheet['!merges']) {
            worksheet['!merges'].forEach((merge: XLSX.Range) => {
                const startRow = merge.s.r;
                const startCol = merge.s.c;
                const endRow = merge.e.r;
                const endCol = merge.e.c;

                // Check bounds to avoid errors if merges exceed strict range
                if (startRow < rows && startCol < cols) {
                    const cell = grid[startRow][startCol];
                    cell.rowSpan = endRow - startRow + 1;
                    cell.colSpan = endCol - startCol + 1;

                    // Mark covered cells as hidden
                    for (let r = startRow; r <= endRow; r++) {
                        for (let c = startCol; c <= endCol; c++) {
                            if (r === startRow && c === startCol) continue; // Skip the main cell
                            if (r < rows && c < cols) {
                                grid[r][c].hidden = true;
                                // Propagate styles from main cell to hidden cells (optional, but good for borders/backgrounds visually if we were rendering them)
                                // grid[r][c].color = cell.color; 
                            }
                        }
                    }
                }
            });
        }

        resolve(grid);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (data: GridData, filename: string) => {
  // Extract values
  const aoa = data.map(row => row.map(cell => cell.value));
  
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  
  // Export column widths and row heights
  if (data.length > 0) {
      const colWidths = data[0].map(cell => ({ wpx: cell.width || 64 }));
      ws['!cols'] = colWidths;
      
      const rowHeights = data.map(row => ({ hpx: row[0]?.height || 24 }));
      ws['!rows'] = rowHeights;
  }

  // Export Merges
  const merges: XLSX.Range[] = [];
  data.forEach((row, r) => {
      row.forEach((cell, c) => {
          if ((cell.rowSpan && cell.rowSpan > 1) || (cell.colSpan && cell.colSpan > 1)) {
              merges.push({
                  s: { r, c },
                  e: { r: r + (cell.rowSpan || 1) - 1, c: c + (cell.colSpan || 1) - 1 }
              });
          }
      });
  });
  if (merges.length > 0) {
      ws['!merges'] = merges;
  }

  // Note: Standard SheetJS export doesn't support writing rich styles to XLSX easily without 'xlsx-style' or Pro.
  // We prioritize structure here.

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planning");
  
  XLSX.writeFile(wb, filename);
};

export const numberToColumn = (num: number): string => {
  let column = '';
  let n = num;
  while (n >= 0) {
    column = String.fromCharCode(65 + (n % 26)) + column;
    n = Math.floor(n / 26) - 1;
  }
  return column;
};