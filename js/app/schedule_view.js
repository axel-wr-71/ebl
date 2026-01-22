// js/app/schedule_view.js
import { supabaseClient } from '../auth.js';

export const ScheduleView = {
    /**
     * Główny render widoku terminarza
     */
    async render(containerId, teamId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Pobieramy aktualny tydzień z globalnego stanu gry
        const currentWeek = window.gameState?.currentWeek || 1;

        container.innerHTML = `
            <div class="schedule-wrapper">
                <header id="week-strip" class="schedule-card"></header>
                
                <div class="schedule-grid">
                    <aside id="next-match-focus" class="schedule-card"></aside>
                    
                    <main id="full-season-list" class="schedule-card"></main>
                </div>
            </div>
        `;

        const schedule = await this.fetchTeamSchedule(teamId);
        
        this.renderWeekStrip(currentWeek);
        this.renderNextMatch(schedule, currentWeek);
        this.renderFullList(schedule);
    },

    renderWeekStrip(week) {
        const container = document.getElementById('week-strip');
        const days = [
            { name: 'MON', activity: 'Training', type: 'training' },
            { name: 'TUE', activity: 'League', type: 'match' },
            { name: 'WED', activity: 'Cup Day', type: 'cup' },
            { name: 'THU', activity: 'League', type: 'match' },
            { name: 'FRI', activity: 'Training', type: 'training' },
            { name: 'SAT', activity: 'League', type: 'match' },
            { name: 'SUN', activity: 'Admin', type: 'admin' }
        ];

        container.innerHTML = `
            <div class="strip-header">CURRENT SEASON PROGRESS • WEEK ${week}</div>
            <div class="strip-grid">
                ${days.map(d => `
                    <div class="strip-slot ${d.type}">
                        <span class="day">${d.name}</span>
                        <span class="act">${d.activity}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderNextMatch(schedule, week) {
        const container = document.getElementById('next-match-focus');
        const next = schedule.find(m => m.week >= week && m.status === 'SCHEDULED');

        if (!next) {
            container.innerHTML = `<div class="no-games">No games left this season.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="card-label">UPCOMING OPPONENT</div>
            <div class="focus-card">
                <div class="focus-vs">
                    <div class="team">
                        <div class="logo-circle">HOME</div>
                        <span>${next.home_team.name}</span>
                    </div>
                    <div class="vs-badge">VS</div>
                    <div class="team">
                        <div class="logo-circle">AWAY</div>
                        <span>${next.away_team.name}</span>
                    </div>
                </div>
                <div class="focus-details">
                    <p>Week ${next.week} • ${next.day_of_week}</p>
                    <span class="match-type-tag">${next.match_type}</span>
                </div>
            </div>
        `;
    },

    renderFullList(schedule) {
        const container = document.getElementById('full-season-list');
        
        container.innerHTML = `
            <div class="card-label">SEASON SCHEDULE (28 GAMES)</div>
            <div class="schedule-table-wrapper">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>WK</th>
                            <th>DAY</th>
                            <th>MATCHUP</th>
                            <th>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map(m => `
                            <tr class="${m.status === 'PLAYED' ? 'row-played' : ''}">
                                <td>${m.week}</td>
                                <td>${m.day_of_week.substring(0,3)}</td>
                                <td>${m.home_team.name} <span class="vst">vs</span> ${m.away_team.name}</td>
                                <td class="res-cell">${m.score_home !== null ? `${m.score_home}:${m.score_away}` : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async fetchTeamSchedule(teamId) {
        const { data } = await supabaseClient
            .from('matches')
            .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('week', { ascending: true });
        return data || [];
    }
};
