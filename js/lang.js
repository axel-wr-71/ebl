const translations = {
    pl: {
        welcome_title: "ELITE BUZZER LEAGUE",
        login_header: "Panel Managera",
        btn_login: "ZALOGUJ SIĘ",
        btn_signup: "ZAŁÓŻ KONTO",
        admin_panel: "Panel Administratora",
        gen_world: "GENERUJ ŚWIAT I LIGI",
        logout: "Wyloguj",
        rookie_edit: "Edycja Wyglądu Rookie"
    },
    en: {
        welcome_title: "ELITE BUZZER LEAGUE",
        login_header: "Manager Panel",
        btn_login: "LOG IN",
        btn_signup: "SIGN UP",
        admin_panel: "Admin Dashboard",
        gen_world: "GENERATE WORLD & LEAGUES",
        logout: "Logout",
        rookie_edit: "Edit Rookie Appearance"
    }
};

let currentLang = localStorage.getItem('ebl_lang') || 'pl';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ebl_lang', lang);
    applyTranslations();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', applyTranslations);
