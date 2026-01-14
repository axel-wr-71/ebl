// Importujemy klienta supabase, jeśli jest potrzebny w tym module
// import { supabase } from '../auth.js'; 

export async function initMediaSection() {
    const container = document.getElementById('admin-media-manager-container');
    if (!container) return;

    // Renderujemy interfejs sekcji Media
    container.innerHTML = `
        <div class="admin-card">
            <h4>Ustawienia Wizualne (Landing Page)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label>URL Tła Głównego:</label>
                    <input type="text" id="media-bg-url" placeholder="https://..." style="width:100%; padding:8px; margin: 5px 0 15px 0;">
                    
                    <label>URL Logo (EBL):</label>
                    <input type="text" id="media-logo-url" placeholder="https://..." style="width:100%; padding:8px; margin: 5px 0 15px 0;">
                </div>
                <div>
                    <p style="font-size: 0.9rem; color: #666;">
                        Wklej linki do obrazków (np. z Imgur lub własnego serwera). 
                        Zmiany zostaną zastosowane natychmiast po zapisaniu.
                    </p>
                </div>
            </div>
            <button class="btn" onclick="saveMediaGeneral()" style="background:#2e7d32; color:white;">Zapisz Główne Media</button>
        </div>

        <div class="admin-card" style="margin-top:20px;">
            <h4>Galeria Screenów (3 zdjęcia na dole strony)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <input type="text" id="gal-url-1" placeholder="URL Zdjęcia 1" style="padding:8px;">
                <input type="text" id="gal-url-2" placeholder="URL Zdjęcia 2" style="padding:8px;">
                <input type="text" id="gal-url-3" placeholder="URL Zdjęcia 3" style="padding:8px;">
            </div>
            <button class="btn" onclick="saveMediaGallery()" style="background:#2e7d32; color:white; margin-top:15px;">Zapisz Galerię</button>
        </div>
    `;

    // Tutaj dodamy funkcję pobierającą aktualne linki z bazy, aby pola nie były puste
    // loadCurrentMedia();
}

// Funkcje zapisu wystawiamy do obiektu window, aby onclick w HTML je widział
window.saveMediaGeneral = async () => {
    const bg = document.getElementById('media-bg-url').value;
    const logo = document.getElementById('media-logo-url').value;
    
    console.log("Zapisywanie mediów głównych...", { bg, logo });
    // Logika Supabase (update site_settings)
    alert("Zapisano media główne!");
};

window.saveMediaGallery = async () => {
    const g1 = document.getElementById('gal-url-1').value;
    const g2 = document.getElementById('gal-url-2').value;
    const g3 = document.getElementById('gal-url-3').value;

    console.log("Zapisywanie galerii...", [g1, g2, g3]);
    // Logika Supabase
    alert("Zapisano galerię!");
};
