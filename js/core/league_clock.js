// js/core/league_clock.js
import { supabaseClient } from '../auth.js';
import { runGlobalTrainingSession } from './training_engine.js';

/**
 * Checks if league events (Training/Matches) need to be executed
 */
export async function checkLeagueEvents() {
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[now.getDay()];

    // We only process on Monday and Friday
    if (todayName === 'MONDAY' || todayName === 'FRIDAY') {
        const eventKey = `TRAINING_${todayName}`;

        try {
            // Call the SQL RPC function (Plan B)
            const { data, error } = await supabaseClient.rpc('request_league_event', { 
                p_event_type: eventKey 
            });

            if (error) throw error;

            // If the database says we are the first ones today
            if (data && data.can_proceed) {
                console.log(`[LEAGUE CLOCK] Starting global training for: ${todayName}`);
                await runGlobalTrainingSession(todayName);
            }
        } catch (err) {
            console.warn("[LEAGUE CLOCK] Event check skipped or already processed.");
        }
    }
}
