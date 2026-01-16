// js/app/roster_view.js
import { supabaseClient } from '../auth.js';
// Importujemy Twoje funkcje renderujące (upewnij się, że plik ma taką nazwę!)
import { renderPlayerRow } from './player_list_component.js'; 
import { openTransferModal } from './transfer_modal_component.js'; 

/**
 * Mapowanie potencjału - musi być tutaj, by wyliczyć label przed wysłaniem do renderPlayerRow
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
    
    // Logika obsługi przycisków (Globalna)
    window.sellPlayer = (playerId) => {
        const player = safePlayers.find(p => String(p.id) === String(playerId));
        if (player) openTransferModal(player);
    };

    window.showPlayerProfile = (playerId) => {
        console.log("Otwieranie profilu gracza:", playerId);
        // Tutaj w przyszłości dodasz funkcję otwierania profilu
    };

    container.innerHTML = `
        <div class="roster-container" style="padding: 30px; background: #f4f7f6; min-height: 100vh; font-family: 'Inter', sans-serif;">
            <header style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 2.2em; font-weight: 800; color: #1a237e; margin:0;">ROSTER MANAGEMENT</h1>
                    <p style="color: #666;">Current squad: <strong>${teamData.team_name || "Twój Zespół"}</strong></p>
                </div>
            </header>

            <div style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden;">
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
                        ${safePlayers.map(player => {
                            const potLabel = getPotentialLabel(player.potential);
                            // WYWOŁANIE TWOJEGO ORYGINALNEGO KODU (z belkami, skillem i profilem)
                            return renderPlayerRow(player, potLabel);
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
