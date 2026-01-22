// js/app/schedule_view.js
import { supabaseClient } from '../auth.js';

export const ScheduleView = {
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
        container.innerHTML = `<div class="loading-state">Ładowanie terminarza...</div>`;

        // Pobieramy aktualny tydzień z globalnego stanu gry
        const currentWeek = window.gameState?.currentWeek || 1;

        try {
            const schedule = await this.fetchTeamSchedule(teamId);
            
            if (!schedule || schedule.length === 0) {
                container.innerHTML = `
                    <div class="schedule-wrapper">
                        <div class="schedule-card">Brak zaplanowanych meczów w bazie danych dla tej drużyny.</div>
                    </div>`;
                return;
            }

            // Główna struktura po pobraniu danych
            container.innerHTML = `
                <div class="schedule-wrapper">
                    <header id="week-strip" class="schedule-card"></header>
                    <div class="schedule-grid">
                        <aside id="next-match-focus" class="schedule-card"></aside>
                        <main id="full-season-list" class="schedule-card"></main>
                    </div>
                </div>
            `;

            this.renderWeekStrip(currentWeek);
            this.renderNextMatch(schedule, currentWeek);
            this.renderFullList(schedule);

        } catch (err) {
            console.error("[ScheduleView] Błąd renderowania:", err);
            container.innerHTML = `<div class="error-state">Błąd podczas ładowania danych.</div>`;
        }
    },

    renderWeekStrip(week) {
        const container = document.getElementById('week-strip');
        if (!container) return;

        const days = [
            { name: 'PON', activity: 'Trening', type: 'training' },
            { name: 'WT', activity: 'Mecz Ligowy', type: 'match' },
            { name: 'ŚR', activity: 'Puchar/Wolne', type: 'cup' },
            { name: 'CZW', activity: 'Mecz Ligowy', type: 'match' },
            { name: 'PT', activity: 'Trening', type: 'training' },
            { name: 'SOB', activity: 'Mecz Ligowy', type: 'match' },
            { name: 'ND', activity: 'Finanse', type: 'admin' }
        ];

        container.innerHTML = `
            <div class="strip-header">POSTĘP SEZONU • TYDZIEŃ ${week} / 15</div>
            <div class="strip-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 10px;">
                ${days.map(d => `
                    <div class="strip-slot ${d.type}" style="background: #1a1a1a; padding: 10px; border-radius: 8px; text-align: center; border-bottom: 3px solid ${d.type === 'match' ? '#ff4500' : '#333'}">
                        <span class="day" style="display: block; font-weight: bold; font-size: 0.8rem;">${d.name}</span>
                        <span class="act" style="font-size: 0.6rem; color: #888; text-transform: uppercase;">${d.activity}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderNextMatch(schedule, week) {
        const container = document.getElementById('next-match-focus');
        if (!container) return;

        const next = schedule.find(m => m.week >= week && m.status === 'SCHEDULED');

        if (!next) {
            container.innerHTML = `<div class="no-games">Brak nadchodzących meczów.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="card-label" style="color: #ff4500; font-weight: bold; font-size: 0.7rem; margin-bottom: 15px;">NASTĘPNY PRZECIWNIK</div>
            <div class="focus-card" style="text-align: center;">
                <div class="focus-vs" style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 20px;">
                    <div class="team">
                        <div style="width: 50px; height: 50px; background: #333; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">LOGO</div>
                        <span style="font-size: 0.9rem; font-weight: bold;">${next.home_team?.name || 'DOM'}</span>
                    </div>
                    <div class="vs-badge" style="font-style: italic; font-weight: 900; color: #ff4500;">VS</div>
                    <div class="team">
                        <div style="width: 50px; height: 50px; background: #333; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 10px;">LOGO</div>
                        <span style="font-size: 0.9rem; font-weight: bold;">${next.away_team?.name || 'WYJAZD'}</span>
                    </div>
                </div>
                <div class="focus-details" style="background: #000; padding: 10px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 0.8rem;">Tydzień ${next.week} • ${next.day_of_week}</p>
                    <span style="display: inline-block; background: #ff4500; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-top: 5px;">${next.match_type}</span>
                </div>
            </div>
        `;
    },

    renderFullList(schedule) {
        const container = document.getElementById('full-season-list');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card-label" style="color: #666; font-weight: bold; font-size: 0.7rem; margin-bottom: 10px;">TERMINARZ SEZONU (28 MECZÓW)</div>
            <div class="schedule-table-wrapper" style="max-height: 400px; overflow-y: auto;">
                <table class="schedule-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid #333; text-align: left; color: #555;">
                            <th style="padding: 10px;">WK</th>
                            <th style="padding: 10px;">DZIEŃ</th>
                            <th style="padding: 10px;">MECZ</th>
                            <th style="padding: 10px;">WYNIK</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map(m => `
                            <tr style="border-bottom: 1px solid #1a1a1a; ${m.status === 'PLAYED' ? 'opacity: 0.5;' : ''}">
                                <td style="padding: 10px;">${m.week}</td>
                                <td style="padding: 10px;">${m.day_of_week.substring(0,3)}</td>
                                <td style="padding: 10px;">${m.home_team?.name} <span style="color: #444;">vs</span> ${m.away_team?.name}</td>
                                <td style="padding: 10px; font-weight: bold; color: #ff4500;">${m.score_home !== null ? `${m.score_home}:${m.score_away}` : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async fetchTeamSchedule(teamId) {
        console.log("[ScheduleView] Pobieram mecze dla teamId:", teamId);
        const { data, error } = await supabaseClient
            .from('matches')
            .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('week', { ascending: true });
        
        if (error) {
            console.error("[ScheduleView] Błąd Supabase:", error);
            return [];
        }
        return data || [];
    }
};
