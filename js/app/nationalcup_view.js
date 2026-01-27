// js/app/nationalcup_view.js

import { supabaseClient } from '../auth.js';

export async function renderNationalCupView(team, players, cupData) {
    console.log('[NATIONAL CUP] Renderowanie widoku pucharu narodowego');
    
    const container = document.getElementById('m-nationalcup');
    if (!container) {
        console.error('[NATIONAL CUP] Brak kontenera m-nationalcup');
        return;
    }
    
    // Sprawdź czy użytkownik ma dostęp do pucharu
    if (!cupData || !cupData.cup) {
        container.innerHTML = renderNoCupView();
        return;
    }
    
    const cupInfo = cupData.cup;
    const participantInfo = cupData.participant;
    const countryName = window.gameState.countryData?.name || "Unknown";
    
    // Pogrupuj mecze według rund
    const matchesByRound = {};
    cupData.rounds.forEach(round => {
        matchesByRound[round.id] = cupData.matches.filter(match => match.cup_round_id === round.id);
    });
    
    // Oblicz liczbę drużyn w aktualnej rundzie
    const currentRound = cupData.rounds.find(r => r.round_number === cupInfo.current_round);
    const teamsInCurrentRound = currentRound ? matchesByRound[currentRound.id]?.length * 2 || 0 : 0;
    
    // Sprawdź czy pokazać drabinkę (16 lub mniej drużyn)
    const showBracket = teamsInCurrentRound <= 16 && teamsInCurrentRound > 0;
    
    container.innerHTML = renderCupView({
        cupInfo,
        participantInfo,
        countryName,
        rounds: cupData.rounds,
        matchesByRound,
        allParticipants: cupData.allParticipants,
        teamsInCurrentRound,
        userTeamId: team.id,
        currentRound: cupInfo.current_round,
        showBracket
    });
    
    // Dodaj event listeners
    attachEventListeners();
}

function renderNoCupView() {
    return `
        <div class="national-cup-container">
            <div class="cup-header">
                <h1>🏆 National Cup</h1>
                <p class="subtitle">Your team is not participating in any national cup this season</p>
            </div>
            
            <div class="no-cup-card">
                <div class="no-cup-icon">🏀</div>
                <h3>No Active Cup</h3>
                <p>Your team is not currently registered for any national cup competition.</p>
                <p>Check back next season or contact league officials for more information.</p>
                
                <div class="cup-info-box">
                    <h4>About National Cups</h4>
                    <ul>
                        <li>Each country has its own national cup competition</li>
                        <li>Cups feature knockout (elimination) format</li>
                        <li>Teams from all divisions participate</li>
                        <li>Winners qualify for European competitions</li>
                    </ul>
                </div>
            </div>
            
            <style>
                .national-cup-container {
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .cup-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .cup-header h1 {
                    color: #1e40af;
                    margin-bottom: 10px;
                }
                
                .cup-header .subtitle {
                    color: #64748b;
                    font-size: 1.1rem;
                }
                
                .no-cup-card {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }
                
                .no-cup-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }
                
                .no-cup-card h3 {
                    color: #1e40af;
                    margin-bottom: 15px;
                }
                
                .no-cup-card p {
                    color: #64748b;
                    margin-bottom: 10px;
                    line-height: 1.6;
                }
                
                .cup-info-box {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    text-align: left;
                }
                
                .cup-info-box h4 {
                    color: #1e40af;
                    margin-bottom: 15px;
                }
                
                .cup-info-box ul {
                    padding-left: 20px;
                    color: #475569;
                }
                
                .cup-info-box li {
                    margin-bottom: 8px;
                    line-height: 1.5;
                }
            </style>
        </div>
    `;
}

