// js/core/league_clock.js
import { supabaseClient } from '../auth.js';
import { runGlobalTrainingSession } from './training_engine.js';

/**
 * Zarządca czasu ligowego. 
 * Sprawdza i wyzwala eventy: Treningi (Pon/Pt), Mecze (Wt/Śr/Czw/Sob) oraz Koniec Sezonu (Nd T15).
 */
export async function checkLeagueEvents() {
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[now.getDay()];

    // Pobieramy aktualny tydzień z bazy danych, aby wiedzieć czy to koniec sezonu
    const { data: clockData } = await supabaseClient
        .from('game_config')
        .select('value')
        .eq('key', 'current_week')
        .single();
    
    const currentWeek = clockData ? parseInt(clockData.value) : 1;

    // 1. OBSŁUGA TRENINGÓW (Tylko Poniedziałek i Piątek)
    if (todayName === 'MONDAY' || todayName === 'FRIDAY') {
        const eventKey = `TRAINING_${todayName}_W${currentWeek}`;
        try {
            const { data, error } = await supabaseClient.rpc('request_league_event', { 
                p_event_type: eventKey 
            });

            if (error) throw error;

            if (data && data.can_proceed) {
                console.log(`[LEAGUE CLOCK] Starting global training for: ${todayName}`);
                await runGlobalTrainingSession(todayName);
            }
        } catch (err) {
            console.warn("[LEAGUE CLOCK] Training event skipped or already processed.");
        }
    }

    // 2. OBSŁUGA MECZÓW I EVENTÓW KALENDARZOWYCH (Wtorek, Środa, Czwartek, Sobota)
    const matchDays = ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'SATURDAY'];
    if (matchDays.includes(todayName)) {
        const eventKey = `MATCHES_${todayName}_W${currentWeek}`;
        try {
            const { data, error } = await supabaseClient.rpc('request_league_event', { 
                p_event_type: eventKey 
            });

            if (error) throw error;

            if (data && data.can_proceed) {
                console.log(`[LEAGUE CLOCK] Processing matches/events for: ${todayName}`);
                // Miejsce na match_engine.js
            }
        } catch (err) {
            console.warn("[LEAGUE CLOCK] Match event skipped or already processed.");
        }
    }

    // 3. NIEDZIELA (TYDZIEŃ 15): STARZENIE I EMERYTURY
    // Zgodnie z dokumentacją: Zamknięcie sezonu następuje w niedzielę 15. tygodnia [cite: 41]
    if (todayName === 'SUNDAY' && currentWeek === 15) {
        const eventKey = `SEASON_END_W15`;
        try {
            const { data, error } = await supabaseClient.rpc('request_league_event', { 
                p_event_type: eventKey 
            });

            if (error) throw error;

            if (data && data.can_proceed) {
                console.log("[LEAGUE CLOCK] Sunday Week 15: Executing Season End Procedure...");
                
                // Wywołanie funkcji SQL, która robi age+1 i usuwa emerytów 
                const { error: processError } = await supabaseClient.rpc('process_season_end');
                
                if (processError) throw processError;
                
                console.log("[LEAGUE CLOCK] Season processing completed successfully.");
            }
        } catch (err) {
            console.warn("[LEAGUE CLOCK] Season end procedure already processed or failed.");
        }
    }
}
