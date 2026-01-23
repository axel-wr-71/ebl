// js/app/league_view.js
import { supabaseClient } from '../auth.js';

export async function renderLeagueView(team, players) {
    console.log("[LEAGUE] Renderowanie widoku ligi NBA...");
    
    const container = document.getElementById('m-league');
    if (!container) {
        console.error("[LEAGUE] Brak kontenera m-league!");
        return;
    }
    
    // Pokaż ładowanie
    container.innerHTML = `
        <div style="padding: 30px; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 20px; color: #006bb6;">🏀</div>
            <h2 style="color: #1d428a;">Ładowanie statystyk NBA...</h2>
            <p style="color: #666;">Pobieranie danych ligowych</p>
        </div>
    `;
    
    try {
        // Pobierz dane ligowe
        const [standingsData, topPlayersData, leagueStats, recentGames] = await Promise.all([
            fetchLeagueStandings(),
            fetchTopPlayers(),
            fetchLeagueStatistics(),
            fetchRecentGames()
        ]);
        
        renderLeagueContent(container, standingsData, topPlayersData, leagueStats, recentGames, team);
        
    } catch (error) {
        console.error("[LEAGUE] Błąd:", error);
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #e74c3c;">
                <h3>❌ Błąd ładowania danych ligi</h3>
                <p>${error.message}</p>
                <button onclick="window.switchTab('m-league')" 
                        style="background: #006bb6; color: white; padding: 10px 20px; border: none; 
                               border-radius: 8px; margin-top: 20px; font-weight: 600;">
                    Spróbuj ponownie
                </button>
            </div>
        `;
    }
}

async function fetchLeagueStandings() {
    console.log("[LEAGUE] Pobieranie tabeli ligowej...");
    
    try {
        // Sprawdź czy league_standings istnieje i ma dane
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
                conference,
                division,
                games_played,
                home_wins,
                away_wins,
                streak,
                last_10,
                teams!inner(team_name, conference as team_conference, league_name, country)
            `)
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
                games_played: team.games_played || (team.wins || 0) + (team.losses || 0),
                streak: team.streak || '',
                last_10: team.last_10 || '',
                conference: team.conference || team.teams?.conference || 'East',
                division: team.division || '',
                home_wins: team.home_wins || 0,
                away_wins: team.away_wins || 0,
                win_percentage: ((team.wins || 0) / ((team.wins || 0) + (team.losses || 0) || 1)).toFixed(3),
                points_difference: (team.points_for || 0) - (team.points_against || 0)
            }));
        }
        
        // Jeśli nie ma league_standings, użyj teams
        console.warn("[LEAGUE] Brak danych w league_standings, używam teams");
        
    } catch (e) {
        console.warn("[LEAGUE] Błąd league_standings:", e);
    }
    
    // Fallback: użyj danych z teams
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
        .order('wins', { ascending: false })
        .order('losses', { ascending: true });
    
    if (error) {
        console.error("[LEAGUE] Błąd pobierania teams:", error);
        throw error;
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
        streak: '',
        last_10: '',
        conference: team.conference || 'East',
        division: '',
        home_wins: 0,
        away_wins: 0,
        win_percentage: ((team.wins || 0) / ((team.wins || 0) + (team.losses || 0) || 1)).toFixed(3),
        points_difference: 0
    }));
}