function renderCupView(data) {
    const {
        cupInfo,
        participantInfo,
        countryName,
        rounds,
        matchesByRound,
        allParticipants,
        teamsInCurrentRound,
        userTeamId,
        currentRound,
        showBracket
    } = data;
    
    const userTeamStatus = getTeamStatus(participantInfo);
    const nextMatch = getNextMatch(matchesByRound, userTeamId);
    
    return `
        <div class="national-cup-container">
            <!-- Nagłówek -->
            <div class="cup-header">
                <div class="cup-title-row">
                    <h1>${cupInfo.cup_name || countryName + ' National Cup'}</h1>
                    <span class="cup-badge">Season ${cupInfo.season}</span>
                </div>
                <div class="cup-subtitle">
                    <span class="country-flag">${window.gameState.countryData?.flag_emoji || '🏳️'}</span>
                    ${countryName} • ${showBracket ? 'Knockout Stage' : 'Group Stage'} • Current Round: ${getRoundName(currentRound)}
                </div>
            </div>
            
            <!-- Statystyki szybkie -->
            <div class="cup-stats">
                <div class="stat-card">
                    <div class="stat-value">${currentRound}</div>
                    <div class="stat-label">Current Round</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${teamsInCurrentRound}</div>
                    <div class="stat-label">Teams Remaining</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userTeamStatus}</div>
                    <div class="stat-label">Your Status</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${allParticipants?.length || 0}</div>
                    <div class="stat-label">Total Teams</div>
                </div>
            </div>
            
            <!-- Przełącznik widoku -->
            <div class="view-toggle">
                <button class="view-toggle-btn active" data-view="rounds">
                    <i class="fas fa-list-ol"></i> Rounds
                </button>
                <button class="view-toggle-btn" data-view="bracket" ${!showBracket ? 'disabled' : ''}>
                    <i class="fas fa-sitemap"></i> Bracket
                </button>
                <button class="view-toggle-btn" data-view="participants">
                    <i class="fas fa-users"></i> Participants
                </button>
            </div>
            
            <!-- Widok rund -->
            <div class="cup-content">
                <div class="view-section active" id="view-rounds">
                    ${renderRoundsView(rounds, matchesByRound, userTeamId)}
                </div>
                
                <!-- Widok drabinki -->
                <div class="view-section" id="view-bracket">
                    ${showBracket ? renderBracketView(rounds, matchesByRound, currentRound) : renderBracketUnavailable(teamsInCurrentRound)}
                </div>
                
                <!-- Widok uczestników -->
                <div class="view-section" id="view-participants">
                    ${renderParticipantsView(allParticipants, participantInfo)}
                </div>
            </div>
            
            <!-- Informacje o następnym meczu -->
            ${nextMatch ? renderNextMatchInfo(nextMatch) : ''}
        </div>
        
        <style>
            .national-cup-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .cup-header {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .cup-title-row {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            
            .cup-header h1 {
                margin: 0;
                color: #1e40af;
                font-size: 2rem;
                font-weight: bold;
            }
            
            .cup-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .cup-subtitle {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #64748b;
                font-size: 1rem;
                flex-wrap: wrap;
            }
            
            .country-flag {
                font-size: 1.2rem;
            }
            
            .cup-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 5px;
            }
            
            .stat-label {
                color: #64748b;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .view-toggle {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }
            
            .view-toggle-btn {
                padding: 12px 24px;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                color: #475569;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .view-toggle-btn:hover:not(:disabled) {
                background: #e2e8f0;
                border-color: #94a3b8;
            }
            
            .view-toggle-btn.active {
                background: #1e40af;
                color: white;
                border-color: #1e40af;
            }
            
            .view-toggle-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .view-section {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            
            .view-section.active {
                display: block;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .rounds-container {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }
            
            .round-card {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
            }
            
            .round-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f1f5f9;
            }
            
            .round-title {
                font-size: 1.3rem;
                color: #1e40af;
                font-weight: 600;
            }
            
            .round-status {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .round-status.completed {
                background: #dcfce7;
                color: #166534;
            }
            
            .round-status.current {
                background: #dbeafe;
                color: #1e40af;
            }
            
            .round-status.upcoming {
                background: #fef3c7;
                color: #92400e;
            }
            
            .matches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            
            .match-card {
                background: #f8fafc;
                border-radius: 8px;
                padding: 15px;
                border: 1px solid #e2e8f0;
            }
            
            .match-card.user-match {
                background: linear-gradient(135deg, #dbeafe, #eff6ff);
                border-color: #93c5fd;
                border-width: 2px;
            }
            
            .match-teams {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .match-team {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .team-logo {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #64748b;
            }
            
            .team-name {
                font-weight: 500;
                color: #1e293b;
            }
            
            .match-score {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 15px;
                font-weight: bold;
                color: #1e40af;
            }
            
            .match-details {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
                color: #64748b;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
            }
            
            .match-date {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .match-result {
                font-weight: 500;
            }
            
            .match-result.win {
                color: #166534;
            }
            
            .match-result.loss {
                color: #dc2626;
            }
            
            .bracket-container {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
                overflow-x: auto;
            }
            
            .bracket-unavailable {
                text-align: center;
                padding: 50px 20px;
                color: #64748b;
            }
            
            .bracket-unavailable i {
                font-size: 3rem;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .participants-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .participant-card {
                background: white;
                border-radius: 8px;
                padding: 15px;
                border: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: transform 0.2s;
            }
            
            .participant-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .participant-card.user-team {
                background: linear-gradient(135deg, #dbeafe, #eff6ff);
                border-color: #93c5fd;
            }
            
            .participant-logo {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #64748b;
            }
            
            .participant-info {
                flex: 1;
            }
            
            .participant-name {
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 4px;
            }
            
            .participant-status {
                font-size: 0.85rem;
                padding: 3px 8px;
                border-radius: 12px;
                display: inline-block;
            }
            
            .status-active {
                background: #dcfce7;
                color: #166534;
            }
            
            .status-eliminated {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .next-match-card {
                margin-top: 30px;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
            }
            
            .next-match-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .next-match-title {
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .next-match-badge {
                background: rgba(255,255,255,0.2);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
            }
            
            .next-match-content {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                gap: 20px;
            }
            
            .next-match-team {
                text-align: center;
            }
            
            .next-match-logo {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                margin: 0 auto 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: bold;
            }
            
            .next-match-team-name {
                font-weight: 600;
                font-size: 1.1rem;
                margin-bottom: 5px;
            }
            
            .next-match-vs {
                font-size: 1.5rem;
                font-weight: bold;
                opacity: 0.8;
            }
            
            .next-match-details {
                text-align: center;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.2);
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            @media (max-width: 768px) {
                .cup-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .matches-grid {
                    grid-template-columns: 1fr;
                }
                
                .next-match-content {
                    grid-template-columns: 1fr;
                    text-align: center;
                    gap: 15px;
                }
                
                .next-match-vs {
                    order: 3;
                    margin-top: 10px;
                }
            }
        </style>
    `;
}

