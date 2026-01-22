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

        container.innerHTML = `<div class="loading-state" style="padding: 20px; color: #666; text-align: center; font-family: 'Inter', sans-serif;">Ładowanie terminarza...</div>`;

        let currentWeek = window.gameState?.currentWeek;
        
        if (currentWeek === undefined) {
            try {
                const { data: config } = await supabaseClient
                    .from('game_config')
                    .select('value')
                    .eq('key', 'current_week')
                    .single();
                currentWeek = config ? parseInt(config.value) : 0;
            } catch (e) {
                currentWeek = 1;
            }
        }

        try {
            const schedule = await this.fetchTeamSchedule(teamId);
            
            if (!schedule || schedule.length === 0) {
                container.innerHTML = `
                    <div style="padding: 40px; text-align: center; background: #fff; border-radius: 12px; border: 1px solid #dee2e6; margin: 20px;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                        <div style="color: #212529; font-weight: bold;">Brak zaplanowanych meczów.</div>
                    </div>`;
                return;
            }

            // Layout jasny (Light Theme)
            container.innerHTML = `
                <div class="schedule-container" style="padding: 15px; background: #f8f9fa; min-height: calc(100vh - 80px); font-family: 'Inter', sans-serif;">
                    <header id="week-strip" style="background: #fff; padding: 12px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"></header>
                    
                    <div style="display: grid; grid-template-columns: 320px 1fr; gap: 15px; align-items: start;">
                        <aside id="next-match-focus" style="background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"></aside>
                        <main id="full-season-list" style="background: #fff; padding: 0; border-radius: 10px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden;"></main>
                    </div>
                </div>
            `;

            this.renderWeekStrip(currentWeek);
            this.renderNextMatch(schedule, currentWeek);
            this.renderFullList(schedule, teamId);

        } catch (err) {
            console.error("[ScheduleView] Błąd renderowania:", err);
            container.innerHTML = `<div style="color: #dc3545; padding: 20px; text-align: center;">Błąd: ${err.message}</div>`;
        }
    },

    renderWeekStrip(week) {
        const container = document.getElementById('week-strip');
        if (!container) return;

        const days = [
            { name: 'PON', act: 'Trening' }, { name: 'WT', act: 'Liga' },
            { name: 'ŚR', act: 'Puchar' }, { name: 'CZW', act: 'Liga' },
            { name: 'PT', act: 'Trening' }, { name: 'SOB', act: 'Liga' },
            { name: 'ND', act: 'Finanse' }
        ];

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #495057; text-transform: uppercase;">Tydzień ${week} / 15</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                ${days.map(d => `
                    <div style="text-align: center; padding: 8px; background: ${d.act === 'Liga' ? '#fff4eb' : '#f8f9fa'}; border-radius: 6px; border-bottom: 3px solid ${d.act === 'Liga' ? '#fd7e14' : '#dee2e6'}">
                        <div style="font-size: 0.75rem; font-weight: 800; color: #212529;">${d.name}</div>
                        <div style="font-size: 0.65rem; color: #6c757d; text-transform: uppercase;">${d.act}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderNextMatch(schedule, week) {
        const container = document.getElementById('next-match-focus');
        if (!container) return;

        const next = schedule.find(m => m.week >= week && m.status === 'SCHEDULED') || schedule[0];

        container.innerHTML = `
            <h3 style="margin: 0 0 20px 0; font-size: 0.85rem; color: #adb5bd; text-transform: uppercase; letter-spacing: 0.5px;">Najbliższy mecz</h3>
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <div style="width: 50px; height: 50px; background: #f1f3f5; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #adb5bd;">${(next.home_team?.team_name || 'H').substring(0,1)}</div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #212529;">${next.home_team?.team_name}</div>
                    </div>
                    <div style="font-weight: 900; color: #fd7e14; font-size: 1.2rem; padding: 0 10px;">VS</div>
                    <div style="flex: 1;">
                        <div style="width: 50px; height: 50px; background: #f1f3f5; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #adb5bd;">${(next.away_team?.team_name || 'A').substring(0,1)}</div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #212529;">${next.away_team?.team_name}</div>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.8rem; font-weight: 600; color: #495057;">Tydzień ${next.week} • ${this.translateDay(next.day_of_week)}</div>
                    <div style="margin-top: 5px; display: inline-block; padding: 4px 12px; background: #fd7e14; color: #fff; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">${next.match_type}</div>
                </div>
            </div>
        `;
    },

    renderFullList(schedule, currentTeamId) {
        const container = document.getElementById('full-season-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="max-height: calc(100vh - 250px); overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                    <thead>
                        <tr style="position: sticky; top: 0; background: #fff; border-bottom: 2px solid #f1f3f5; z-index: 1;">
                            <th style="padding: 12px 15px; color: #adb5bd; font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Tydz</th>
                            <th style="padding: 12px 15px; color: #adb5bd; font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Dzień</th>
                            <th style="padding: 12px 15px; color: #adb5bd; font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Mecz</th>
                            <th style="padding: 12px 15px; color: #adb5bd; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; text-align: center;">Wynik</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map(m => {
                            const isHome = m.home_team_id === currentTeamId;
                            return `
                            <tr style="border-bottom: 1px solid #f1f3f5; transition: background 0.2s;" onmouseover="this.style.background='#fcfcfc'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 10px 15px; font-weight: 600; color: #6c757d;">${m.week}</td>
                                <td style="padding: 10px 15px; color: #495057;">${this.translateDay(m.day_of_week).substring(0,3)}</td>
                                <td style="padding: 10px 15px;">
                                    <span style="${isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #212529;'}">${m.home_team?.team_name}</span>
                                    <span style="color: #dee2e6; margin: 0 5px;">-</span>
                                    <span style="${!isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #212529;'}">${m.away_team?.team_name}</span>
                                    <span style="margin-left: 8px; font-size: 0.65rem; padding: 2px 6px; background: #f1f3f5; color: #adb5bd; border-radius: 4px; text-transform: uppercase;">${m.match_type === 'Sparing' ? 'Spr' : 'Lig'}</span>
                                </td>
                                <td style="padding: 10px 15px; text-align: center; font-family: 'Monaco', monospace; font-weight: 700;">
                                    ${m.score_home !== null ? `${m.score_home}:${m.score_away}` : '<span style="color: #dee2e6;">-- : --</span>'}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async fetchTeamSchedule(teamId) {
        if (!teamId) return [];
        const { data, error } = await supabaseClient
            .from('matches')
            .select(`
                id, week, day_of_week, match_type, status, score_home, score_away,
                home_team_id, away_team_id, match_date,
                home_team:home_team_id ( team_name ),
                away_team:away_team_id ( team_name )
            `)
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('match_date', { ascending: true });
        
        if (error) throw error;
        return data;
    }
};
