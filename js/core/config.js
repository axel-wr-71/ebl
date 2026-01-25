// Utwórz nowy plik konfiguracyjny lub dodaj do istniejącego
export const ADMIN_CONFIG = {
    // Hasło admina (można zastąpić zmiennymi środowiskowymi)
    PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || "admin123secure",
    
    // Czas ważności sesji admina (w milisekundach)
    SESSION_DURATION: 30 * 60 * 1000, // 30 minut
    
    // Maksymalna liczba prób logowania
    MAX_LOGIN_ATTEMPTS: 3,
    
    // Czas blokady po przekroczeniu prób (w milisekundach)
    BLOCK_DURATION: 5 * 60 * 1000, // 5 minut
    
    // Role które mają dostęp do panelu admina
    ALLOWED_ROLES: ['admin', 'superadmin'],
    
    // Czy wymagane jest team_id = NULL
    REQUIRE_NO_TEAM: true
};

// Funkcja pomocnicza do sprawdzania sesji
export function isAdminSessionValid() {
    const verified = sessionStorage.getItem('admin_verified');
    const timestamp = sessionStorage.getItem('admin_verified_timestamp');
    
    if (!verified || !timestamp) {
        return false;
    }
    
    const sessionAge = Date.now() - parseInt(timestamp);
    return sessionAge < ADMIN_CONFIG.SESSION_DURATION;
}

// Funkcja do resetowania sesji
export function resetAdminSession() {
    sessionStorage.removeItem('admin_verified');
    sessionStorage.removeItem('admin_verified_timestamp');
}
