// js/draft.js

/**
 * 3c. Główna funkcja Loterii Draftu
 */
async function runLeagueLottery(leagueId) {
    // 1. Pobierz zespoły z danej ligi
    const { data: teams, error } = await _supabase
        .from('teams')
        .select('*')
        .eq('league_name', leagueId);

    if (error) return console.error("Błąd pobierania drużyn:", error);

    // 2. Sortuj od najgorszego bilansu (najmniej wygranych)
    const sortedTeams = teams.sort((a, b) => (a.wins - a.losses) - (b.wins - b.losses));

    // 3. Przypisz szanse (losy) - Top 14 najgorszych drużyn bierze udział w loterii
    // Wagi wzorowane na NBA (zsumowane do 1000 losów)
    const weights = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];
    let lotteryPool = [];

    sortedTeams.forEach((team, index) => {
        let tickets = weights[index] || 1; // Drużyny spoza Top 14 dostają 1 los symbolicznie
        for (let i = 0; i < tickets; i++) {
            lotteryPool.push({ id: team.id, name: team.team_name });
        }
    });

    // 4. Losujemy TOP 4 (kolejność picków 1-4)
    let finalOrder = [];
    for (let i = 0; i < 4; i++) {
        if (lotteryPool.length === 0) break;
        const winnerIndex = Math.floor(Math.random() * lotteryPool.length);
        const winner = lotteryPool[winnerIndex];
        finalOrder.push(winner);
        // Usuwamy wszystkie losy wygranego zespołu z puli
        lotteryPool = lotteryPool.filter(t => t.id !== winner.id);
    }

    // 5. Reszta (miejsca 5-20) idzie tradycyjnie wg bilansu (ci co nie wygrali w Top 4)
    sortedTeams.forEach(team => {
        if (!finalOrder.find(t => t.id === team.id)) {
            finalOrder.push({ id: team.id, name: team.team_name });
        }
    });

    return finalOrder; // Zwraca tablicę z kolejnością picków 1-20
}
