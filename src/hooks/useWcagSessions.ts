// DEPRECATED: WCAG Coach nutzt jetzt das Credit-System
// Dieser Hook wird nicht mehr verwendet und kann entfernt werden

export function useWcagSessions() {
  
  return {
    sessions: 0,
    loading: false,
    sessionLimit: 0,
    remainingSessions: 0,
    hasSessionsLeft: () => false,
    useSession: async () => false,
    resetSessions: async () => {},
    bundleInfo: null
  }
} 