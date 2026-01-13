// Plik: js/world_gen.js

/**
 * SEKCJA: GENEROWANIE ŚWIATA (DRAFT)
 */
async function initWorld() {
    // Ta funkcja służy do generowania puli zawodników (Draft Pool)
    await generateDraftPool();
}

async function generateDraftPool() {
    const confirmed = confirm(currentLang === 'pl' 
        ? "Generować nową pulę draftu (60 zawodników)?" 
        : "Generate new draft pool (60 players)?");
    
    if(!confirmed) return;

    console.log("Generowanie zawodników do draftu...");

    const playersToInsert = [];
    for (let i = 0; i < 60; i++) {
        playersToInsert.push(generatePlayer(null)); // null = zawodnik wolny/do wzięcia
    }

    const { error } = await _supabase.from('players').insert(playersToInsert);
    
    if (error) {
        console.error("Błąd zapisu w Supabase:", error);
        alert(currentLang === 'pl' ? "Błąd: " + error.message : "Error: " + error.message);
    } else {
        alert(currentLang === 'pl' ? "Pula draftu gotowa!" : "Draft pool ready!");
    }
}

function generatePlayer(teamId) {
    const names = ["Adam", "Piotr", "Marek", "Jan", "Kamil", "Łukasz", "Michał", "Robert", "Tomek", "Krzysztof"];
    const surnames = ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński"];
    
    const fullName = names[Math.floor(Math.random()*names.length)] + " " + surnames[Math.floor(Math.random()*surnames.length)];
    
    const avatarSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return {
        team_id: teamId, 
        name: fullName,
        country: "Poland", 
        age: 18 + Math.floor(Math.random() * 4), 
        height: 180 + Math.floor(Math.random() * 40),
        avatar_url: avatarUrl,
        jump_shot: 3 + Math.floor(Math.random() * 7),
        jump_range: 3 + Math.floor(Math.random() * 7),
        outside_defense: 3 + Math.floor(Math.random() * 7),
        handling: 3 + Math.floor(Math.random() * 7),
        driving: 3 + Math.floor(Math.random() * 7),
        passing: 3 + Math.floor(Math.random() * 7),
        inside_shot: 3 + Math.floor(Math.random() * 7),
        inside_defense: 3 + Math.floor(Math.random() * 7),
        rebounding: 3 + Math.floor(Math.random() * 7),
        shot_blocking: 3 + Math.floor(Math.random() * 7),
        stamina: 5,
        free_throw: 5
    };
}

/**
 * SEKCJA: PANEL ADMINISTRATORA - ZMIANA ZDJĘĆ HERO
 */

function updateHeroImages() {
    const img1 = document.getElementById('hero-img-1-url').value;
    const img2 = document.getElementById('hero-img-2-url').value;

    // Pobieramy elementy obrazków z sekcji landing-page
    const heroElements = document.querySelectorAll('.hero-img');

    if (img1 && heroElements[0]) {
        heroElements[0].src = img1;
        localStorage.setItem('ebl_hero_1', img1);
    }
    if (img2 && heroElements[1]) {
        heroElements[1].src = img2;
        localStorage.setItem('ebl_hero_2', img2);
    }

    if (img1 || img2) {
        alert(currentLang === 'pl' ? "Zdjęcia zaktualizowane!" : "Images updated!");
    } else {
        alert(currentLang === 'pl' ? "Wklej link do zdjęcia!" : "Paste an image URL!");
    }
}

// Wczytywanie zapisanych zdjęć przy ładowaniu strony
function loadHeroImages() {
    const saved1 = localStorage.getItem('ebl_hero_1');
    const saved2 = localStorage.getItem('ebl_hero_2');
    const heroElements = document.querySelectorAll('.hero-img');
    
    if (saved1 && heroElements[0]) heroElements[0].src = saved1;
    if (saved2 && heroElements[1]) heroElements[1].src = saved2;
}

// Automatyczne wczytanie przy starcie
document.addEventListener('DOMContentLoaded', loadHeroImages);
