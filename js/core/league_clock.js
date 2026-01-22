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

/**
 * Obiekt LeagueClock z funkcjami pomocniczymi dla widoku terminarza
 */
export const LeagueClock = {
    /**
     * Pobierz aktywności dla danego tygodnia (zgodnie z harmonogramem z dokumentacji)
     */
    getWeekActivities(weekNumber) {
        // Mapowanie zgodne z dokumentacją (strony 3-4)
        const weekSchedule = {
            0: [ // Tydzień 0 - Sparingi
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Friendly', color: '#28a745' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'Friendly', color: '#28a745' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'Friendly', color: '#28a745' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            1: [ // Tydzień 1-2 - Liga
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            2: [ // Tydzień 2
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            3: [ // Tydzień 3-5 - Liga + Puchar R1-3
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup R1', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            4: [ // Tydzień 4
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup R2', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            5: [ // Tydzień 5
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup R3', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            6: [ // Tydzień 6 - ALL-STAR
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'ALL-STAR', color: '#ffc107' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            7: [ // Tydzień 7 - Puchar 1/2
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup SF', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            8: [ // Tydzień 8-9 - Puchar Finał
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup Final', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            9: [ // Tydzień 9
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Cup Final', color: '#007bff' },
                { day: 'THU', activity: 'League', color: '#fd7e14' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            10: [ // Tydzień 10 - Koniec sezonu zasadniczego
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'League', color: '#fd7e14' },
                { day: 'WED', activity: 'Lottery', color: '#e83e8c' },
                { day: 'THU', activity: 'Training', color: '#6c757d' },
                { day: 'FRI', activity: 'League', color: '#fd7e14' },
                { day: 'SAT', activity: 'League', color: '#fd7e14' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            11: [ // Tydzień 11-13 - Playoff
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Playoff', color: '#dc3545' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'Playoff', color: '#dc3545' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'Playoff', color: '#dc3545' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            12: [ // Tydzień 12
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Playoff', color: '#dc3545' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'Playoff', color: '#dc3545' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'Playoff', color: '#dc3545' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            13: [ // Tydzień 13
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Playoff', color: '#dc3545' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: 'Playoff', color: '#dc3545' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: 'Playoff', color: '#dc3545' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            14: [ // Tydzień 14 - Finały Playoff
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Playoff Final', color: '#dc3545' },
                { day: 'WED', activity: 'Playoff Final', color: '#dc3545' },
                { day: 'THU', activity: 'Training', color: '#6c757d' },
                { day: 'FRI', activity: 'Playoff Final', color: '#dc3545' },
                { day: 'SAT', activity: 'Playoff Final', color: '#dc3545' },
                { day: 'SUN', activity: 'Finances', color: '#20c997' }
            ],
            15: [ // Tydzień 15 - Draft i Reset
                { day: 'MON', activity: 'Training', color: '#6c757d' },
                { day: 'TUE', activity: 'Draft', color: '#6f42c1' },
                { day: 'WED', activity: '-', color: '#adb5bd' },
                { day: 'THU', activity: '-', color: '#adb5bd' },
                { day: 'FRI', activity: 'Training', color: '#6c757d' },
                { day: 'SAT', activity: '-', color: '#adb5bd' },
                { day: 'SUN', activity: 'Reset', color: '#343a40' }
            ]
        };

        // Domyślny harmonogram dla tygodni 1-10 (Regular Season)
        const defaultSchedule = [
            { day: 'MON', activity: 'Training', color: '#6c757d' },
            { day: 'TUE', activity: 'League', color: '#fd7e14' },
            { day: 'WED', activity: '-', color: '#adb5bd' },
            { day: 'THU', activity: 'League', color: '#fd7e14' },
            { day: 'FRI', activity: 'Training', color: '#6c757d' },
            { day: 'SAT', activity: 'League', color: '#fd7e14' },
            { day: 'SUN', activity: 'Finances', color: '#20c997' }
        ];

        return weekSchedule[weekNumber] || defaultSchedule;
    },
    
    /**
     * Opis tygodnia do wyświetlenia w panelu
     */
    getWeekDescription(weekNumber) {
        const descriptions = {
            0: "Pre-season: Friendlies and team preparation",
            1: "Regular Season: League matches begin",
            2: "Regular Season: Conference games continue",
            3: "Regular Season + Cup Round 1: First cup matches",
            4: "Regular Season + Cup Round 2: Cup competition heats up",
            5: "Regular Season + Cup Round 3: Quarter-finals",
            6: "Regular Season + All-Star: Mid-season showcase",
            7: "Regular Season + Cup Semi-finals: Final four teams",
            8: "Regular Season + Cup Final: Trophy decider",
            9: "Regular Season: Final league games",
            10: "Season End: Regular season concludes, Draft Lottery",
            11: "Playoff Round 1: Best of 3 series begin",
            12: "Playoff Round 2: Conference semi-finals",
            13: "Playoff Round 3: Conference finals",
            14: "Playoff Finals: League Championship series",
            15: "Season Finale: Draft and offseason reset"
        };
        
        return descriptions[weekNumber] || "Regular season in progress";
    },

    /**
     * Pobierz pełną angielską nazwę dnia tygodnia
     */
    getFullDayName(dayAbbr) {
        const daysMap = {
            'MON': 'Monday',
            'TUE': 'Tuesday', 
            'WED': 'Wednesday',
            'THU': 'Thursday',
            'FRI': 'Friday',
            'SAT': 'Saturday',
            'SUN': 'Sunday'
        };
        return daysMap[dayAbbr?.toUpperCase()] || dayAbbr;
    },

    /**
     * Pobierz pełną nazwę typu meczu
     */
    getMatchTypeFull(type) {
        const typesMap = {
            'LIG': 'League',
            'PUCH': 'Cup',
            'SPR': 'Friendly',
            'PLAYOFF': 'Playoff',
            'ALL-STAR': 'All-Star',
            'DRAFT': 'Draft',
            'LOTTERY': 'Draft Lottery'
        };
        return typesMap[type] || type;
    },

    /**
     * Pobierz aktualny tydzień z bazy danych
     */
    async getCurrentWeek() {
        try {
            const { data, error } = await supabaseClient
                .from('game_config')
                .select('value')
                .eq('key', 'current_week')
                .single();
            
            if (error) throw error;
            
            return data ? parseInt(data.value) : 1;
        } catch (err) {
            console.error("[LeagueClock] Error getting current week:", err);
            return 1;
        }
    },

    /**
     * Pobierz całkowitą liczbę tygodni w sezonie (z dokumentacji: 16)
     */
    getTotalWeeks() {
        return 16; // Zgodnie z dokumentacją
    },

    /**
     * Sprawdź czy dany dzień ma aktywność treningu
     */
    isTrainingDay(dayName) {
        const trainingDays = ['MONDAY', 'FRIDAY'];
        return trainingDays.includes(dayName.toUpperCase());
    },

    /**
     * Sprawdź czy dany dzień ma aktywność meczu
     */
    isMatchDay(dayName) {
        const matchDays = ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'SATURDAY'];
        return matchDays.includes(dayName.toUpperCase());
    },

    /**
     * Pobierz kolor dla danego typu aktywności
     */
    getActivityColor(activity) {
        const colors = {
            'Training': '#6c757d',
            'League': '#fd7e14',
            'Cup': '#007bff',
            'Friendly': '#28a745',
            'Finances': '#20c997',
            'ALL-STAR': '#ffc107',
            'Draft': '#6f42c1',
            'Lottery': '#e83e8c',
            'Playoff': '#dc3545',
            'Reset': '#343a40',
            '-': '#adb5bd'
        };
        
        return colors[activity] || '#6c757d';
    }
};