async function fetchTopPlayers() {
    console.log("[LEAGUE] Pobieranie najlepszych zawodników...");
    
    try {
        // Spróbuj pobrać z player_stats jeśli istnieje
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
                    teams!inner(team_name)
                )
            `)
            .order('points', { ascending: false })
            .limit(20);
        
        if (!statsError && playerStats) {
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
    
    // Fallback: tylko podstawowe dane z players
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
            teams!inner(team_name)
        `)
        .order('overall_rating', { ascending: false })
        .limit(20);
    
    if (!error && players) {
        return players.map(p => ({
            ...p,
            team_name: p.teams?.team_name,
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

async function fetchLeagueStatistics() {
    console.log("[LEAGUE] Pobieranie statystyk ligi...");
    
    const stats = {
        totalTeams: 0,
        totalGames: 0,
        totalPoints: 0,
        averagePointsPerGame: 0,
        topScorer: { name: "LeBron James", points_per_game: 27.5, team: "Los Angeles Lakers" },
        bestTeam: { name: "Boston Celtics", wins: 45, losses: 17, win_percentage: 72.6 },
        bestOffense: { name: "Golden State Warriors", ppg: 118.3 },
        bestDefense: { name: "New York Knicks", ppg_allowed: 102.4 }
    };
    
    try {
        // Pobierz dane z league_standings
        const { data: standings, error } = await supabaseClient
            .from('league_standings')
            .select(`
                wins,
                losses,
                points_for,
                points_against,
                teams!inner(team_name)
            `);
        
        if (!error && standings && standings.length > 0) {
            stats.totalTeams = standings.length;
            
            // Oblicz całkowitą liczbę gier
            stats.totalGames = standings.reduce((sum, team) => sum + (team.wins || 0) + (team.losses || 0), 0) / 2;
            
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
            });
            
            stats.bestTeam = {
                name: bestTeam.teams?.team_name || "Boston Celtics",
                wins: bestTeam.wins || 45,
                losses: bestTeam.losses || 17,
                win_percentage: ((bestTeam.wins || 0) / ((bestTeam.wins || 0) + (bestTeam.losses || 0) || 1) * 100).toFixed(1)
            };
            
            // Najlepszy atak (najwięcej points_for na mecz)
            const bestOffense = standings.reduce((best, current) => {
                const currentPPG = (current.points_for || 0) / ((current.wins || 0) + (current.losses || 0) || 1);
                const bestPPG = (best.points_for || 0) / ((best.wins || 0) + (best.losses || 0) || 1);
                return currentPPG > bestPPG ? current : best;
            });
            
            stats.bestOffense = {
                name: bestOffense.teams?.team_name || "Golden State Warriors",
                ppg: ((bestOffense.points_for || 0) / ((bestOffense.wins || 0) + (bestOffense.losses || 0) || 1)).toFixed(1)
            };
            
            // Najlepsza obrona (najmniej points_against na mecz)
            const bestDefense = standings.reduce((best, current) => {
                const currentPPG = (current.points_against || 0) / ((current.wins || 0) + (current.losses || 0) || 1);
                const bestPPG = (best.points_against || 0) / ((best.wins || 0) + (best.losses || 0) || 1);
                return currentPPG < bestPPG ? current : best;
            });
            
            stats.bestDefense = {
                name: bestDefense.teams?.team_name || "New York Knicks",
                ppg_allowed: ((bestDefense.points_against || 0) / ((bestDefense.wins || 0) + (bestDefense.losses || 0) || 1)).toFixed(1)
            };
        }
        
    } catch (error) {
        console.warn("[LEAGUE] Błąd pobierania statystyk:", error);
    }
    
    return stats;
}

async function fetchRecentGames() {
    console.log("[LEAGUE] Pobieranie ostatnich meczów...");
    
    // Przykładowe dane - w przyszłości pobierz z league_games
    return [
        {
            id: 1,
            date: '2024-01-20',
            home_team: 'Los Angeles Lakers',
            away_team: 'Golden State Warriors',
            home_score: 112,
            away_score: 108,
            winner: 'home'
        },
        {
            id: 2,
            date: '2024-01-19',
            home_team: 'Boston Celtics',
            away_team: 'Miami Heat',
            home_score: 105,
            away_score: 98,
            winner: 'home'
        },
        {
            id: 3,
            date: '2024-01-18',
            home_team: 'Chicago Bulls',
            away_team: 'New York Knicks',
            home_score: 96,
            away_score: 102,
            winner: 'away'
        },
        {
            id: 4,
            date: '2024-01-17',
            home_team: 'Phoenix Suns',
            away_team: 'Dallas Mavericks',
            home_score: 118,
            away_score: 112,
            winner: 'home'
        },
        {
            id: 5,
            date: '2024-01-16',
            home_team: 'Milwaukee Bucks',
            away_team: 'Philadelphia 76ers',
            home_score: 124,
            away_score: 119,
            winner: 'home'
        }
    ];
}

function renderLeagueContent(container, standings, topPlayers, stats, recentGames, userTeam) {
    console.log("[LEAGUE] Renderowanie zawartości NBA...");
    
    const userTeamStanding = standings.find(t => t.id === userTeam?.id);
    
    container.innerHTML = `
        <div class="nba-league-container" style="max-width: 1400px; margin: 0 auto; font-family: 'Segoe UI', sans-serif;">
            <!-- NAGŁÓWEK NBA -->
            <div style="background: linear-gradient(135deg, #1d428a, #006bb6); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; font-weight: 800; font-size: 2.5rem; display: flex; align-items: center; gap: 15px;">
                            <span>🏀</span> NBA LEAGUE 2023-24
                        </h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 1rem;">
                            Sezon ${stats.bestTeam?.season || '2023-24'} • Aktualizacja: ${new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;">Twoja pozycja</div>
                        <div style="font-size: 2.5rem; font-weight: 900; color: #ffd700;">
                            ${userTeamStanding ? `#${userTeamStanding.position}` : '--'}
                        </div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">
                            ${userTeam?.team_name || 'Brak drużyny'}
                        </div>
                    </div>
                </div>
                
                <!-- STATYSTYKI LIGI -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-top: 25px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.85rem; opacity: 0.8;">DRUŻYNY</div>
                        <div style="font-size: 2rem; font-weight: 800; margin: 5px 0;">${stats.totalTeams || standings.length}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.85rem; opacity: 0.8;">MECZE</div>
                        <div style="font-size: 2rem; font-weight: 800; margin: 5px 0;">${stats.totalGames || Math.round(standings.reduce((sum, t) => sum + t.games_played, 0) / 2)}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.85rem; opacity: 0.8;">PUNKTY/MECZ</div>
                        <div style="font-size: 2rem; font-weight: 800; margin: 5px 0;">${stats.averagePointsPerGame || '112.5'}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.85rem; opacity: 0.8;">NAJLEPSZA</div>
                        <div style="font-size: 1.1rem; font-weight: 700; margin: 5px 0;">${stats.bestTeam.name}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">${stats.bestTeam.wins}-${stats.bestTeam.losses}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.85rem; opacity: 0.8;">KRÓL STRZELCÓW</div>
                        <div style="font-size: 1.1rem; font-weight: 700; margin: 5px 0;">${stats.topScorer.name.split(' ')[0]}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">${stats.topScorer.points_per_game} PPG</div>
                    </div>
                </div>
            </div>
            
            <!-- GŁÓWNA ZAWARTOŚĆ -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; padding: 25px; background: #f8f9fa;">
                
                <!-- LEWA KOLUMNA -->
                <div>
                    <!-- TABELA LIGOWA -->
                    <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 25px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #1d428a; font-weight: 800; font-size: 1.6rem;">
                                📊 TABELA LIGOWA
                            </h2>
                            <div style="font-size: 0.9rem; color: #666;">
                                ${standings.length} drużyn
                            </div>
                        </div>
                        
                        <div id="league-standings-table" style="overflow-x: auto;">
                            ${renderNBATable(standings, userTeam?.id)}
                        </div>
                    </div>
                    
                    <!-- OSTATNIE MECZE -->
                    <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h2 style="margin: 0 0 20px 0; color: #1d428a; font-weight: 800; font-size: 1.6rem;">
                            🏀 OSTATNIE MECZE
                        </h2>
                        <div id="recent-games-list">
                            ${renderRecentGames(recentGames)}
                        </div>
                    </div>
                </div>
                
                <!-- PRAWA KOLUMNA -->
                <div>
                    <!-- NAJLEPSZY ZAWODNIK -->
                    <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 20px 0; color: #1d428a; font-weight: 800; font-size: 1.4rem;">
                            👑 KRÓL STRZELCÓW
                        </h3>
                        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fff5e6, #ffebcc); border-radius: 10px;">
                            <div style="width: 80px; height: 80px; background: #1d428a; border-radius: 50%; 
                                        margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; 
                                        font-size: 2rem; color: white;">
                                🏆
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 900; color: #1d428a; margin-bottom: 5px;">
                                ${stats.topScorer.name}
                            </div>
                            <div style="color: #666; margin-bottom: 15px;">${stats.topScorer.team}</div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                                <div>
                                    <div style="font-size: 1.8rem; font-weight: 900; color: #e74c3c;">${stats.topScorer.points_per_game}</div>
                                    <div style="font-size: 0.8rem; color: #666;">PPG</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.8rem; font-weight: 900; color: #006bb6;">${topPlayers[0]?.rebounds_per_game?.toFixed(1) || '7.2'}</div>
                                    <div style="font-size: 0.8rem; color: #666;">RPG</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.8rem; font-weight: 900; color: #10b981;">${topPlayers[0]?.assists_per_game?.toFixed(1) || '6.5'}</div>
                                    <div style="font-size: 0.8rem; color: #666;">APG</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- TOP 5 ZAWODNIKÓW -->
                    <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 20px 0; color: #1d428a; font-weight: 800; font-size: 1.4rem;">
                            ⭐ TOP 5 ZAWODNIKÓW
                        </h3>
                        <div id="top-players-list">
                            ${renderTopPlayersList(topPlayers.slice(0, 5))}
                        </div>
                        
                        ${topPlayers.length > 5 ? `
                            <div style="text-align: center; margin-top: 20px;">
                                <button id="btn-show-all-players" 
                                        style="background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; 
                                               padding: 10px 20px; border-radius: 25px; font-weight: 600; 
                                               cursor: pointer; font-size: 0.9rem; transition: all 0.3s;"
                                        onmouseover="this.style.background='#e9ecef'; this.style.borderColor='#1d428a';"
                                        onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6';">
                                    Pokaż wszystkich (${topPlayers.length})
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- STATYSTYKI DRUŻYN -->
                    <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h3 style="margin: 0 0 20px 0; color: #1d428a; font-weight: 800; font-size: 1.4rem;">
                            📈 NAJLEPSZE DRUŻYNY
                        </h3>
                        <div style="display: grid; gap: 15px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Najlepszy atak</div>
                                <div style="font-size: 1.1rem; font-weight: 700; color: #1d428a;">${stats.bestOffense.name}</div>
                                <div style="font-size: 0.9rem; color: #e74c3c; font-weight: 600;">${stats.bestOffense.ppg} PPG</div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #006bb6;">
                                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Najlepsza obrona</div>
                                <div style="font-size: 1.1rem; font-weight: 700; color: #1d428a;">${stats.bestDefense.name}</div>
                                <div style="font-size: 0.9rem; color: #006bb6; font-weight: 600;">${stats.bestDefense.ppg_allowed} PPG</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- STOPKA -->
            <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 0 0 12px 12px; 
                        text-align: center; font-size: 0.9rem; border-top: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
                    <div style="text-align: left;">
                        <div style="font-weight: 700; color: #006bb6;">NBA Manager Pro</div>
                        <div style="opacity: 0.7; margin-top: 5px;">Sezon 2023-24 • Oficjalne statystyki</div>
                    </div>
                    <div>
                        <button onclick="window.switchTab('m-league')" 
                                style="background: #006bb6; color: white; border: none; padding: 10px 25px; 
                                       border-radius: 25px; font-weight: 600; cursor: pointer; display: flex; 
                                       align-items: center; gap: 8px;">
                            <span>🔄</span> Odśwież
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- MODAL Z PEŁNĄ LISTĄ ZAWODNIKÓW -->
        <div id="modal-top-players" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                                           background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 1000px; max-height: 85vh; 
                        overflow-y: auto; position: relative;">
                <div style="padding: 30px; border-bottom: 1px solid #e9ecef; background: #1d428a; color: white; border-radius: 16px 16px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 1.8rem; font-weight: 800;">🏀 Ranking zawodników</h3>
                        <button id="btn-close-modal" style="background: rgba(255,255,255,0.2); color: white; border: none; 
                                 width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; 
                                 display: flex; align-items: center; justify-content: center;">
                            ×
                        </button>
                    </div>
                </div>
                <div style="padding: 25px;" id="modal-players-content">
                    ${renderAllNBAPlayers(topPlayers)}
                </div>
            </div>
        </div>
    `;
    
    // Dodaj event listeners
    initNBAEventListeners(topPlayers);
}

function renderNBATable(standings, userTeamId) {
    if (!standings || standings.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🏀</div>
                <h3 style="margin: 0 0 10px 0;">Brak danych tabeli</h3>
                <p>Statystyki pojawią się po rozegraniu meczów.</p>
            </div>
        `;
    }
    
    // Oblicz Games Behind
    const firstTeamWins = standings[0]?.wins || 0;
    const firstTeamLosses = standings[0]?.losses || 0;
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; width: 50px;">#</th>
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057;">DRUŻYNA</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 40px;">W</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 40px;">L</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 60px;">PCT</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 60px;">GB</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 50px;">PF</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 50px;">PA</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057; width: 60px;">+/-</th>
                </tr>
            </thead>
            <tbody>
                ${standings.map((team, index) => {
                    // Oblicz Games Behind
                    const teamWins = team.wins || 0;
                    const teamLosses = team.losses || 0;
                    const gamesBehind = ((firstTeamWins - teamWins) + (teamLosses - firstTeamLosses)) / 2;
                    
                    // Kolor wiersza
                    let rowStyle = '';
                    if (team.id === userTeamId) {
                        rowStyle = 'background: linear-gradient(90deg, rgba(29,66,138,0.05), rgba(0,107,182,0.08));';
                    } else if (index < 8) {
                        rowStyle = 'background: rgba(16, 185, 129, 0.05);';
                    }
                    
                    return `
                        <tr style="${rowStyle} border-bottom: 1px solid #e9ecef; ${team.id === userTeamId ? 'border-left: 4px solid #006bb6; font-weight: 600;' : ''}">
                            <td style="padding: 12px 15px; color: #495057; ${team.id === userTeamId ? 'font-weight: 700;' : ''}">
                                ${index < 8 ? '<span style="color: #10b981;">●</span>' : '<span style="color: #adb5bd;">○</span>'}
                                ${team.position}
                            </td>
                            <td style="padding: 12px 15px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 30px; height: 30px; background: ${team.id === userTeamId ? '#006bb6' : '#e9ecef'}; 
                                                border-radius: 6px; display: flex; align-items: center; justify-content: center; 
                                                font-weight: 700; color: ${team.id === userTeamId ? 'white' : '#495057'}; font-size: 0.9rem;">
                                        ${getTeamInitials(team.team_name)}
                                    </div>
                                    <div>
                                        <div style="font-weight: ${team.id === userTeamId ? '700' : '600'}; color: #212529;">
                                            ${team.team_name}
                                        </div>
                                        <div style="font-size: 0.75rem; color: #666;">
                                            ${team.conference || 'Konferencja'} • ${team.games_played || 0}G
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #10b981;">${team.wins}</td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #e74c3c;">${team.losses}</td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #212529;">${team.win_percentage}</td>
                            <td style="padding: 12px 15px; text-align: center; color: #666; font-weight: 600;">
                                ${gamesBehind === 0 ? '—' : gamesBehind.toFixed(1)}
                            </td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #212529;">${team.points_scored}</td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #212529;">${team.points_allowed}</td>
                            <td style="padding: 12px 15px; text-align: center; font-weight: 700; 
                                color: ${team.points_difference > 0 ? '#10b981' : team.points_difference < 0 ? '#e74c3c' : '#666'};">
                                ${team.points_difference > 0 ? '+' : ''}${team.points_difference}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderRecentGames(games) {
    if (!games || games.length === 0) {
        return '<p style="color: #666; text-align: center; padding: 20px;">Brak ostatnich meczów</p>';
    }
    
    return games.map(game => `
        <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e9ecef; 
                    transition: background 0.3s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
            <div style="flex: 1; text-align: right;">
                <div style="font-weight: 600; color: #212529;">${game.home_team}</div>
                <div style="font-size: 0.85rem; color: #666;">Dom</div>
            </div>
            
            <div style="width: 100px; text-align: center; padding: 0 15px;">
                <div style="font-size: 1.5rem; font-weight: 800; color: #212529;">
                    <span style="color: ${game.winner === 'home' ? '#10b981' : '#666'}">${game.home_score}</span>
                    <span style="color: #adb5bd; margin: 0 8px;">-</span>
                    <span style="color: ${game.winner === 'away' ? '#10b981' : '#666'}">${game.away_score}</span>
                </div>
                <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">FINAL</div>
            </div>
            
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #212529;">${game.away_team}</div>
                <div style="font-size: 0.85rem; color: #666;">Wyjazd</div>
            </div>
        </div>
    `).join('');
}

function renderTopPlayersList(players) {
    if (!players || players.length === 0) {
        return '<p style="color: #666; text-align: center; padding: 20px;">Brak danych zawodników</p>';
    }
    
    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#1d428a', '#1d428a'];
    
    return players.map((player, index) => `
        <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #e9ecef; 
                    ${index < 3 ? 'background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;' : ''}"
             onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='${index < 3 ? '#f8f9fa' : 'white'}'">
            <div style="position: relative; width: 36px; height: 36px; margin-right: 12px;">
                <div style="width: 36px; height: 36px; background: white; border: 2px solid ${rankColors[index]}; 
                            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                            font-weight: 800; color: ${rankColors[index]};">
                    ${index + 1}
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="font-weight: 700; color: #212529; font-size: 0.95rem;">
                    ${player.first_name} ${player.last_name}
                </div>
                <div style="font-size: 0.85rem; color: #666; display: flex; gap: 8px; margin-top: 2px;">
                    <span>${player.position || '—'}</span>
                    <span>•</span>
                    <span>${player.team_name || '—'}</span>
                </div>
            </div>
            
            <div style="text-align: right;">
                <div style="display: flex; gap: 12px;">
                    <div style="text-align: center;">
                        <div style="font-weight: 900; color: #e74c3c; font-size: 1rem;">
                            ${player.points_per_game ? player.points_per_game.toFixed(1) : '—'}
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">PTS</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-weight: 900; color: #006bb6; font-size: 1rem;">
                            ${player.rebounds_per_game ? player.rebounds_per_game.toFixed(1) : '—'}
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">REB</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAllNBAPlayers(players) {
    if (!players || players.length === 0) {
        return '<p style="color: #666; text-align: center; padding: 40px;">Brak danych zawodników</p>';
    }
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057;">#</th>
                    <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057;">ZAWODNIK</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">DRUŻYNA</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">POZYCJA</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">PTS</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">REB</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">AST</th>
                    <th style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">FG%</th>
                </tr>
            </thead>
            <tbody>
                ${players.map((player, index) => `
                    <tr style="border-bottom: 1px solid #e9ecef;" 
                        onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                        <td style="padding: 12px 15px; font-weight: 700; color: #495057; text-align: center;">
                            ${index + 1}
                        </td>
                        <td style="padding: 12px 15px;">
                            <div style="font-weight: 700; color: #212529;">${player.first_name} ${player.last_name}</div>
                            <div style="font-size: 0.85rem; color: #666;">#${player.id?.toString().substring(0, 4) || '0000'}</div>
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 600; color: #495057;">
                            ${player.team_name || '—'}
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 700; color: #1d428a;">
                            ${player.position || '—'}
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 900; color: #e74c3c;">
                            ${player.points_per_game ? player.points_per_game.toFixed(1) : '—'}
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 900; color: #006bb6;">
                            ${player.rebounds_per_game ? player.rebounds_per_game.toFixed(1) : '—'}
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 900; color: #10b981;">
                            ${player.assists_per_game ? player.assists_per_game.toFixed(1) : '—'}
                        </td>
                        <td style="padding: 12px 15px; text-align: center; font-weight: 700; color: #212529;">
                            ${player.field_goal_percentage ? player.field_goal_percentage.toFixed(1) + '%' : '—'}
                        </td>
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

function initNBAEventListeners(topPlayers) {
    const showAllBtn = document.getElementById('btn-show-all-players');
    if (showAllBtn && topPlayers.length > 5) {
        showAllBtn.addEventListener('click', () => {
            const modal = document.getElementById('modal-top-players');
            if (modal) modal.style.display = 'flex';
        });
    }
    
    const closeModalBtn = document.getElementById('btn-close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('modal-top-players');
            if (modal) modal.style.display = 'none';
        });
    }
    
    const modal = document.getElementById('modal-top-players');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}
