// js/app/schedule_view.js
import { supabaseClient } from '../auth.js';

export const ScheduleView = {
    /**
     * Pomocnicza funkcja tłumacząca dni z bazy (uppercase) na format czytelny
     */
    translateDay(dayStr) {
        const daysMap = {
            'MONDAY': 'Poniedziałek',
            'TUESDAY': 'Wtorek',
            'WEDNESDAY': 'Środa',
            'THURSDAY': 'Czwartek',
            'FRIDAY': 'Piątek',
            'SATURDAY': 'Sobota',
            'SUNDAY': 'Niedziela'
        };
        return daysMap[dayStr] || dayStr;
    },

    /**
     * Główny render widoku terminarza
     */
    async render(containerId, teamId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[ScheduleView] Nie znaleziono kontenera: ${containerId}`);
            return;
        }

        // Czyścimy kontener i pokazujemy loader
        container.innerHTML = `<div class="loading-state" style="padding: 20px; color: #888; text-align: center;">Inicjalizacja kalendarza ligowego...</div>`;

        // Pobieramy aktualny tydzień z globalnego stanu gry lub bazy
        let currentWeek = window.gameState?.currentWeek;
        
        if (currentWeek === undefined) {
            const { data: config } = await supabaseClient
                .from('game_config')
                .select('value')
                .eq('key', 'current_week')
                .single();
            currentWeek = config ? parseInt(config.value) : 0;
        }

        try {
            const schedule = await this.fetchTeamSchedule(teamId);
            
            if (!schedule || schedule.length === 0) {
                container.innerHTML = `
                    <div class="schedule-wrapper" style="padding: 20px;">
                        <div class="schedule-card" style="background: #111; border: 1px solid #222; padding: 40px; border-radius: 12px; text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                            <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">Brak meczów w bazie danych.</div>
                            <div style="color: #666; font-size: 0.85rem;">Upewnij się, że terminarz na Sezon 1 został wygenerowany w bazie.</div>
                        </div>
                    </div>`;
                return;
            }

            // Główna struktura po pobraniu danych
            container.innerHTML = `
                <div class="schedule-wrapper" style="padding: 20px; color: #fff; font-family: 'Inter', sans-serif; max-width: 1200px; margin: 0 auto;">
                    <header id="week-strip" class="schedule-card" style="background: #111; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #222;"></header>
                    <div class="schedule-grid" style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
                        <aside id="next-match-focus" class="schedule-card" style="background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;"></aside>
                        <main id="full-season-list" class="schedule-card" style="background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;"></main>
                    </div>
                </div>
            `;

            this.renderWeekStrip(currentWeek);
            this.renderNextMatch(schedule, currentWeek);
            this.renderFullList(schedule);

        } catch (err) {
            console.error("[ScheduleView] Błąd renderowania:", err);
            container.innerHTML = `<div class="error-state" style="padding: 20px; color: #ff4500; text-align: center;">Błąd krytyczny: ${err.message}</div>`;
        }
    },

    renderWeekStrip(week) {
        const container = document.getElementById('week-strip');
        if (!container) return;

        const days = [
            { name: 'PON', activity: 'Trening', type: 'training' },
            { name: 'WT', activity: 'Liga', type: 'match' },
            { name: 'ŚR', activity: 'Puchar', type: 'cup' },
            { name: 'CZW', activity: 'Liga', type: 'match' },
            { name: 'PT', activity: 'Trening', type: 'training' },
            { name: 'SOB', activity: 'Liga', type: 'match' },
            { name: 'ND', activity: 'Finanse', type: 'admin' }
        ];

        container.innerHTML = `
            <div class="strip-header" style="font-size: 0.7rem; color: #666; letter-spacing: 1px; margin-bottom: 12px; font-weight: bold; text-transform: uppercase;">System Rozgrywek • Tydzień ${week} / 15</div>
            <div class="strip-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                ${days.map(d => `
                    <div class="strip-slot" style="background: #1a1a1a; padding: 10px; border-radius: 8px; text-align: center; border-bottom: 3px solid ${d.type === 'match' ? '#ff4500' : '#333'}">
                        <span class="day" style="display: block; font-weight: bold; font-size: 0.8rem; color: #fff;">${d.name}</span>
                        <span class="act" style="font-size: 0.6rem; color: #888; text-transform: uppercase;">${d.activity}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderNextMatch(schedule, week) {
        const container = document.getElementById('next-match-focus');
        if (!container) return;

        // Szukamy najbliższego meczu (week >= currentWeek i status SCHEDULED)
        const next = schedule.find(m => m.week >= week && m.status === 'SCHEDULED');

        if (!next) {
            container.innerHTML = `<div class="no-games" style="color: #666; text-align: center; padding: 20px;">Sezon zakończony lub brak zaplanowanych meczów.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="card-label" style="color: #ff4500; font-weight: bold; font-size: 0.7rem; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;">Następne Spotkanie</div>
            <div class="focus-card" style="text-align: center;">
                <div class="focus-vs" style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 25px;">
                    <div class="team">
                        <div style="width: 60px; height: 60px; background: #222; border: 1px solid #333; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #555; font-weight: bold; text-transform: uppercase;">${(next.home_team?.team_name || 'DOM').substring(0,3)}</div>
                        <span style="font-size: 0.9rem; font-weight: bold; display: block; height: 2.4em; overflow: hidden;">${next.home_team?.team_name || 'Gospodarz'}</span>
                    </div>
                    <div class="vs-badge" style="font-style: italic; font-weight: 900; color: #ff4500; font-size: 1.2rem;">VS</div>
                    <div class="team">
                        <div style="width: 60px; height: 60px; background: #222; border: 1px solid #333; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #555; font-weight: bold; text-transform: uppercase;">${(next.away_team?.team_name || 'AWY').substring(0,3)}</div>
                        <span style="font-size: 0.9rem; font-weight: bold; display: block; height: 2.4em; overflow: hidden;">${next.away_team?.team_name || 'Gość'}</span>
                    </div>
                </div>
                <div class="focus-details" style="background: #000; padding: 15px; border-radius: 8px; border: 1px solid #1a1a1a;">
                    <p style="margin: 0; font-size: 0.85rem; color: #ccc;">Tydzień ${next.week} • ${this.translateDay(next.day_of_week)}</p>
                    <span style="display: inline-block; background: #ff4500; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 0.65rem; margin-top: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${next.match_type}</span>
                </div>
            </div>
        `;
    },

    renderFullList(schedule) {
        const container = document.getElementById('full-season-list');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card-label" style="color: #666; font-weight: bold; font-size: 0.7rem; margin-bottom: 15px; letter-spacing: 1px; text-transform: uppercase;">Pełny Terminarz Sezonu</div>
            <div class="schedule-table-wrapper" style="max-height: 550px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #333 #111; padding-right: 5px;">
                <table class="schedule-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid #222; text-align: left; color: #444; font-size: 0.7rem; text-transform: uppercase; position: sticky; top: 0; background: #111; z-index: 10;">
                            <th style="padding: 12px 10px;">WK</th>
                            <th style="padding: 12px 10px;">DZIEŃ</th>
                            <th style="padding: 12px 10px;">MECZ</th>
                            <th style="padding: 12px 10px; text-align: center;">WYNIK</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map(m => `
                            <tr style="border-bottom: 1px solid #1a1a1a; transition: background 0.2s; ${m.status === 'PLAYED' ? 'opacity: 0.5;' : ''}" 
                                onmouseover="this.style.background='#161616'" 
                                onmouseout="this.style.background='transparent'">
                                <td style="padding: 12px 10px; color: #666;">${m.week}</td>
                                <td style="padding: 12px 10px; color: #888; font-size: 0.75rem;">${this.translateDay(m.day_of_week).substring(0,3).toUpperCase()}</td>
                                <td style="padding: 12px 10px; font-weight: 500;">
                                    <span style="${m.home_team_id === window.gameState?.teamId ? 'color: #ff4500;' : ''}">${m.home_team?.team_name || 'Błąd danych'}</span> 
                                    <span style="color: #444; margin: 0 5px;">vs</span> 
                                    <span style="${m.away_team_id === window.gameState?.teamId ? 'color: #ff4500;' : ''}">${m.away_team?.team_name || 'Błąd danych'}</span>
                                </td>
                                <td style="padding: 12px 10px; font-weight: bold; color: ${m.score_home !== null ? '#fff' : '#444'}; text-align: center; font-family: 'Courier New', monospace;">
                                    ${m.score_home !== null ? `${m.score_home}:${m.score_away}` : '— : —'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async fetchTeamSchedule(teamId) {
        console.log("[ScheduleView] Pobieram mecze dla teamId:", teamId);
        
        // Zoptymalizowane zapytanie z użyciem poprawnej kolumny team_name
        const { data, error } = await supabaseClient
            .from('matches')
            .select(`
                id,
                week,
                day_of_week,
                match_type,
                status,
                score_home,
                score_away,
                home_team_id,
                away_team_id,
                home_team:teams!home_team_id ( team_name ),
                away_team:teams!away_team_id ( team_name )
            `)
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('week', { ascending: true })
            .order('day_of_week', { ascending: true }); // Uwaga: Sortowanie po stringu (TUESDAY) może wymagać logiki w JS, ale week załatwia większość sprawy.
        
        if (error) {
            console.error("[ScheduleView] Błąd Supabase:", error);
            throw error;
        }
        return data || [];
    }
};
