// js/app/schedule_view.js
import { supabaseClient } from '../auth.js';
import { LeagueClock } from '../core/league_clock.js';

export const ScheduleView = {
    /**
     * Formatowanie daty na YYYY-MM-DD
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },

    /**
     * Konwertowanie dnia tygodnia na pełną angielską nazwę
     */
    formatDayOfWeek(dayStr) {
        return LeagueClock.getFullDayName(dayStr);
    },

    /**
     * Konwertowanie typu meczu na pełną angielską nazwę
     */
    formatMatchType(type) {
        const typeMap = {
            'Liga': 'League',
            'Puchar': 'Cup',
            'Sparing': 'Friendly',
            'Playoff': 'Playoff',
            'ALL-STAR': 'All-Star',
            'DRAFT': 'Draft'
        };
        return typeMap[type] || type;
    },

    /**
     * Główny render widoku terminarza
     */
    async render(containerId, teamId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<div style="padding: 50px; text-align: center; color: #888;">Loading schedule...</div>`;

        try {
            // Pobierz aktualny tydzień
            const currentWeek = await LeagueClock.getCurrentWeek();
            const totalWeeks = LeagueClock.getTotalWeeks();
            
            // Pobierz terminarz drużyny
            const schedule = await this.fetchTeamSchedule(teamId);
            
            if (!schedule || schedule.length === 0) {
                container.innerHTML = `
                    <div style="padding: 100px 20px; text-align: center; background: #fff; border-radius: 12px; margin: 20px; border: 1px dashed #ccc;">
                        <img src="https://cdn-icons-png.flaticon.com/512/4076/4076402.png" width="64" style="opacity: 0.3; margin-bottom: 20px;">
                        <div style="color: #212529; font-weight: 700; font-size: 1.1rem;">No matches in database.</div>
                        <div style="color: #6c757d; font-size: 0.9rem; margin-top: 5px;">Make sure the Season 1 schedule has been generated.</div>
                    </div>`;
                return;
            }

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
                    <div id="week-strip-container" style="margin-bottom: 25px;"></div>
                    
                    <!-- GŁÓWNA ZAWARTOŚĆ -->
                    <div style="display: grid; grid-template-columns: 320px 1fr 320px; gap: 25px; align-items: start;">
                        
                        <!-- LEWA KOLUMNA: NASTĘPNY MECZ -->
                        <aside>
                            <div id="next-match-widget" style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px;"></div>
                            <div id="last-matches-section" style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                <h3 style="margin: 0 0 15px 0; font-size: 0.85rem; color: #495057; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
                                    Last 3 Matches
                                </h3>
                                <div id="last-matches-list"></div>
                            </div>
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
                        
                        <!-- PRAWA KOLUMNA: PUSTA (usunięta sekcja pucharowa) -->
                        <aside style="background: #f8f9fa; border: 2px dashed #e0e0e0; border-radius: 12px; height: 100%; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #adb5bd;">
                            <div style="text-align: center; padding: 20px;">
                                <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
                                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">Cup Tournament</div>
                                <div style="font-size: 0.8rem; color: #6c757d;">View upcoming cup matches in the main schedule</div>
                            </div>
                        </aside>
                        
                    </div>
                </div>
            `;

            // Renderuj komponenty
            this.renderWeekStrip(currentWeek, totalWeeks);
            this.renderNextMatch(schedule, teamId);
            this.renderLastThreeMatches(schedule, teamId);
            this.renderTable(schedule, teamId);

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
     * Renderowanie paska z kafelkami dni tygodnia
     */
    renderWeekStrip(currentWeek, totalWeeks) {
        const container = document.getElementById('week-strip-container');
        const weekActivities = LeagueClock.getWeekActivities(currentWeek);
        
        container.innerHTML = `
            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <span style="font-weight: 800; font-size: 1rem; color: #212529;">SYSTEM ROZGRYWEK • WEEK ${currentWeek} / ${totalWeeks}</span>
                        <div style="font-size: 0.8rem; color: #6c757d; margin-top: 5px;">
                            ${LeagueClock.getWeekDescription(currentWeek)}
                        </div>
                    </div>
                </div>
                
                <!-- KAFELKI DNI TYGODNIA -->
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                    ${weekActivities.map(day => {
                        const shortDay = this.formatDayOfWeek(day.day).substring(0, 3);
                        return `
                            <div style="text-align: center; padding: 12px 8px; background: #fff; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 0.85rem; font-weight: 800; color: #333; margin-bottom: 4px;">
                                    ${shortDay.toUpperCase()}
                                </div>
                                <div style="font-size: 0.7rem; font-weight: 700; color: ${day.color}; padding: 3px 6px; background: ${day.color}15; border-radius: 4px;">
                                    ${day.activity.toUpperCase()}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Renderowanie następnego meczu z przyciskiem
     */
    renderNextMatch(schedule, teamId) {
        const nextMatch = schedule.find(m => m.status === 'SCHEDULED' || m.status === 'UPCOMING') || schedule[0];
        const container = document.getElementById('next-match-widget');
        
        if (!nextMatch) {
            container.innerHTML = `
                <h3 style="margin: 0 0 15px 0; font-size: 0.85rem; color: #fd7e14; text-transform: uppercase; letter-spacing: 1px;">
                    Next Match
                </h3>
                <div style="text-align: center; padding: 30px 0; color: #6c757d;">
                    No upcoming matches
                </div>
            `;
            return;
        }
        
        const isHome = nextMatch.home_team_id === teamId;
        const matchDate = this.formatDate(nextMatch.match_date);
        const dayName = this.formatDayOfWeek(nextMatch.day_of_week);
        const matchType = this.formatMatchType(nextMatch.match_type);
        
        container.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 0.85rem; color: #fd7e14; text-transform: uppercase; letter-spacing: 1px;">
                Next Match
            </h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="text-align: center; flex: 1;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #fd7e14, #ff9f43); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; box-shadow: 0 4px 8px rgba(253, 126, 20, 0.3);">
                        ${nextMatch.home_team.team_name?.[0] || 'H'}
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; line-height: 1.2; color: #212529;">
                        ${nextMatch.home_team.team_name || 'Home Team'}
                    </div>
                </div>
                <div style="font-weight: 900; color: #6c757d; font-size: 1.2rem; padding: 0 15px;">VS</div>
                <div style="text-align: center; flex: 1;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #007bff, #3399ff); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);">
                        ${nextMatch.away_team.team_name?.[0] || 'A'}
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; line-height: 1.2; color: #212529;">
                        ${nextMatch.away_team.team_name || 'Away Team'}
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #343a40, #495057); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-size: 0.85rem; font-weight: 600; text-align: center;">
                    Week ${nextMatch.week} • ${dayName}
                </div>
                <div style="margin-top: 5px; font-size: 0.75rem; text-align: center; color: #adb5bd;">
                    ${matchDate}
                </div>
                <div style="margin-top: 8px; text-align: center;">
                    <span style="background: rgba(255,255,255,0.1); color: #ffc107; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                        ${matchType.toUpperCase()}
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
     * Renderowanie ostatnich 3 meczów
     */
    renderLastThreeMatches(schedule, teamId) {
        const container = document.getElementById('last-matches-list');
        const lastMatches = schedule
            .filter(m => m.status === 'COMPLETED' || (m.score_home !== null && m.score_away !== null))
            .slice(-3)
            .reverse();
        
        if (lastMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚽</div>
                    <div style="font-weight: 600; font-size: 0.9rem;">No matches played yet</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = lastMatches.map(match => {
            const isHome = match.home_team_id === teamId;
            const result = isHome ? 
                `${match.score_home || 0}-${match.score_away || 0}` : 
                `${match.score_away || 0}-${match.score_home || 0}`;
            const won = isHome ? 
                ((match.score_home || 0) > (match.score_away || 0)) : 
                ((match.score_away || 0) > (match.score_home || 0));
            const matchDate = this.formatDate(match.match_date);
            const opponentName = isHome ? match.away_team.team_name : match.home_team.team_name;
            
            return `
                <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: ${won ? '#28a745' : '#dc3545'}">
                            ${won ? 'W' : 'L'} ${result}
                        </div>
                        <div style="font-size: 0.7rem; color: #6c757d; background: #f8f9fa; padding: 2px 8px; border-radius: 10px;">
                            ${match.match_type || 'League'}
                        </div>
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: #495057;">
                        ${isHome ? 'vs' : '@'} ${opponentName || 'Opponent'}
                    </div>
                    <div style="font-size: 0.7rem; color: #6c757d; margin-top: 5px;">
                        Week ${match.week} • ${matchDate}
                    </div>
                    <button class="view-result-btn" data-match-id="${match.id}" style="width: 100%; margin-top: 10px; background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
                        View Result
                    </button>
                </div>
            `;
        }).join('');
        
        // Dodaj event listeners do przycisków wyników
        document.querySelectorAll('#last-matches-list .view-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchId = e.target.dataset.matchId;
                this.handleViewResult(matchId);
            });
        });
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
                        <th style="padding: 15px 20px; text-align: center; color: #495057; font-weight: 700; width: 150px;">Result</th>
                        <th style="padding: 15px 20px; text-align: center; color: #495057; font-weight: 700; width: 200px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedule.map(match => {
                        const isHome = match.home_team_id === teamId;
                        const isCompleted = match.status === 'COMPLETED' || (match.score_home !== null && match.score_away !== null);
                        const isFuture = match.status === 'SCHEDULED' || match.status === 'UPCOMING';
                        const matchDate = this.formatDate(match.match_date);
                        const dayName = this.formatDayOfWeek(match.day_of_week);
                        const matchType = this.formatMatchType(match.match_type);
                        
                        // Określ kolor dla typu meczu
                        let typeColor = '#6c757d'; // domyślny
                        if (match.match_type === 'Liga') typeColor = '#fd7e14';
                        if (match.match_type === 'Puchar') typeColor = '#007bff';
                        if (match.match_type === 'Sparing') typeColor = '#28a745';
                        if (match.match_type === 'Playoff') typeColor = '#dc3545';
                        if (match.match_type === 'ALL-STAR') typeColor = '#ffc107';
                        
                        return `
                            <tr style="border-bottom: 1px solid #e9ecef; transition: background 0.2s; background: ${isCompleted ? '#f8f9fa' : 'white'}">
                                <td style="padding: 15px 20px; color: #495057; font-weight: 500;">${matchDate}</td>
                                <td style="padding: 15px 20px; font-weight: 700; color: #212529;">Week ${match.week}</td>
                                <td style="padding: 15px 20px; color: #6c757d; font-weight: 600;">
                                    ${dayName}
                                </td>
                                <td style="padding: 15px 20px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="${isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #495057;'}">
                                            ${match.home_team.team_name || 'Home'}
                                        </span>
                                        <span style="color: #adb5bd; font-weight: 300;">vs</span>
                                        <span style="${!isHome ? 'color: #fd7e14; font-weight: 700;' : 'color: #495057;'}">
                                            ${match.away_team.team_name || 'Away'}
                                        </span>
                                    </div>
                                </td>
                                <td style="padding: 15px 20px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: ${typeColor}; padding: 4px 8px; background: ${typeColor}15; border-radius: 4px;">
                                        ${matchType}
                                    </span>
                                </td>
                                <td style="padding: 15px 20px; text-align: center; font-weight: 700;">
                                    ${isCompleted ? 
                                        `<span style="color: ${isHome ? (match.score_home > match.score_away ? '#28a745' : '#dc3545') : (match.score_away > match.score_home ? '#28a745' : '#dc3545')}">
                                            ${match.score_home || 0} - ${match.score_away || 0}
                                        </span>` : 
                                        '<span style="color: #adb5bd;">-</span>'
                                    }
                                </td>
                                <td style="padding: 15px 20px; text-align: center;">
                                    ${isFuture ? `
                                        <button class="set-lineup-btn" data-match-id="${match.id}" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; margin-right: 5px;">
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
        alert(`Set Lineup clicked for match ${matchId}\n(To be implemented: Redirect to lineup setup)`);
        // Tutaj przekierowanie do widoku ustawiania składu
        // window.location.href = `/lineup?match=${matchId}`;
    },

    /**
     * Obsługa kliknięcia "Result"
     */
    handleViewResult(matchId) {
        console.log(`Viewing result for match ${matchId}`);
        alert(`View Result clicked for match ${matchId}\n(To be implemented: Show match details modal)`);
        // Tutaj modal/podgląd wyniku
    },

    /**
     * Pobieranie terminarza z Supabase
     */
    async fetchTeamSchedule(teamId) {
        if (!teamId) return [];
        
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
                match_date,
                played_at,
                is_played,
                league_id,
                home_team:home_team_id ( team_name ),
                away_team:away_team_id ( team_name )
            `)
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('match_date', { ascending: true })
            .order('week', { ascending: true });
        
        if (error) {
            console.error("[ScheduleView] Error fetching schedule:", error);
            throw error;
        }
        return data;
    }
};
