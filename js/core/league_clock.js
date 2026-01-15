// js/core/league_clock.js

export async function processLeagueFlow() {
    const now = new Date();
    const currentDay = now.toLocaleDateString('pl-PL', { weekday: 'long' }); // np. "poniedziałek"
    const currentTime = now.getHours() + ":" + now.getMinutes();

    // Pobieramy status obecnego sezonu z bazy
    const { data: season } = await supabaseClient.from('seasons').select('*').single();

    // 1. Logika Treningów (Poniedziałek, Piątek)
    if (currentDay === 'poniedziałek' || currentDay === 'piątek') {
        await runAutomaticTraining(season.id);
    }

    // 2. Logika Meczów (Wtorek, Czwartek, Sobota, Środa)
    if (['wtorek', 'czwartek', 'sobota', 'środa'].includes(currentDay)) {
        await runAutomaticMatches(season.id);
    }

    // 3. Logika Końca Sezonu (Niedziela, Tydzień 15)
    if (currentDay === 'niedziela' && season.current_week === 15) {
        await runSeasonTransition();
    }
}
