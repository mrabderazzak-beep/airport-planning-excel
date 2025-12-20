
import { AppTranslation } from './types';

export const TRANSLATIONS: Record<'fr' | 'en', AppTranslation> = {
  fr: {
    loginTitle: 'Accès Planning',
    adminPassword: 'Mot de passe Administrateur',
    agentMatricule: 'Votre Matricule',
    loginButton: 'Se connecter',
    uploadTitle: 'Téléverser un nouveau planning',
    historyTitle: 'Historique des plannings',
    noData: 'Aucune donnée disponible',
    searchPlaceholder: 'Rechercher...',
    zoomIn: 'Zoom +',
    zoomOut: 'Zoom -',
    logout: 'Déconnexion',
    delete: 'Supprimer',
    errorMatricule: 'Matricule non trouvé dans le planning actuel.',
    smartAudit: 'Analyse IA',
    lastUpdated: 'Dernière mise à jour',
    shiftInfo: 'Informations de Shift'
  },
  en: {
    loginTitle: 'Planning Access',
    adminPassword: 'Admin Password',
    agentMatricule: 'Your Matricule',
    loginButton: 'Login',
    uploadTitle: 'Upload New Planning',
    historyTitle: 'Planning History',
    noData: 'No data available',
    searchPlaceholder: 'Search...',
    zoomIn: 'Zoom +',
    zoomOut: 'Zoom -',
    logout: 'Logout',
    delete: 'Delete',
    errorMatricule: 'Matricule not found in current planning.',
    smartAudit: 'AI Audit',
    lastUpdated: 'Last updated',
    shiftInfo: 'Shift Information'
  }
};

export const ADMIN_PASSWORD = 'admin'; // For demo purposes
export const AGENT_PASSWORD = 'agent'; // New: Required for agent login
export const MAX_HISTORY = 20;
export const EXPIRATION_DAYS = 7;
