// js/app/roster_view.js
import { supabaseClient } from '../auth.js';
import { renderPlayerRow } from './player_list_component.js';
import { openTransferModal } from './transfer_modal_component.js'; 

/**
 * Mapowanie potencjału - musi być identyczne jak wcześniej, 
 * aby renderPlayerRow otrzymał poprawne kolory do belek.
 */
function getPotentialLabel(pot) {
    const p = parseInt(pot) || 0;
    if (p >= 96) return { label: 'G.O.A.T.', color: '#d4af37' };
    if (p >= 92) return { label: 'All-Time Great', color: '#b8860b' };
    if (p >= 88) return { label: 'Elite Franchise', color: '#3b82f6' };
    if (p >= 84) return { label: 'Star Performer', color: '#8b5cf6' };
    if (p >= 79) return { label: 'High Prospect', color: '#10b981' };
    if (p >= 74) return { label: 'Solid Starter', color: '#6366f1' };
    if (p >= 68) return { label: 'Reliable Bench', color: '#64748b' };
    if (p >= 60) return { label: 'Role Player', color: '#94a3b8' };
    if (p >= 50) return { label: 'Deep Bench', color: '#cbd5e1' };
    return { label: 'Project Player', color: '#94a3b8' };
}

export async function renderRosterView(teamData, players) {
    const container = document.getElementById('roster-view-container');
    if (!container) return;

    const safePlayers = Array.isArray(players) ? players : [];

    // --- PRZYWRÓCENIE FUNKCJI GLOBALNYCH ---
    // Twoje przyciski w player_list_component używają window.sellPlayer
    window.sellPlayer = (playerId) => {
        const player = safePlayers.find(p => String(p.id) === String(playerId));
        if (player) {
            openTransferModal(player);
        } else {
            console.error("Nie znaleziono zawodnika:", playerId);
        }
    };

    window.showPlayerProfile = (playerId) => {
        console.log("Otwieranie profilu dla ID:", playerId);
    };

    // Sortowanie (opcjonalne, by liderzy byli na górze)
    const sortedPlayers = [...safePlayers].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));

    container.innerHTML = `
        <div class="roster-container" style="padding: 30px; background: #f4f7f6; min-height: 100vh; font-family: 'Inter', sans-serif;">
            <header style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 2.2em; font-weight: 800; color: #1a237e; margin:0; letter-spacing: -1px;">ROSTER <span style="color: #e65100;">MANAGEMENT</span></h1>
                    <p style="color: #666; margin: 5px 0 0 0;">Current squad: <strong style="color: #1a237e;">${teamData.team_name || "Twój Zespół"}</strong></p>
                </div>
                <div style="background: #1a237e; color: white; padding: 12px 24px; border-radius: 15px; font-weight: bold; font-size: 0.9em; box-shadow: 0 4px 10px rgba(26,35,126,0.2);">
                    🏀 SQUAD SIZE: ${safePlayers.length} / 12
                </div>
            </header>

            <div style="background: white; border-radius: 20px; border: 1px solid #e0e0e0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f8f9fa; color: #94a3b8; font-size: 0.75em; text-transform: uppercase; letter-spacing: 1px;">
                        <tr>
                            <th style="padding: 15px 25px;">Player & Scouting Report</th>
                            <th style="padding: 15px;">Pos</th>
                            <th style="padding: 15px;">Age</th>
                            <th style="padding: 15px;">Height</th>
                            <th style="padding: 15px;">Salary</th>
                            <th style="padding: 15px;">Potential</th>
                            <th style="padding: 15px;">OVR</th>
                            <th style="padding: 15px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedPlayers.map(player => {
                            const potLabel = getPotentialLabel(player.potential);
                            // To wywołuje Twój oryginalny design (belki, skille, % wykorzystania)
                            return renderPlayerRow(player, potLabel);
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
