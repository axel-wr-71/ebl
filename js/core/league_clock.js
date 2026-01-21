// js/core/league_clock.js
import { supabaseClient } from '../auth.js';
import { runGlobalTrainingSession } from './training_engine.js';

/**
 * Zarządca czasu ligowego. 
 * Sprawdza i wyzwala eventy: Treningi (Pon/Pt) oraz Mecze (Wt/Śr/Czw/Sob).
 */
export async function checkLeagueEvents() {
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[now.getDay()];

    // 1. OBSŁUGA TRENINGÓW (Tylko Poniedziałek i Piątek)
    if (todayName === 'MONDAY' || todayName === 'FRIDAY') {
        const eventKey = `TRAINING_${todayName}`;
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
        const eventKey = `MATCHES_${todayName}`;
        try {
            const { data, error } = await supabaseClient.rpc('request_league_event', { 
                p_event_type: eventKey 
            });

            if (error) throw error;

            if (data && data.can_proceed) {
                console.log(`[LEAGUE CLOCK] Processing matches/events for: ${todayName}`);
                // Tutaj znajdzie się wywołanie match_engine.js w przyszłości
            }
        } catch (err) {
            console.warn("[LEAGUE CLOCK] Match event skipped or already processed.");
        }
    }
}
