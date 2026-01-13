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
        alert(currentLang === 'pl' ? "Pula draftu gotowa! Wygenerowano 60 zawodników." : "Draft pool ready! 60 players generated.");
    }
}

/**
 * Funkcja pomocnicza: Obliczanie pozycji na podstawie umiejętności
 */
function calculatePosition(s) {
    // Logika: PG (Handling/Passing), SG (JS/Range), C (Inside Def/Reb), PF (Inside Shot/Reb), SF (All-around)
    if (s.handling >= s.inside_defense + 3 && s.passing >= s.rebounding) return 'PG';
    if (s.jump_shot >= s.inside_shot + 2 && s.jump_range >= 6) return 'SG';
    if (s.rebounding >= s.jump_shot + 3 && s.inside_defense >= s.outside_defense) return 'C';
    if (s.inside_shot >= s.jump_range + 3 && s.rebounding >= 7) return 'PF';
    return 'SF';
}

/**
 * Funkcja pomocnicza: Losowanie potencjału (System wagowy 1-10)
 */
function drawPotential() {
    const rand = Math.random() * 100;
    if (rand > 98) return 10; // Legenda (2%)
    if (rand > 93) return 9;  // MVP
    if (rand > 85) return 8;  
    if (rand > 75) return 7;
    if (rand > 60) return 6;
    if (rand > 45) return 5;  // Średniak
    if (rand > 30) return 4;
    if (rand > 15) return 3;
    if (rand > 5)  return 2;
    return 1;                 // Dziura bez dna
}

function generatePlayer(teamId) {
    const names = ["Adam", "Piotr", "Marek", "Jan", "Kamil", "Łukasz", "Michał", "Robert", "Tomek", "Krzysztof", "Bartek", "Paweł", "Sebastian"];
    const surnames = ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak"];
    
    const fullName = names[Math.floor(Math.random()*names.length)] + " " + surnames[Math.floor(Math.random()*surnames.length)];
    
    const avatarSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    // 1. Generujemy bazowe skille
    const skills = {
        jump_shot: 3 + Math.floor(Math.random() * 8),
        jump_range: 2 + Math.floor(Math.random() * 7),
        outside_defense: 3 + Math.floor(Math.random() * 7),
        handling: 3 + Math.floor(Math.random() * 8),
        driving: 3 + Math.floor(Math.random() * 7),
        passing: 3 + Math.floor(Math.random() * 7),
        inside_shot: 3 + Math.floor(Math.random() * 8),
        inside_defense: 3 + Math.floor(Math.random() * 8),
        rebounding: 3 + Math.floor(Math.random() * 8),
        shot_blocking: 2 + Math.floor(Math.random() * 7)
    };

    // 2. Przypisujemy pozycję na podstawie skilli
    const position = calculatePosition(skills);

    // 3. Losujemy potencjał
    const potential = drawPotential();

    return {
        team_id: teamId, 
        name: fullName,
        country: "Poland", 
        age: 18 + Math.floor(Math.random() * 2), // 3a. Max 19 lat (18 lub 19)
        height: 185 + Math.floor(Math.random() * 35),
        avatar_url: avatarUrl,
        position: position,      // 4. Pozycja
        potential_id: potential, // 1. Potencjał
        draft_info: null,        // 5. Puste miejsce na dane draftu
        ...skills,
        stamina: 5,
        free_throw: 5
    };
}

/**
 * SEKCJA: PANEL ADMINISTRATORA - ZMIANA ZDJĘĆ HERO I LOGO
 */
function adminUpdateMedia() {
    const img1 = document.getElementById('hero-img-1-url').value;
    const img2 = document.getElementById('hero-img-2-url').value;
    const newLogo = document.getElementById('logo-url-input').value;

    const heroElements = document.querySelectorAll('.hero-img');
    const logoElement = document.getElementById('main-logo-img');

    let updated = false;

    if (img1 && heroElements[0]) {
        heroElements[0].src = img1;
        localStorage.setItem('ebl_hero_1', img1);
        updated = true;
    }
    if (img2 && heroElements[1]) {
        heroElements[1].src = img2;
        localStorage.setItem('ebl_hero_2', img2);
        updated = true;
    }
    if (newLogo && logoElement) {
        logoElement.src = newLogo;
        localStorage.setItem('ebl_logo', newLogo);
        updated = true;
    }

    if (updated) {
        alert(currentLang === 'pl' ? "Media zostały zaktualizowane!" : "Media updated!");
        document.getElementById('hero-img-1-url').value = '';
        document.getElementById('hero-img-2-url').value = '';
        document.getElementById('logo-url-input').value = '';
    } else {
        alert(currentLang === 'pl' ? "Wklej przynajmniej jeden link!" : "Paste at least one URL!");
    }
}

function loadSavedMedia() {
    const saved1 = localStorage.getItem('ebl_hero_1');
    const saved2 = localStorage.getItem('ebl_hero_2');
    const savedLogo = localStorage.getItem('ebl_logo');
    
    const heroElements = document.querySelectorAll('.hero-img');
    const logoElement = document.getElementById('main-logo-img');
    
    if (saved1 && heroElements[0]) heroElements[0].src = saved1;
    if (saved2 && heroElements[1]) heroElements[1].src = saved2;
    if (savedLogo && logoElement) logoElement.src = savedLogo;
}

document.addEventListener('DOMContentLoaded', loadSavedMedia);
