// js/app/league_view.js
import { supabaseClient } from '../auth.js';

export async function renderLeagueView(team, players) {
    console.log("[LEAGUE] Renderowanie widoku ligi...");
    
    const container = document.getElementById('m-league');
    if (!container) {
        console.error("[LEAGUE] Brak kontenera m-league!");
        return;
    }
    
    // Pokaż ładowanie
    container.innerHTML = `
        <div style="padding: 30px; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 20px;">🏀</div>
            <h2 style="color: #333;">Ładowanie danych ligi...</h2>
            <p style="color: #666;">Proszę czekać</p>
        </div>
    `;
    
    try {
        // Najpierw pobierz ligę użytkownika
        if (!team || !team.league_name) {
            throw new Error("Nie znaleziono danych ligi dla Twojej drużyny");
        }
        
        const userLeague = team.league_name;
        console.log(`[LEAGUE] Liga użytkownika: ${userLeague}`);
        
        // Pobierz dane ligowe TYLKO dla ligi użytkownika
        const [standingsData, topPlayersData, leagueStats, upcomingMatches, leagueLeaders] = await Promise.all([
            fetchLeagueStandings(userLeague),
            fetchTopPlayers(userLeague),
            fetchLeagueStatistics(userLeague),
            fetchUpcomingMatches(team?.id, userLeague),
            fetchLeagueLeaders(userLeague)
        ]);
        
        renderLeagueContent(container, standingsData, topPlayersData, leagueStats, upcomingMatches, leagueLeaders, team, userLeague);
        
    } catch (error) {
        console.error("[LEAGUE] Błąd:", error);
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #e74c3c;">
                <h3>❌ Błąd ładowania danych ligi</h3>
                <p>${error.message}</p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Upewnij się, że Twoja drużyna jest przypisana do ligi.</p>
                <button onclick="window.switchTab('m-league')" 
                        style="background: #3b82f6; color: white; padding: 10px 20px; border: none; 
                               border-radius: 6px; margin-top: 20px; font-weight: 600;">
                    Spróbuj ponownie
                </button>
            </div>
        `;
    }
}

async function fetchLeagueStandings(userLeague) {
    console.log(`[LEAGUE] Pobieranie tabeli ligowej dla ligi: ${userLeague}`);
    
    try {
        // Najpierw spróbuj pobrać z league_standings z filtrem po lidze
        const { data: leagueStandings, error: lsError } = await supabaseClient
            .from('league_standings')
            .select(`
                id,
                team_id,
                wins,
                losses,
                points_for,
                points_against,
                season,
                teams!inner(
                    id,
                    team_name,
                    league_name,
                    conference,
                    country
                )
            `)
            .eq('teams.league_name', userLeague)
            .order('wins', { ascending: false })
            .order('points_for - points_against', { ascending: false });
        
        if (!lsError && leagueStandings && leagueStandings.length > 0) {
            return leagueStandings.map((team, index) => ({
                position: index + 1,
                id: team.team_id,
                team_name: team.teams?.team_name || `Team ${index + 1}`,
                wins: team.wins || 0,
                losses: team.losses || 0,
                points_scored: team.points_for || 0,
                points_allowed: team.points_against || 0,
                games_played: (team.wins || 0) + (team.losses || 0),
                conference: team.teams?.conference || '',
                win_percentage: ((team.wins || 0) / ((team.wins || 0) + (team.losses || 0) || 1)).toFixed(3),
                points_difference: (team.points_for || 0) - (team.points_against || 0)
            }));
        }
        
        console.warn(`[LEAGUE] Brak danych w league_standings dla ligi ${userLeague}, używam teams`);
        
    } catch (e) {
        console.warn("[LEAGUE] Błąd league_standings:", e);
    }
    
    // Fallback: użyj danych z teams z filtrem po lidze
    const { data: teams, error } = await supabaseClient
        .from('teams')
        .select(`
            id,
            team_name,
            wins,
            losses,
            conference,
            league_name,
            country
        `)
        .eq('league_name', userLeague)
        .order('wins', { ascending: false })
        .order('losses', { ascending: true });
    
    if (error) {
        console.error("[LEAGUE] Błąd pobierania teams:", error);
        throw error;
    }
    
    if (!teams || teams.length === 0) {
        console.warn(`[LEAGUE] Brak drużyn w lidze: ${userLeague}`);
        return [];
    }
    
    return teams.map((team, index) => ({
        position: index + 1,
        id: team.id,
        team_name: team.team_name,
        wins: team.wins || 0,
        losses: team.losses || 0,
        points_scored: 0,
        points_allowed: 0,
        games_played: (team.wins || 0) + (team.losses || 0),
        conference: team.conference || '',
        win_percentage: ((team.wins || 0) / ((team.wins || 0) + (team.losses || 0) || 1)).toFixed(3),
        points_difference: 0
    }));
}

async function fetchTopPlayers(userLeague) {
    console.log(`[LEAGUE] Pobieranie najlepszych zawodników dla ligi: ${userLeague}`);
    
    try {
        // Spróbuj pobrać z player_stats z filtrem po lidze drużyny
        const { data: playerStats, error: statsError } = await supabaseClient
            .from('player_stats')
            .select(`
                player_id,
                points,
                rebounds,
                assists,
                steals,
                blocks,
                games_played,
                field_goal_percentage,
                players!inner(
                    id,
                    first_name,
                    last_name,
                    position,
                    overall_rating,
                    potential,
                    age,
                    height,
                    weight,
                    team_id,
                    teams!inner(team_name, league_name)
                )
            `)
            .eq('players.teams.league_name', userLeague)
            .order('points', { ascending: false })
            .limit(20);
        
        if (!statsError && playerStats && playerStats.length > 0) {
            return playerStats.map(stat => {
                const games = stat.games_played || 1;
                return {
                    id: stat.players.id,
                    first_name: stat.players.first_name,
                    last_name: stat.players.last_name,
                    position: stat.players.position,
                    overall_rating: stat.players.overall_rating,
                    potential: stat.players.potential,
                    age: stat.players.age,
                    height: stat.players.height,
                    weight: stat.players.weight,
                    team_id: stat.players.team_id,
                    team_name: stat.players.teams?.team_name,
                    league_name: stat.players.teams?.league_name,
                    points_per_game: (stat.points || 0) / games,
                    rebounds_per_game: (stat.rebounds || 0) / games,
                    assists_per_game: (stat.assists || 0) / games,
                    steals_per_game: (stat.steals || 0) / games,
                    blocks_per_game: (stat.blocks || 0) / games,
                    field_goal_percentage: stat.field_goal_percentage || 0,
                    games_played: games,
                    efficiency: calculatePlayerEfficiency(stat)
                };
            });
        }
    } catch (e) {
        console.warn("[LEAGUE] Brak player_stats:", e);
    }
    
    // Fallback: tylko podstawowe dane z players z filtrem po lidze
    const { data: players, error } = await supabaseClient
        .from('players')
        .select(`
            id,
            first_name,
            last_name,
            position,
            overall_rating,
            potential,
            age,
            height,
            weight,
            team_id,
            teams!inner(team_name, league_name)
        `)
        .eq('teams.league_name', userLeague)
        .order('overall_rating', { ascending: false })
        .limit(20);
    
    if (!error && players) {
        return players.map(p => ({
            ...p,
            team_name: p.teams?.team_name,
            league_name: p.teams?.league_name,
            points_per_game: (p.overall_rating / 2).toFixed(1),
            rebounds_per_game: (p.overall_rating / 5).toFixed(1),
            assists_per_game: (p.overall_rating / 6).toFixed(1),
            efficiency: p.overall_rating
        }));
    }
    
    return [];
}

function calculatePlayerEfficiency(stats) {
    const PTS = stats.points || 0;
    const REB = stats.rebounds || 0;
    const AST = stats.assists || 0;
    const STL = stats.steals || 0;
    const BLK = stats.blocks || 0;
    const games = stats.games_played || 1;
    
    // Prosty wzór na efficiency per game
    return ((PTS + REB + AST + STL + BLK) / games).toFixed(1);
}

async function fetchLeagueStatistics(userLeague) {
    console.log(`[LEAGUE] Pobieranie statystyk ligi: ${userLeague}`);
    
    const stats = {
        totalTeams: 0,
        totalGames: 0,
        totalPoints: 0,
        averagePointsPerGame: 0,
        topScorer: { name: "Brak danych", points_per_game: 0, team: "" },
        bestTeam: { name: "Brak danych", wins: 0, losses: 0, win_percentage: 0 }
    };
    
    try {
        // Pobierz dane z league_standings z filtrem po lidze
        const { data: standings, error } = await supabaseClient
            .from('league_standings')
            .select(`
                wins,
                losses,
                points_for,
                points_against,
                teams!inner(team_name, league_name)
            `)
            .eq('teams.league_name', userLeague);
        
        if (!error && standings && standings.length > 0) {
            stats.totalTeams = standings.length;
            
            // Oblicz całkowitą liczbę gier
            const totalWins = standings.reduce((sum, team) => sum + (team.wins || 0), 0);
            const totalLosses = standings.reduce((sum, team) => sum + (team.losses || 0), 0);
            stats.totalGames = (totalWins + totalLosses) / 2;
            
            // Oblicz całkowite punkty
            stats.totalPoints = standings.reduce((sum, team) => sum + (team.points_for || 0), 0);
            stats.averagePointsPerGame = (stats.totalPoints / (stats.totalGames || 1)).toFixed(1);
            
            // Znajdź najlepszą drużynę
            const bestTeam = standings.reduce((best, current) => {
                const currentWins = current.wins || 0;
                const currentLosses = current.losses || 0;
                const bestWins = best.wins || 0;
                const bestLosses = best.losses || 0;
                
                const currentPct = currentWins / (currentWins + currentLosses || 1);
                const bestPct = bestWins / (bestWins + bestLosses || 1);
                
                return currentPct > bestPct ? current : best;
            }, standings[0]);
            
            if (bestTeam) {
                stats.bestTeam = {
                    name: bestTeam.teams?.team_name || "Brak danych",
                    wins: bestTeam.wins || 0,
                    losses: bestTeam.losses || 0,
                    win_percentage: ((bestTeam.wins || 0) / ((bestTeam.wins || 0) + (bestTeam.losses || 0) || 1) * 100).toFixed(1)
                };
            }
        }
        
        // Najlepszy strzelec
        const { data: topScorerData, error: scorerError } = await supabaseClient
            .from('player_stats')
            .select(`
                points,
                games_played,
                players!inner(
                    first_name,
                    last_name,
                    teams!inner(team_name, league_name)
                )
            `)
            .eq('players.teams.league_name', userLeague)
            .order('points', { ascending: false })
            .limit(1)
            .single();
        
        if (!scorerError && topScorerData) {
            const games = topScorerData.games_played || 1;
            stats.topScorer = {
                name: `${topScorerData.players?.first_name || ''} ${topScorerData.players?.last_name || ''}`.trim(),
                points_per_game: ((topScorerData.points || 0) / games).toFixed(1),
                team: topScorerData.players?.teams?.team_name || ""
            };
        }
        
    } catch (error) {
        console.warn("[LEAGUE] Błąd pobierania statystyk:", error);
    }
    
    return stats;
}

async function fetchUpcomingMatches(userTeamId, userLeague) {
    console.log(`[LEAGUE] Pobieranie nadchodzących meczów dla ligi: ${userLeague}`);
    
    // TODO: W przyszłości pobierz rzeczywiste mecze z bazy
    // Na razie zwróć przykładowe dane dla ligi użytkownika
    return [
        {
            id: 1,
            date: new Date(Date.now() + 86400000).toLocaleDateString(),
            home_team: `${userLeague} Team A`,
            away_team: `${userLeague} Team B`,
            venue: "Arena 1"
        },
        {
            id: 2,
            date: new Date(Date.now() + 172800000).toLocaleDateString(),
            home_team: `${userLeague} Team C`,
            away_team: `${userLeague} Team D`,
            venue: "Arena 2"
        },
        {
            id: 3,
            date: new Date(Date.now() + 259200000).toLocaleDateString(),
            home_team: userTeamId ? "Twoja Drużyna" : `${userLeague} Team E`,
            away_team: `${userLeague} Team F`,
            venue: "Arena 3"
        }
    ];
}

async function fetchLeagueLeaders(userLeague) {
    console.log(`[LEAGUE] Pobieranie liderów ligi: ${userLeague}`);
    
    // TODO: W przyszłości pobierz rzeczywiste dane liderów
    // Na razie zwróć przykładowe dane
    return {
        points: [
            { name: "Olav Wybydal", team: "KS Pawłów", value: 25.2 },
            { name: "Bożidar Troskot", team: "Kings Kluspek", value: 24.3 },
            { name: "Dominik Szaleja", team: "Enea Astoria", value: 24.3 }
        ],
        rebounds: [
            { name: "Jordi Salvadó", team: "KS Pawłów", value: 16.6 },
            { name: "José María Ferrero", team: "Czarni Nakło", value: 15.5 },
            { name: "Giuseppe Grasseni", team: "Czarni Nakło", value: 14.8 }
        ],
        assists: [
            { name: "Tesse Goldschmitz", team: "Świry wiry", value: 10.7 },
            { name: "Muzywka Kaśkielis", team: "SK Wisła Płock", value: 9.8 },
            { name: "Gregorio Gandarela", team: "Czarni Nakło", value: 7.9 }
        ]
    };
}

function renderLeagueContent(container, standings, topPlayers, stats, upcomingMatches, leagueLeaders, userTeam, userLeague) {
    console.log("[LEAGUE] Renderowanie zawartości...");
    
    const userTeamStanding = standings.find(t => t.id === userTeam?.id);
    
    container.innerHTML = `
        <div class="league-container" style="max-width: 1200px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            
            <!-- NAGŁÓWEK -->
            <div style="background: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 20px; border-radius: 8px 8px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h1 style="margin: 0; font-size: 1.8rem; font-weight: 600; color: #333;">
                            LIGA: ${userLeague || 'Nieznana liga'}
                        </h1>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.95rem;">
                            Aktualna drużyna: <strong>${userTeam?.team_name || 'Brak drużyny'}</strong>
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: #666;">Twoja pozycja</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">
                            ${userTeamStanding ? `#${userTeamStanding.position}` : '--'}
                        </div>
                    </div>
                </div>
                
                <!-- STATYSTYKI LIGI -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.85rem; color: #666;">Drużyny</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #333;">${stats.totalTeams || standings.length}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.85rem; color: #666;">Mecze</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #333;">${stats.totalGames || Math.round(standings.reduce((sum, t) => sum + t.games_played, 0) / 2)}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.85rem; color: #666;">Śr. punktów</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #333;">${stats.averagePointsPerGame || '0.0'}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.85rem; color: #666;">Lider</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #333;">${stats.bestTeam.name}</div>
                        <div style="font-size: 0.8rem; color: #666;">${stats.bestTeam.wins}-${stats.bestTeam.losses}</div>
                    </div>
                </div>
            </div>
            
            <!-- GŁÓWNA ZAWARTOŚĆ -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; padding: 20px; background: white;">
                
                <!-- LEWA KOLUMNA -->
                <div>
                    <!-- NADCHODZĄCE MECZE -->
                    <div style="margin-bottom: 25px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600; color: #333; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                            Nadchodzące mecze
                        </h2>
                        <div id="upcoming-matches" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                            ${renderUpcomingMatches(upcomingMatches)}
                        </div>
                    </div>
                    
                    <!-- TABELA LIGOWA -->
                    <div>
                        <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600; color: #333; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                            Aktualna tabela
                        </h2>
                        <div id="league-standings-table" style="overflow-x: auto;">
                            ${renderLeagueTable(standings, userTeam?.id)}
                        </div>
                    </div>
                </div>
                
                <!-- PRAWA KOLUMNA -->
                <div>
                    <!-- LIDERZY LIGI -->
                    <div style="margin-bottom: 25px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600; color: #333; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                            Liderzy ligi
                        </h2>
                        <div id="league-leaders">
                            ${renderLeagueLeaders(leagueLeaders)}
                        </div>
                    </div>
                    
                    <!-- TOP ZAWODNICY -->
                    <div>
                        <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600; color: #333; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                            Top zawodnicy
                        </h2>
                        <div id="top-players">
                            ${renderTopPlayers(topPlayers.slice(0, 5))}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- STATYSTYKI ZESPOŁOWE -->
            ${standings.length > 0 ? `
                <div style="background: #f8f9fa; padding: 20px; border-top: 1px solid #dee2e6;">
                    <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600; color: #333; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                        Statystyki zespołowe
                    </h2>
                    <div style="overflow-x: auto;">
                        ${renderTeamStats(standings)}
                    </div>
                </div>
            ` : ''}
            
            <!-- STOPKA -->
            <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; max-width: 800px; margin: 0 auto;">
                    <div>
                        <div style="font-weight: 600;">${userLeague} • Sezon ${new Date().getFullYear()}</div>
                        <div style="color: #999; margin-top: 5px;">Dane aktualne na: ${new Date().toLocaleDateString()}</div>
                    </div>
                    <button onclick="window.switchTab('m-league')" 
                            style="background: #3b82f6; color: white; border: none; padding: 8px 16px; 
                                   border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                        🔄 Odśwież
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderUpcomingMatches(matches) {
    if (!matches || matches.length === 0) {
        return '<p style="color: #666; text-align: center; padding: 20px;">Brak nadchodzących meczów</p>';
    }
    
    return matches.map(match => `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 0.85rem; margin-bottom: 8px;">${match.date}</div>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="flex: 1; text-align: right;">
                    <div style="font-weight: 600;">${match.home_team}</div>
                </div>
                <div style="margin: 0 15px; font-weight: 700; color: #666;">vs</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${match.away_team}</div>
                </div>
            </div>
            <div style="color: #666; font-size: 0.8rem; border-top: 1px solid #f3f4f6; padding-top: 8px;">
                🏟️ ${match.venue || 'Arena'}
            </div>
        </div>
    `).join('');
}

function renderLeagueTable(standings, userTeamId) {
    if (!standings || standings.length === 0) {
        return `
            <div style="text-align: center; padding: 30px; color: #666;">
                <p>Brak danych tabeli ligowej.</p>
                <p style="font-size: 0.9rem;">Drużyny nie rozegrały jeszcze żadnych meczów.</p>
            </div>
        `;
    }
    
    return `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #666; width: 40px;">#</th>
                    <th style="padding: 12px 10px; text-align: left; font-weight: 600; color: #666;">Drużyna</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 40px;">W</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 40px;">L</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 60px;">PF</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 60px;">PA</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 60px;">%</th>
                    <th style="padding: 12px 10px; text-align: center; font-weight: 600; color: #666; width: 60px;">+/-</th>
                </tr>
            </thead>
            <tbody>
                ${standings.map((team, index) => {
                    const isUserTeam = team.id === userTeamId;
                    const rowStyle = isUserTeam ? 'background: #e8f4fd; font-weight: 600;' : '';
                    const borderStyle = isUserTeam ? 'border-left: 3px solid #3b82f6;' : '';
                    
                    return `
                        <tr style="${rowStyle} ${borderStyle} border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 10px; color: #333;">
                                ${index + 1}
                            </td>
                            <td style="padding: 12px 10px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 24px; height: 24px; background: ${isUserTeam ? '#3b82f6' : '#e5e7eb'}; 
                                                border-radius: 4px; display: flex; align-items: center; justify-content: center; 
                                                font-weight: 700; color: ${isUserTeam ? 'white' : '#666'}; font-size: 0.8rem;">
                                        ${getTeamInitials(team.team_name)}
                                    </div>
                                    <div>
                                        <div style="font-weight: ${isUserTeam ? '600' : '500'}; color: #333;">
                                            ${team.team_name}
                                            ${isUserTeam ? '<span style="color: #3b82f6; font-size: 0.8rem; margin-left: 5px;">(TY)</span>' : ''}
                                        </div>
                                        <div style="font-size: 0.75rem; color: #666;">
                                            ${team.conference || ''}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: #10b981;">${team.wins}</td>
                            <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: #ef4444;">${team.losses}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #333; font-weight: 500;">${team.points_scored}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #333; font-weight: 500;">${team.points_allowed}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #333; font-weight: 600;">${team.win_percentage}</td>
                            <td style="padding: 12px 10px; text-align: center; font-weight: 600; 
                                color: ${team.points_difference > 0 ? '#10b981' : team.points_difference < 0 ? '#ef4444' : '#666'};">
                                ${team.points_difference > 0 ? '+' : ''}${team.points_difference}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderLeagueLeaders(leaders) {
    if (!leaders) {
        return '<p style="color: #666; text-align: center; padding: 20px;">Brak danych liderów</p>';
    }
    
    return `
        <div style="display: grid; gap: 15px;">
            <!-- PUNKTY -->
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px; font-weight: 600;">Punkty na mecz</div>
                ${leaders.points.map((player, index) => `
                    <div style="display: flex; align-items: center; padding: 8px; background: ${index === 0 ? '#fef3c7' : 'white'}; 
                                border-radius: 6px; margin-bottom: 5px; border: 1px solid ${index === 0 ? '#fbbf24' : '#e5e7eb'};">
                        <div style="width: 24px; height: 24px; background: ${index === 0 ? '#f59e0b' : '#e5e7eb'}; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 600; color: ${index === 0 ? 'white' : '#666'}; font-size: 0.8rem; margin-right: 10px;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333; font-size: 0.9rem;">${player.name}</div>
                            <div style="font-size: 0.8rem; color: #666;">${player.team}</div>
                        </div>
                        <div style="font-weight: 700; color: #e74c3c;">${player.value}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- ZBIÓRKI -->
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px; font-weight: 600;">Zbiórki na mecz</div>
                ${leaders.rebounds.map((player, index) => `
                    <div style="display: flex; align-items: center; padding: 8px; background: white; 
                                border-radius: 6px; margin-bottom: 5px; border: 1px solid #e5e7eb;">
                        <div style="width: 24px; height: 24px; background: #e5e7eb; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 600; color: #666; font-size: 0.8rem; margin-right: 10px;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333; font-size: 0.9rem;">${player.name}</div>
                            <div style="font-size: 0.8rem; color: #666;">${player.team}</div>
                        </div>
                        <div style="font-weight: 700; color: #3b82f6;">${player.value}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- ASYSTY -->
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px; font-weight: 600;">Asysty na mecz</div>
                ${leaders.assists.map((player, index) => `
                    <div style="display: flex; align-items: center; padding: 8px; background: white; 
                                border-radius: 6px; margin-bottom: 5px; border: 1px solid #e5e7eb;">
                        <div style="width: 24px; height: 24px; background: #e5e7eb; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 600; color: #666; font-size: 0.8rem; margin-right: 10px;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333; font-size: 0.9rem;">${player.name}</div>
                            <div style="font-size: 0.8rem; color: #666;">${player.team}</div>
                        </div>
                        <div style="font-weight: 700; color: #10b981;">${player.value}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderTopPlayers(players) {
    if (!players || players.length === 0) {
        return '<p style="color: #666; text-align: center; padding: 20px;">Brak danych zawodników</p>';
    }
    
    return players.map((player, index) => `
        <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f3f4f6;">
            <div style="width: 32px; height: 32px; background: #e5e7eb; 
                        border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        font-weight: 600; color: #666; font-size: 0.9rem; margin-right: 12px;">
                ${index + 1}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #333; font-size: 0.95rem;">
                    ${player.first_name} ${player.last_name}
                </div>
                <div style="font-size: 0.8rem; color: #666; display: flex; gap: 8px;">
                    <span>${player.position || '—'}</span>
                    <span>•</span>
                    <span>${player.team_name || '—'}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: #e74c3c; font-size: 1rem;">
                    ${player.points_per_game ? player.points_per_game.toFixed(1) : '—'}
                </div>
                <div style="font-size: 0.75rem; color: #666;">PTS</div>
            </div>
        </div>
    `).join('');
}

function renderTeamStats(standings) {
    // Przykładowe statystyki - w przyszłości pobierz rzeczywiste z bazy
    const teamStats = standings.map(team => ({
        name: team.team_name,
        mins: 240,
        fg: `${Math.floor(Math.random() * 30) + 20}-${Math.floor(Math.random() * 40) + 60}`,
        fg_pct: (Math.random() * 0.5 + 0.3).toFixed(3),
        three_fg: `${Math.floor(Math.random() * 10) + 5}-${Math.floor(Math.random() * 15) + 15}`,
        three_pct: (Math.random() * 0.4 + 0.2).toFixed(3),
        ft: `${Math.floor(Math.random() * 15) + 5}-${Math.floor(Math.random() * 20) + 10}`,
        ft_pct: (Math.random() * 0.5 + 0.3).toFixed(3),
        reb: Math.floor(Math.random() * 15) + 30,
        ast: Math.floor(Math.random() * 10) + 15,
        pts: Math.floor(Math.random() * 30) + 80
    }));
    
    return `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #666;">Drużyna</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">MIN</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">FG</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">3FG</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">FT</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">OR</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">AST</th>
                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #666;">PTS</th>
                </tr>
            </thead>
            <tbody>
                ${teamStats.map((stat, index) => `
                    <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                        <td style="padding: 10px 8px; font-weight: 500; color: #333;">${stat.name}</td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">${stat.mins}</td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">
                            ${stat.fg}<br>
                            <span style="color: #999; font-size: 0.75rem;">${stat.fg_pct}</span>
                        </td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">
                            ${stat.three_fg}<br>
                            <span style="color: #999; font-size: 0.75rem;">${stat.three_pct}</span>
                        </td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">
                            ${stat.ft}<br>
                            <span style="color: #999; font-size: 0.75rem;">${stat.ft_pct}</span>
                        </td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">${stat.reb}</td>
                        <td style="padding: 10px 8px; text-align: center; color: #666;">${stat.ast}</td>
                        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #333;">${stat.pts}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Funkcje pomocnicze
function getTeamInitials(teamName) {
    if (!teamName) return 'TM';
    const words = teamName.split(' ');
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return teamName.substring(0, 2).toUpperCase();
}
