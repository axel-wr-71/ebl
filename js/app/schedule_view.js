// js/app/schedule_view.js
import { supabaseClient } from '../auth.js';
import { LeagueClock } from '../core/league_clock.js'; // Do pobierania aktywności dni

export const ScheduleView = {
    /**
     * Mapowanie dni tygodnia (pełne angielskie nazwy)
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
     * Mapowanie typów meczów (pełne nazwy)
     */
    getMatchTypeFull(type) {
        const typesMap = {
            'LIG': 'League',
            'PUCH': 'Cup',
            'SPR': 'Friendly',
            'PLAYOFF': 'Playoff',
            'ALL-STAR': 'All-Star',
            'DRAFT': 'Draft'
        };
        return typesMap[type] || type;
    },

    /**
     * Renderowanie nagłówka (kafelków dni)
     */
    renderWeekDays(currentWeek) {
        // Pobierz aktywności dni dla aktualnego tygodnia z LeagueClock
        const weekActivities = LeagueClock.getWeekActivities(currentWeek);
        
        return weekActivities.map(day => `
            <div style="text-align: center; padding: 12px 8px; background: #fff; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 0.85rem; font-weight: 800; color: #333; margin-bottom: 4px;">
                    ${this.getFullDayName(day.day).substring(0, 3).toUpperCase()}
                </div>
                <div style="font-size: 0.7rem; font-weight: 700; color: ${day.color}; padding: 3px 6px; background: ${day.color}15; border-radius: 4px;">
                    ${day.activity.toUpperCase()}
                </div>
            </div>
        `).join('');
    },

    /**
     * Renderowanie tabeli terminarza
     */
    renderTable(schedule, teamId) {
        const container = document.getElementById('schedule-table-container');
        
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                <thead style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <tr>
                        <th style="padding: 15px 20px; text-align: left; color: #495057; font-weight: 700; width: 100px;">Date</th>
                        <th style="padding: 15px 20px; text-align: left; color: #495057; font-weight: 700; width: 80px;">Week</th>
                        <th style="padding: 15px 20px; text-align: left; color: #495057; font-weight: 700; width: 100px;">Day</th>
                        <th style="padding: 15px 20px; text-align: left; color: #495057; font-weight: 700;">Match</th>
                        <th style="padding: 15px 20px; text-align: left; color: #495057; font-weight: 700; width: 100px;">Type</th>
                        <th style="padding: 15px 20px; text-align: center; color: #495057; font-weight: 700; width: 200px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedule.map(match => {
                        const isHome = match.home_team_id === teamId;
                        const isCompleted = match.status === 'COMPLETED';
                        const isFuture = match.status === 'SCHEDULED';
                        const matchDate = new Date(match.match_date).toISOString().split('T')[0];
                        
                        // Określ kolor dla typu meczu
                        let typeColor = '#6c757d'; // domyślny
                        if (match.match_type === 'Liga') typeColor = '#fd7e14';
                        if (match.match_type === 'Puchar') typeColor = '#007bff';
                        if (match.match_type === 'Sparing') typeColor = '#28a745';
                        
                        return `
                            <tr style="border-bottom: 1px solid #e9ecef; transition: background 0.2s;">
                                <td style="padding: 15px 20px; color: #495057; font-weight: 500;">${matchDate}</td>
                                <td style="padding: 15px 20px; font-weight: 700; color: #212529;">Week ${match.week}</td>
                                <td style="padding: 15px 20px; color: #6c757d; font-weight: 600;">
                                    ${this.getFullDayName(match.day_of_week)}
                                </td>
                                <td style="padding: 15px 20px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="${isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #495057;'}">
                                            ${match.home_team.team_name}
                                        </span>
                                        <span style="color: #adb5bd; font-weight: 300;">vs</span>
                                        <span style="${!isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #495057;'}">
                                            ${match.away_team.team_name}
                                        </span>
                                    </div>
                                </td>
                                <td style="padding: 15px 20px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: ${typeColor}; padding: 4px 8px; background: ${typeColor}15; border-radius: 4px;">
                                        ${this.getMatchTypeFull(match.match_type)}
                                    </span>
                                </td>
                                <td style="padding: 15px 20px; text-align: center;">
                                    ${isFuture ? `
                                        <button class="set-lineup-btn" data-match-id="${match.id}" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">
                                            Set Lineup
                                        </button>
                                    ` : isCompleted ? `
                                        <button class="view-result-btn" data-match-id="${match.id}" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">
                                            Result
                                        </button>
                                    ` : '<span style="color: #adb5bd;">-</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // Dodaj event listeners do przycisków
        this.addButtonEventListeners();
    },

    /**
     * Renderowanie ostatnich 3 meczów
     */
    renderLastMatches(schedule, teamId) {
        const container = document.getElementById('last-matches-section');
        const lastMatches = schedule
            .filter(m => m.status === 'COMPLETED')
            .slice(-3)
            .reverse();
        
        if (lastMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚽</div>
                    <div style="font-weight: 600;">No matches played yet</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <h3 style="margin: 0 0 20px 0; font-size: 0.85rem; color: #495057; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                Last 3 Matches
            </h3>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                ${lastMatches.map(match => {
                    const isHome = match.home_team_id === teamId;
                    const result = isHome ? 
                        `${match.score_home}-${match.score_away}` : 
                        `${match.score_away}-${match.score_home}`;
                    const won = isHome ? 
                        (match.score_home > match.score_away) : 
                        (match.score_away > match.score_home);
                    
                    return `
                        <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="font-size: 0.75rem; font-weight: 700; color: ${won ? '#28a745' : '#dc3545'}">
                                    ${won ? 'W' : 'L'} ${result}
                                </div>
                                <div style="font-size: 0.7rem; color: #6c757d; background: #f8f9fa; padding: 2px 8px; border-radius: 10px;">
                                    ${match.match_type}
                                </div>
                            </div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: #495057;">
                                ${isHome ? 'vs' : '@'} ${isHome ? match.away_team.team_name : match.home_team.team_name}
                            </div>
                            <div style="font-size: 0.7rem; color: #6c757d; margin-top: 5px;">
                                Week ${match.week} • ${new Date(match.match_date).toLocaleDateString()}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Renderowanie następnego meczu z przyciskiem
     */
    renderNextMatch(schedule, week, teamId) {
        const nextMatch = schedule.find(m => m.status === 'SCHEDULED') || schedule[0];
        const container = document.getElementById('next-match-widget');
        
        container.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 0.85rem; color: #fd7e14; text-transform: uppercase; letter-spacing: 1px;">
                Next Match
            </h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="text-align: center; flex: 1;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #fd7e14, #ff9f43); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; box-shadow: 0 4px 8px rgba(253, 126, 20, 0.3);">
                        ${nextMatch.home_team.team_name[0]}
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; line-height: 1.2; color: #212529;">
                        ${nextMatch.home_team.team_name}
                    </div>
                </div>
                <div style="font-weight: 900; color: #6c757d; font-size: 1.2rem; padding: 0 15px;">VS</div>
                <div style="text-align: center; flex: 1;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #007bff, #3399ff); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);">
                        ${nextMatch.away_team.team_name[0]}
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; line-height: 1.2; color: #212529;">
                        ${nextMatch.away_team.team_name}
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #343a40, #495057); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-size: 0.85rem; font-weight: 600; text-align: center;">
                    Week ${nextMatch.week} • ${this.getFullDayName(nextMatch.day_of_week)}
                </div>
                <div style="margin-top: 5px; font-size: 0.75rem; text-align: center; color: #adb5bd;">
                    ${new Date(nextMatch.match_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style="margin-top: 8px; text-align: center;">
                    <span style="background: rgba(255,255,255,0.1); color: #ffc107; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                        ${nextMatch.match_type.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <button id="next-match-lineup-btn" data-match-id="${nextMatch.id}" style="width: 100%; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>⚙️</span> Set Lineup for Next Match
            </button>
        `;
        
        // Event listener dla przycisku następnego meczu
        document.getElementById('next-match-lineup-btn')?.addEventListener('click', (e) => {
            const matchId = e.target.dataset.matchId;
            this.handleSetLineup(matchId);
        });
    },

    /**
     * Główny render widoku
     */
    async render(containerId, teamId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let currentWeek = window.gameState?.currentWeek ?? 0;
        const totalWeeks = 16; // Z dokumentacji

        try {
            const schedule = await this.fetchTeamSchedule(teamId);
            
            // Główny HTML z nową strukturą
            container.innerHTML = `
                <div class="schedule-view-wrapper" style="padding: 20px; background: #f8f9fa; font-family: 'Inter', sans-serif;">
                    
                    <!-- NAGŁÓWEK -->
                    <div style="margin-bottom: 30px;">
                        <h1 style="margin: 0 0 10px 0; font-size: 1.8rem; font-weight: 900; color: #212529; display: flex; align-items: center; gap: 10px;">
                            <span style="background: linear-gradient(135deg, #fd7e14, #ff9f43); color: white; padding: 5px 15px; border-radius: 8px; font-size: 1rem;">
                                SCHEDULE & MATCHES
                            </span>
                        </h1>
                        <div style="color: #6c757d; font-size: 0.9rem; margin-bottom: 20px;">
                            Manage your team's lineup and view match results throughout the season
                        </div>
                    </div>
                    
                    <!-- PANEL TYGODNIA -->
                    <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <span style="font-weight: 800; font-size: 1rem; color: #212529;">SYSTEM ROZGRYWEK • WEEK ${currentWeek} / ${totalWeeks}</span>
                                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 5px;">
                                    ${LeagueClock.getWeekDescription(currentWeek)}
                                </div>
                            </div>
                        </div>
                        
                        <!-- KAFELKI DNI TYGODNIA -->
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 15px;">
                            ${this.renderWeekDays(currentWeek)}
                        </div>
                    </div>
                    
                    <!-- GŁÓWNA ZAWARTOŚĆ -->
                    <div style="display: grid; grid-template-columns: 320px 1fr 320px; gap: 25px; align-items: start;">
                        
                        <!-- LEWA KOLUMNA: NASTĘPNY MECZ -->
                        <aside>
                            <div id="next-match-widget" style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"></div>
                        </aside>
                        
                        <!-- ŚRODKOWA KOLUMNA: TERMINARZ -->
                        <main style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                            <div style="padding: 20px; border-bottom: 1px solid #dee2e6; background: #f8f9fa;">
                                <h2 style="margin: 0; font-size: 1rem; font-weight: 800; color: #212529; text-transform: uppercase; letter-spacing: 1px;">
                                    Full Season Schedule
                                </h2>
                                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 5px;">
                                    ${schedule.length} matches total • Click Set Lineup to prepare for upcoming games
                                </div>
                            </div>
                            <div id="schedule-table-container" style="overflow-x: auto;"></div>
                        </main>
                        
                        <!-- PRAWA KOLUMNA: OSTATNIE MECZE -->
                        <aside>
                            <div id="last-matches-section" style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: 100%;">
                                <!-- Tutaj wstawimy ostatnie 3 mecze -->
                            </div>
                        </aside>
                        
                    </div>
                </div>
            `;

            // Renderowanie komponentów
            this.renderNextMatch(schedule, currentWeek, teamId);
            this.renderTable(schedule, teamId);
            this.renderLastMatches(schedule, teamId);

        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <div style="padding: 50px; text-align: center; color: #dc3545; background: #fff; border-radius: 12px; border: 1px solid #f8d7da;">
                    <div style="font-size: 1.5rem; margin-bottom: 15px;">❌</div>
                    <div style="font-weight: 700; margin-bottom: 10px;">Error loading schedule</div>
                    <div style="color: #6c757d; font-size: 0.9rem;">${err.message}</div>
                </div>
            `;
        }
    },

    /**
     * Dodawanie event listenerów do przycisków
     */
    addButtonEventListeners() {
        // Przyciski "Set Lineup" w tabeli
        document.querySelectorAll('.set-lineup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchId = e.target.dataset.matchId;
                this.handleSetLineup(matchId);
            });
        });
        
        // Przyciski "Result" w tabeli
        document.querySelectorAll('.view-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchId = e.target.dataset.matchId;
                this.handleViewResult(matchId);
            });
        });
    },

    /**
     * Obsługa kliknięcia "Set Lineup"
     */
    handleSetLineup(matchId) {
        console.log(`Setting lineup for match ${matchId}`);
        // Tutaj przekierowanie do widoku ustawiania składu
        alert(`Set Lineup clicked for match ${matchId}\n(To be implemented)`);
    },

    /**
     * Obsługa kliknięcia "Result"
     */
    handleViewResult(matchId) {
        console.log(`Viewing result for match ${matchId}`);
        // Tutaj modal/podgląd wyniku
        alert(`View Result clicked for match ${matchId}\n(To be implemented)`);
    },

    /**
     * Pobieranie terminarza z Supabase
     */
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
            .order('match_date', { ascending: true })
            .order('week', { ascending: true });
        
        if (error) throw error;
        return data;
    }
};
