
export type UserRole = 'admin' | 'agent' | null;

export interface User {
  role: UserRole;
  name: string;
  searchTerm?: string; // For agents auto-search
}

export interface CellData {
  value: string;
  width?: number; // Width in pixels
  height?: number; // Height in pixels
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean; // If true, this cell is part of a merge and shouldn't be rendered
  
  // Styles
  color?: string; // Background color (hex)
  textColor?: string; // Text color (hex)
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'center' | 'bottom';
}

export type GridData = CellData[][];

export type GridSelection = 
  | { type: 'cell', row: number, col: number }
  | { type: 'row', row: number }
  | { type: 'col', col: number }
  | { type: 'range', startRow: number, startCol: number, endRow: number, endCol: number };

export interface ExcelStats {
  rows: number;
  cols: number;
}
