
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  GUEST = 'GUEST'
}

export interface CellMerge {
  s: { r: number; c: number }; // Start row, col
  e: { r: number; c: number }; // End row, col
}

export interface PlanningData {
  id: string;
  name: string;
  uploadDate: string;
  rows: any[][];
  merges: CellMerge[];
  headers: string[];
}

export interface AuthState {
  role: UserRole;
  matricule?: string;
  isAuthenticated: boolean;
}

export interface AppTranslation {
  loginTitle: string;
  adminPassword: string;
  agentMatricule: string;
  loginButton: string;
  uploadTitle: string;
  historyTitle: string;
  noData: string;
  searchPlaceholder: string;
  zoomIn: string;
  zoomOut: string;
  logout: string;
  delete: string;
  errorMatricule: string;
  smartAudit: string;
  lastUpdated: string;
  shiftInfo: string;
}
