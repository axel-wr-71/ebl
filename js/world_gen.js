// Plik: js/world_gen.js

async function initWorld() {
    // Ta funkcja teraz służy tylko do generowania puli zawodników (Draft Pool)
    await generateDraftPool();
}

async function generateDraftPool() {
    const confirmed = confirm(currentLang === 'pl' ? "Generować nową pulę draftu (60 zawodników)?" : "Generate new draft pool (60 players)?");
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
    
    // Unikalny Seed dla twarzy (DiceBear)
    const avatarSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return {
        team_id: teamId, // Będzie NULL dla draftu
        name: fullName,
        country: "Poland", // Domyślnie, można to też losować
        age: 18 + Math.floor(Math.random() * 4), // Draftowicze zazwyczaj 18-21 lat
        height: 180 + Math.floor(Math.random() * 40),
        avatar_url: avatarUrl,
        // Atrybuty (Skala 1-20 jak w BuzzerBeater)
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
