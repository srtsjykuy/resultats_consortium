// Gestion du stockage local sécurisé
const STORAGE_KEY = 'consortium_data';
const SETTINGS_KEY = 'consortium_settings';

export interface StorageData {
  persons: any[];
  lastUpdate: number;
}

export interface StorageSettings {
  countdownSettings: any;
  lastUpdate: number;
}

export const saveToStorage = (data: StorageData): void => {
  try {
    const encrypted = btoa(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
  }
};

export const loadFromStorage = (): StorageData | null => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    
    const decrypted = atob(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erreur de chargement:', error);
    return null;
  }
};

export const saveSettings = (settings: StorageSettings): void => {
  try {
    const encrypted = btoa(JSON.stringify(settings));
    localStorage.setItem(SETTINGS_KEY, encrypted);
  } catch (error) {
    console.error('Erreur de sauvegarde des paramètres:', error);
  }
};

export const loadSettings = (): StorageSettings | null => {
  try {
    const encrypted = localStorage.getItem(SETTINGS_KEY);
    if (!encrypted) return null;
    
    const decrypted = atob(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erreur de chargement des paramètres:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};