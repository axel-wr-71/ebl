
// js/core/calendar_engine.js
import { pairTeamsForSeason } from './season_engine.js';

/**
 * Przypisuje mecze do konkretnych slotów czasowych w 16-tygodniowym cyklu.
 */
export function generateFullSeasonCalendar(teams) {
    const leagueMatches = pairTeamsForSeason(teams);
    const schedule = [];
    let matchIndex = 0;

    // Definicja dni meczowych dla sezonu zasadniczego (Tygodnie 1-10)
    // Tydzień 6 i 10 mają mniej meczów ligowych wg specyfikacji
    for (let week = 1; week <= 10; week++) {
        const daysInWeek = (week === 6 || week === 10) ? ['TUESDAY', 'THURSDAY'] : ['TUESDAY', 'THURSDAY', 'SATURDAY'];
        
        daysInWeek.forEach(day => {
            // W każdym dniu meczowym grają wszystkie pary (np. 10 par dla 20 zespołów)
            const matchesPerSlot = teams.length / 2;
            for (let i = 0; i < matchesPerSlot; i++) {
                if (leagueMatches[matchIndex]) {
                    schedule.push({
                        ...leagueMatches[matchIndex],
                        week: week,
                        day: day
                    });
                    matchIndex++;
                }
            }
        });
    }

    // Dodanie slotów na Puchar (Środy)
    const cupWeeks = [3, 4, 5, 7, 9];
    cupWeeks.forEach(week => {
        schedule.push({ type: 'CUP', week: week, day: 'WEDNESDAY' });
    });

    // Dodanie slotów na Playoffy (Tygodnie 11-14)
    for (let week = 11; week <= 14; week++) {
        ['TUESDAY', 'THURSDAY', 'SATURDAY'].forEach(day => {
            schedule.push({ type: 'PLAYOFF', week: week, day: day });
        });
    }

    return schedule;
}
