// js/core/economy.js
import { supabaseClient } from '../auth.js';

/**
 * Główny algorytm wyceny zawodnika.
 * Uwzględnia OVR (Umiejętności), POT (Potencjał) oraz Wiek.
 */
export function calculatePlayerDynamicWage(player) {
    const { overall_rating: ovr, potential: pot, age } = player;
    let baseWage = 0;

    // 1. WYCENA UMIEJĘTNOŚCI (OVR)
    // Skala nieliniowa - im wyższy OVR, tym drastyczniej rośnie cena
    if (ovr >= 95) baseWage = 200000 + (ovr - 95) * 10000;
    else if (ovr >= 90) baseWage = 130000 + (ovr - 90) * 14000;
    else if (ovr >= 80) baseWage = 50000 + (ovr - 80) * 8000;
    else if (ovr >= 70) baseWage = 15000 + (ovr - 70) * 3500;
    else baseWage = 3000 + (ovr - 60) * 1200;

    // 2. BONUS ZA POTENCJAŁ (Inwestycja w przyszłość)
    // Gracze z ogromnym potencjałem kosztują więcej nawet przy niskim OVR
    if (age < 26) {
        if (pot >= 95) baseWage += 40000;      // "Next GOAT" Tax
        else if (pot >= 88) baseWage += 15000; // "Future Star" Tax
        
        // Bonus za "Sufit" (różnica między tym co ma, a co może mieć)
        const ceilingGap = pot - ovr;
        if (ceilingGap > 15) baseWage += 5000;
    }

    // 3. MNOŻNIK WIEKU (Krzywa kariery)
    let ageMultiplier = 1.0;
    if (age <= 21) ageMultiplier = 0.45;     // Rookie Scale (Taniej dla klubu)
    else if (age >= 28 && age <= 32) ageMultiplier = 1.25; // Peak Years (Weteran kosztuje)
    else if (age >= 35) ageMultiplier = 0.8;  // Veteran Discount (Spadek formy)

    let finalWage = baseWage * ageMultiplier;

    // 4. LIMITY FINANSOWE (Zgodnie z wytycznymi)
    if (finalWage > 250000) finalWage = 250000; // Max dla GOAT
    if (finalWage < 2000) finalWage = 2000;     // Min pensja ligowa

    return Math.floor(finalWage);
}

/**
 * Proces rozliczania tygodnia (Poniedziałek 08:00)
 */
export async function processWeeklyFinances(teamId) {
    console.log("[ECONOMY] Rozpoczynanie rozliczenia tygodniowego...");

    try {
        // Pobierz dane drużyny i zawodników
        const { data: team } = await supabaseClient.from('teams').select('*').eq('id', teamId).single();
        const { data: players } = await supabaseClient.from('players').select('*').eq('team_id', teamId);

        if (!team || !players) return;

        // 1. Obliczamy pensje (i aktualizujemy je w locie wg algorytmu)
        let totalSalaries = 0;
        for (const player of players) {
            const currentWage = calculatePlayerDynamicWage(player);
            totalSalaries += currentWage;
            
            // Opcjonalnie: Aktualizujemy pensję w bazie, by menedżer widział nową stawkę
            await supabaseClient.from('players').update({ salary: currentWage }).eq('id', player.id);
        }

        // 2. Obliczamy przychody (Skala dopasowana do mniejszych pensji)
        const attendance = Math.floor(team.arena_capacity * 0.8);
        const ticketIncome = attendance * team.ticket_price;
        const merchIncome = attendance * 15; // Sprzedaż koszulek i pamiątek
        const tvRights = 150000; // Stały wpływ z praw TV
        
        const totalIncome = ticketIncome + merchIncome + tvRights;

        // 3. Bilans końcowy
        const weeklyProfit = totalIncome - totalSalaries;
        const newBalance = team.balance + weeklyProfit;

        // 4. Update bazy
        await supabaseClient.from('teams').update({ balance: newBalance }).eq('id', teamId);

        // 5. Rejestracja logów
        await supabaseClient.from('financial_logs').insert([
            { team_id: teamId, category: 'salaries', amount: -totalSalaries, description: 'Tygodniowe płace zespołu' },
            { team_id: teamId, category: 'tickets', amount: totalIncome, description: 'Wpływy z biletów, TV i Merch' }
        ]);

        console.log(`[ECONOMY] Rozliczono: +$${totalIncome} / -$${totalSalaries}. Bilans: $${weeklyProfit}`);
        return { success: true, profit: weeklyProfit };

    } catch (err) {
        console.error("[ECONOMY ERROR]", err);
        return { success: false, error: err.message };
    }
}
