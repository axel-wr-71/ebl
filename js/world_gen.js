// Kontener: Generator Świata i Populacji Zawodników
async function initWorld() {
    // Sprawdzenie języka dla komunikatu potwierdzenia
    const confirmMsg = currentLang === 'pl' 
        ? "Czy na pewno chcesz wygenerować ligę i 60 nowych zawodników? Obecne dane zostaną nadpisane." 
        : "Are you sure you want to generate the league and 60 new players? Existing data will be overwritten.";
    
    if(!confirm(confirmMsg)) return;

    console.log("Inicjalizacja generowania świata...");

    const startingTeams = [
        { name: "Warsaw Eagles", city: "Warszawa" },
        { name: "Cracow Bulls", city: "Kraków" },
        { name: "Wrocław Sharks", city: "Wrocław" },
        { name: "Poznań Stars", city: "Poznań" },
        { name: "Gdańsk Sailors", city: "Gdańsk" }
    ];

    try {
        for (const t of startingTeams) {
            // 1. Dodanie drużyny
            const { data: teamData, error: tError } = await _supabase.from('teams').insert([{
                team_name: t.name,
                country: "Poland",
                balance: 1000000
            }]).select();

            if (tError) throw tError;

            const teamId = teamData[0].id;

            // 2. Generowanie 12 zawodników dla każdej drużyny
            const playersToInsert = [];
            for (let i = 0; i < 12; i++) {
                playersToInsert.push(generatePlayer(teamId));
            }

            const { error: pError } = await _supabase.from('players').insert(playersToInsert);
            if (pError) throw pError;
        }

        alert(currentLang === 'pl' ? "Świat wygenerowany pomyślnie!" : "World generated successfully!");
        location.reload();

    } catch (err) {
        console.error("Błąd krytyczny:", err);
        alert("Błąd: " + err.message);
    }
}

function generatePlayer(teamId) {
    const names = ["Adam", "Piotr", "Marek", "Jan", "Kamil", "Łukasz", "Michał", "Robert", "Tomek", "Krzysztof"];
    const surnames = ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński"];
    
    const fullName = names[Math.floor(Math.random()*names.length)] + " " + surnames[Math.floor(Math.random()*surnames.length)];
    
    // Seed dla awatara (unikalna twarz)
    const avatarSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return {
        team_id: teamId,
        name: fullName,
        age: 18 + Math.floor(Math.random() * 15),
        height: 180 + Math.floor(Math.random() * 40),
        avatar_url: avatarUrl,
        // Skille w skali 1-20
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
