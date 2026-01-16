// js/app/roster_view.js
import { supabaseClient } from '../auth.js';

/**
 * Mapowanie liczbowego potencjału na 10 prestiżowych rang
 */
function getPotentialLabel(pot) {
    if (pot >= 96) return { label: 'G.O.A.T.', color: '#d4af37' };
    if (pot >= 92) return { label: 'All-Time Great', color: '#b8860b' };
    if (pot >= 88) return { label: 'Elite Franchise', color: '#3b82f6' };
    if (pot >= 84) return { label: 'Star Performer', color: '#8b5cf6' };
    if (pot >= 79) return { label: 'High Prospect', color: '#10b981' };
    if (pot >= 74) return { label: 'Solid Starter', color: '#6366f1' };
    if (pot >= 68) return { label: 'Reliable Bench', color: '#64748b' };
    if (pot >= 60) return { label: 'Role Player', color: '#94a3b8' };
    if (pot >= 50) return { label: 'Deep Bench', color: '#cbd5e1' };
    return { label: 'Project Player', color: '#e2e8f0' };
}

/**
 * Renderuje widok listy zawodników (Roster)
 */
export async function renderRosterView(teamData, players) {
    const container = document.getElementById('roster-view-container');
    if (!container) {
        console.error("Błąd: Nie znaleziono kontenera #roster-view-container");
        return;
    }

    // Sortowanie zawodników - wybieramy liderów do kart TOP
    const sortedByOvr = [...players].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
    
    // Scenariusze dla kart TOP (Lider, Najlepszy Młody, Weteran)
    const teamLeader = sortedByOvr[0]; 
    const bestProspect = [...players]
        .filter(p => p.age <= 21)
        .sort((a, b) => (b.potential || 0) - (a.potential || 0))[0];
    const veteranLeader = [...players]
        .filter(p => p.age >= 30)
        .sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0))[0];

    const teamDisplayName = teamData.team_name || "Twój Zespół";

    container.innerHTML = `
        <div class="roster-container" style="padding: 30px; color: #333; font-family: 'Inter', sans-serif; background: #f4f7f6; min-height: 100vh;">
            
            <header style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 2.2em; font-weight: 800; color: #1a237e; margin:0; letter-spacing: -1px;">ROSTER <span style="color: #e65100;">MANAGEMENT</span></h1>
                    <p style="color: #666; margin: 5px 0 0 0;">Current squad: <strong style="color: #1a237e;">${teamDisplayName}</strong></p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="background: #1a237e; color: white; padding: 12px 24px; border-radius: 15px; font-weight: bold; font-size: 0.9em; box-shadow: 0 4px 10px rgba(26,35,126,0.2);">
                        🏀 SQUAD SIZE: ${players.length} / 12
                    </div>
                </div>
            </header>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 40px;">
                ${renderTopPlayerCard('FRANCHISE STAR', teamLeader, '👑')}
                ${renderTopPlayerCard('FUTURE PILLAR', bestProspect || sortedByOvr[1], '💎')}
                ${renderTopPlayerCard('CORE VETERAN', veteranLeader || sortedByOvr[sortedByOvr.length-1], '🛡️')}
            </div>

            <div style="background: white; border-radius: 20px; padding: 0; border: 1px solid #e0e0e0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden;">
                <div style="padding: 25px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff;">
                    <h3 style="margin:0; font-size: 1.1em; font-weight: 700; color: #1a237e; text-transform: uppercase; letter-spacing: 1px;">Full Squad List</h3>
                    <div style="font-size: 0.8em; color: #666;">* Skill visibility active for your team</div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f8f9fa; color: #94a3b8; font-size: 0.75em; text-transform: uppercase; letter-spacing: 1px;">
                        <tr>
                            <th style="padding: 15px 25px;">Player Details</th>
                            <th style="padding: 15px;">Position</th>
                            <th style="padding: 15px;">Potential Class</th>
                            <th style="padding: 15px;">Salary</th>
                            <th style="padding: 15px;">OVR</th>
                            <th style="padding: 15px; text-align: center;">Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(player => renderPlayerRow(player)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderTopPlayerCard(title, player, emoji) {
    if (!player) return '';
    const pot = getPotentialLabel(player.potential);
    
    return `
        <div style="background: white; padding: 25px; border-radius: 20px; border: 1px solid #e0e0e0; display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden; transition: 0.3s; cursor: pointer;" onmouseover="this.style.borderColor='#1a237e'">
            <div style="position: absolute; right: -10px; top: -10px; font-size: 4em; opacity: 0.05;">${emoji}</div>
            <div style="width: 80px; height: 80px; border-radius: 15px; background: #f0f2f5; display: flex; align-items: center; justify-content: center; font-size: 1.5em; font-weight: 900; color: #1a237e; border: 2px solid #eef0f2;">
                ${player.position}
            </div>
            <div>
                <div style="font-size: 0.65em; color: #e65100; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 5px; text-transform: uppercase;">${title}</div>
                <div style="font-size: 1.1em; font-weight: 800; color: #1a237e; display: flex; align-items: center; gap: 6px;">
                    ${player.first_name} ${player.last_name}
                    ${player.age <= 19 ? '<span style="background:#ef4444; color:white; font-size:10px; padding:2px 6px; border-radius:4px;">ROOKIE</span>' : ''}
                </div>
                <div style="font-size: 0.8em; color: ${pot.color}; font-weight: 700; margin-top: 3px;">
                    ${pot.label}
                </div>
            </div>
        </div>
    `;
}

function renderPlayerRow(player) {
    const pot = getPotentialLabel(player.potential);
    const isRookie = player.age <= 19;

    return `
        <tr style="border-bottom: 1px solid #f8f9fa; transition: 0.2s;" onmouseover="this.style.background='#fcfdfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px 25px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: #1a237e; display:flex; align-items:center; justify-content:center; font-weight:900; color:white; font-size: 0.8em;">
                        ${player.position}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1a237e; display: flex; align-items: center; gap: 8px;">
                            ${player.first_name} ${player.last_name}
                            ${isRookie ? '<span style="color:#ef4444; font-size:9px; font-weight:900;">[ROOKIE]</span>' : ''}
                        </div>
                        <div style="font-size: 0.75em; color: #999;">Age: ${player.age} | Height: ${player.height || '---'}cm</div>
                    </div>
                </div>
            </td>
            <td style="padding: 15px;">
                <div style="font-size: 0.85em; font-weight: 600; color: #444; background: #f0f2f5; display: inline-block; padding: 4px 12px; border-radius: 20px;">
                    ${player.position}
                </div>
            </td>
            <td style="padding: 15px;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 800; color: ${pot.color}; font-size: 0.85em;">${pot.label}</span>
                    <div style="width: 100px; height: 4px; background: #eee; border-radius: 2px; margin-top: 4px;">
                        <div style="width: ${player.potential}%; height: 100%; background: ${pot.color}; border-radius: 2px;"></div>
                    </div>
                </div>
            </td>
            <td style="padding: 15px; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #2e7d32; font-size: 0.9em;">
                $${(player.salary || 50000).toLocaleString()}
            </td>
            <td style="padding: 15px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e8f5e9; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #2e7d32; font-size: 0.9em; background: #fff;">
                    ${player.overall_rating || 0}
                </div>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="window.showPlayerDetails('${player.id}')" style="background: white; border: 1px solid #e0e0e0; padding: 8px 16px; border-radius: 10px; color: #1a237e; font-weight: 700; cursor: pointer; font-size: 0.75em; transition: 0.3s;" onmouseover="this.style.background='#1a237e'; this.style.color='white'; this.style.borderColor='#1a237e'">
                    DEVELOPMENT
                </button>
            </td>
        </tr>
    `;
}

// Globalna funkcja do obsługi kliknięcia - Profil Rozwoju
window.showPlayerDetails = (playerId) => {
    console.log("Opening Development Hub for player:", playerId);
    // Tutaj w przyszłości wywołamy modal z historią OVR i treningiem
};