function renderRoundsView(rounds, matchesByRound, userTeamId) {
    if (!rounds || rounds.length === 0) {
        return '<div class="no-data">No rounds available</div>';
    }
    
    let html = '<div class="rounds-container">';
    
    rounds.forEach(round => {
        const matches = matchesByRound[round.id] || [];
        const isCurrentRound = round.round_number === window.gameState.nationalCupData?.currentRound;
        const isCompleted = round.is_completed;
        
        let statusClass = 'upcoming';
        let statusText = 'Upcoming';
        
        if (isCompleted) {
            statusClass = 'completed';
            statusText = 'Completed';
        } else if (isCurrentRound) {
            statusClass = 'current';
            statusText = 'Current';
        }
        
        html += `
            <div class="round-card">
                <div class="round-header">
                    <div class="round-title">${round.round_name}</div>
                    <div class="round-status ${statusClass}">${statusText}</div>
                </div>
                <div class="matches-grid">
                    ${matches.length > 0 ? 
                        matches.map(match => renderMatchCard(match, userTeamId)).join('') : 
                        '<div class="no-matches">No matches scheduled yet</div>'
                    }
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderMatchCard(match, userTeamId) {
    const isUserMatch = match.home_team_id === userTeamId || match.away_team_id === userTeamId;
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const isPlayed = match.is_played;
    
    let resultClass = '';
    let resultText = '';
    
    if (isPlayed && isUserMatch) {
        if (match.winner_team_id === userTeamId) {
            resultClass = 'win';
            resultText = 'WIN';
        } else {
            resultClass = 'loss';
            resultText = 'LOSS';
        }
    }
    
    return `
        <div class="match-card ${isUserMatch ? 'user-match' : ''}">
            <div class="match-teams">
                <div class="match-team">
                    <div class="team-logo">${homeTeam?.team_name?.charAt(0) || 'H'}</div>
                    <div class="team-name">${homeTeam?.team_name || 'TBA'}</div>
                </div>
                
                <div class="match-score">
                    ${isPlayed ? `
                        <span>${match.home_score || 0}</span>
                        <span>:</span>
                        <span>${match.away_score || 0}</span>
                    ` : 'vs'}
                </div>
                
                <div class="match-team" style="justify-content: flex-end;">
                    <div class="team-name">${awayTeam?.team_name || 'TBA'}</div>
                    <div class="team-logo">${awayTeam?.team_name?.charAt(0) || 'A'}</div>
                </div>
            </div>
            
            <div class="match-details">
                <div class="match-date">
                    <i class="far fa-calendar"></i>
                    ${match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Date TBD'}
                </div>
                ${resultText ? `<div class="match-result ${resultClass}">${resultText}</div>` : ''}
            </div>
        </div>
    `;
}

function renderBracketView(rounds, matchesByRound, currentRound) {
    // Implementacja drabinki - uproszczona wersja
    const bracketRounds = rounds.filter(r => r.round_number <= currentRound);
    
    if (bracketRounds.length === 0) {
        return '<div class="no-data">Bracket not available yet</div>';
    }
    
    let html = '<div class="bracket-container">';
    html += '<div style="text-align: center; margin-bottom: 30px; color: #1e40af; font-weight: bold; font-size: 1.2rem;">Knockout Bracket</div>';
    
    // Prosta wizualizacja drabinki
    html += '<div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">';
    
    bracketRounds.forEach(round => {
        const matches = matchesByRound[round.id] || [];
        
        html += `
            <div style="min-width: 250px;">
                <div style="background: #1e40af; color: white; padding: 10px; border-radius: 6px 6px 0 0; text-align: center; font-weight: bold;">
                    ${round.round_name}
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 10px;">
                    ${matches.length > 0 ? 
                        matches.map(match => `
                            <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e2e8f0;">
                                <div style="font-weight: 500; color: #1e293b;">${match.home_team?.team_name || 'TBA'}</div>
                                <div style="color: #64748b; font-size: 0.9rem; margin: 5px 0;">vs</div>
                                <div style="font-weight: 500; color: #1e293b;">${match.away_team?.team_name || 'TBA'}</div>
                                ${match.is_played ? `
                                    <div style="text-align: center; margin-top: 5px; color: #1e40af; font-weight: bold;">
                                        ${match.home_score} - ${match.away_score}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : 
                        '<div style="text-align: center; color: #64748b; padding: 20px;">No matches</div>'
                    }
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

function renderBracketUnavailable(teamsInCurrentRound) {
    return `
        <div class="bracket-unavailable">
            <i class="fas fa-sitemap"></i>
            <h3>Bracket View Unavailable</h3>
            <p>Bracket view becomes available when 16 or fewer teams remain in the competition.</p>
            <p>Currently there are ${teamsInCurrentRound} teams in the current round.</p>
            <p>Please use the "Rounds" view until the knockout stage begins.</p>
        </div>
    `;
}

function renderParticipantsView(participants, userParticipant) {
    if (!participants || participants.length === 0) {
        return '<div class="no-data">No participants available</div>';
    }
    
    // Sort participants: active first, then by name
    const sortedParticipants = [...participants].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return (a.team?.team_name || '').localeCompare(b.team?.team_name || '');
    });
    
    let html = '<div class="participants-grid">';
    
    sortedParticipants.forEach(participant => {
        const isUserTeam = participant.team_id === userParticipant?.team_id;
        const team = participant.team;
        
        html += `
            <div class="participant-card ${isUserTeam ? 'user-team' : ''}">
                <div class="participant-logo">
                    ${team?.team_name?.charAt(0) || 'T'}
                </div>
                <div class="participant-info">
                    <div class="participant-name">${team?.team_name || 'Unknown Team'}</div>
                    <div class="participant-status status-${participant.status}">
                        ${participant.status === 'active' ? 'Active' : 'Eliminated'}
                        ${participant.eliminated_at_round ? ` in Round ${participant.eliminated_at_round}` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderNextMatchInfo(match) {
    if (!match) return '';
    
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    
    return `
        <div class="next-match-card">
            <div class="next-match-header">
                <div class="next-match-title">Your Next Cup Match</div>
                <div class="next-match-badge">Round ${getRoundNumber(match.cup_round_id)}</div>
            </div>
            <div class="next-match-content">
                <div class="next-match-team">
                    <div class="next-match-logo">${homeTeam?.team_name?.charAt(0) || 'H'}</div>
                    <div class="next-match-team-name">${homeTeam?.team_name || 'TBA'}</div>
                </div>
                
                <div class="next-match-vs">VS</div>
                
                <div class="next-match-team">
                    <div class="next-match-logo">${awayTeam?.team_name?.charAt(0) || 'A'}</div>
                    <div class="next-match-team-name">${awayTeam?.team_name || 'TBA'}</div>
                </div>
            </div>
            <div class="next-match-details">
                <div><i class="far fa-calendar"></i> ${match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Date TBD'}</div>
            </div>
        </div>
    `;
}

function getTeamStatus(participant) {
    if (!participant) return 'Not Participating';
    if (participant.status === 'active') return 'Active';
    if (participant.status === 'eliminated') return `Eliminated (Round ${participant.eliminated_at_round})`;
    if (participant.status === 'champion') return '🏆 Champion';
    return 'Unknown';
}

function getNextMatch(matchesByRound, userTeamId) {
    for (const roundId in matchesByRound) {
        const matches = matchesByRound[roundId];
        const upcomingMatch = matches.find(match => 
            (match.home_team_id === userTeamId || match.away_team_id === userTeamId) && 
            !match.is_played
        );
        if (upcomingMatch) return upcomingMatch;
    }
    return null;
}

function getRoundName(roundNumber) {
    const roundNames = {
        1: 'First Round',
        2: 'Second Round',
        3: 'Third Round',
        4: 'Round of 16',
        5: 'Quarterfinals',
        6: 'Semifinals',
        7: 'Final',
        8: 'Championship'
    };
    return roundNames[roundNumber] || `Round ${roundNumber}`;
}

function getRoundNumber(roundId) {
    const round = window.gameState.nationalCupData?.rounds?.find(r => r.id === roundId);
    return round?.round_number || 1;
}

function attachEventListeners() {
    // Obsługa przełączania widoków
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            
            // Usuń active z wszystkich przycisków i sekcji
            document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            
            // Dodaj active do klikniętego przycisku
            this.classList.add('active');
            
            // Pokaż odpowiednią sekcję
            const viewId = this.getAttribute('data-view');
            const targetSection = document.getElementById(`view-${viewId}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}
