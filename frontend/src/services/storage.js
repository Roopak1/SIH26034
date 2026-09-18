/**
 * Local Storage abstraction for client-side inspection history caching and active session state.
 */

const STORAGE_KEY = 'lexscan_inspections_history';
const OFFICER_KEY = 'lexscan_officer_session';
const CURRENT_INSPECTION_KEY = 'lexscan_current_inspection';

// Read the previous keys once so existing local audit history survives the rename.
const LEGACY_STORAGE_KEY = 'veriscan_inspections_history';
const LEGACY_OFFICER_KEY = 'veriscan_officer_session';
const LEGACY_CURRENT_INSPECTION_KEY = 'veriscan_current_inspection';

function readStorage(primaryKey, legacyKey) {
  return localStorage.getItem(primaryKey) ?? localStorage.getItem(legacyKey);
}

export function getStoredInspections() {
  try {
    const raw = readStorage(STORAGE_KEY, LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return [];
  }
}

export function saveInspectionToLocal(inspection) {
  try {
    const current = getStoredInspections();
    // Remove if already exists and prepend
    const filtered = current.filter(item => item.inspection_id !== inspection.inspection_id);
    filtered.unshift(inspection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 50))); // Keep last 50
    localStorage.setItem(CURRENT_INSPECTION_KEY, JSON.stringify(inspection));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

export function getCurrentInspection() {
  try {
    const raw = readStorage(CURRENT_INSPECTION_KEY, LEGACY_CURRENT_INSPECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentInspection(inspection) {
  try {
    localStorage.setItem(CURRENT_INSPECTION_KEY, JSON.stringify(inspection));
  } catch (e) {}
}

export function getOfficerSession() {
  try {
    const raw = readStorage(OFFICER_KEY, LEGACY_OFFICER_KEY);
    return raw ? JSON.parse(raw) : { officer_id: 'QA-AUDIT-901', name: 'Lead Auditor', department: 'Quality Assurance' };
  } catch (e) {
    return { officer_id: 'QA-AUDIT-901', name: 'Lead Auditor', department: 'Quality Assurance' };
  }
}

export function setOfficerSession(sessionData) {
  try {
    localStorage.setItem(OFFICER_KEY, JSON.stringify(sessionData));
  } catch (e) {}
}

export function clearOfficerSession() {
  try {
    localStorage.removeItem(OFFICER_KEY);
    localStorage.removeItem(LEGACY_OFFICER_KEY);
  } catch (e) {}
}
