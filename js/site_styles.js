// js/site_styles.js
import { supabase } from './auth.js';

export async function applySiteSettings() {
    try {
        const { data: settings, error } = await supabase.from('site_settings').select('*');
        if (error) throw error;

        const s = {};
        settings.forEach(item => s[item.key] = item.value);

        // 1. Zmiana tła Landing Page
        if (s.landing_bg) {
            const hero = document.querySelector('.landing-hero');
            if (hero) hero.style.backgroundImage = `url('${s.landing_bg}')`;
        }

        // 2. Zmiana Logo na Landing Page
        const landingLogo = document.getElementById('landing-logo-media');
        if (landingLogo && s.game_logo) landingLogo.src = s.game_logo;

        // 3. Zmiana Logo wewnątrz aplikacji (po zalogowaniu)
        const mainLogo = document.getElementById('main-logo-img');
        if (mainLogo && s.game_logo) mainLogo.src = s.game_logo;

        // 4. Aktualizacja galerii screenów
        const galleryImgs = document.querySelectorAll('.hero-gallery img');
        if (s.gal_1 && galleryImgs[0]) galleryImgs[0].src = s.gal_1;
        if (s.gal_2 && galleryImgs[1]) galleryImgs[1].src = s.gal_2;
        if (s.gal_3 && galleryImgs[2]) galleryImgs[2].src = s.gal_3;

    } catch (err) {
        console.error("Błąd podczas ładowania stylów strony:", err);
    }
}
