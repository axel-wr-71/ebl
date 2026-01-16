import { supabaseClient } from '../auth.js';

// --- 1. TWOJE FUNKCJE Z LISTY ZAWODNIKÓW (KOLORY I SKILLE) ---
function getSkillColor(val) {
    const v = parseInt(val) || 0;
    if (v >= 19) return '#d4af37'; 
    if (v >= 17) return '#8b5cf6'; 
    if (v >= 15) return '#10b981'; 
    if (v >= 13) return '#06b6d4'; 
    if (v >= 11) return '#3b82f6'; 
    if (v >= 9)  return '#64748b'; 
    if (v >= 7)  return '#475569'; 
    if (v >= 5)  return '#f59e0b'; 
    if (v >= 3)  return '#f97316'; 
    return '#ef4444';             
}

function renderSkillMini(name, val) {
    const v = (val !== undefined && val !== null) ? val : '--';
    const color = getSkillColor(v);
    return `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; border-bottom: 1px solid rgba(0,0,0,0.03);">
            <span style="color: #64748b; font-weight: 500;">${name}</span>
            <span style="font-weight: 800; color: ${color};">${v}</span>
        </div>
    `;
}

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

// --- 2. LOGIKA MODALA TRANSFEROWEGO ---
function openTransferModal(player) {
    const modalHtml = `
        <div id="sell-player-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(12px);">
            <div style="background: #ffffff; width: 750px; border-radius: 32px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; max-height: 90vh;">
                <div style="background: #1a237e; padding: 35px; color: white; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.6em; font-weight: 900; letter-spacing: -0.5px;">LIST ON TRANSFER MARKET</h2>
                        <p style="margin: 4px 0 0 0; opacity: 0.6; font-size: 0.9em;">Player: ${player.first_name} ${player.last_name}</p>
                    </div>
                    <button id="close-modal-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 45px; height: 45px; border-radius: 14px; cursor: pointer; font-size: 1.5em;">&times;</button>
                </div>
                <div style="display: grid; grid-template-columns: 260px 1fr; overflow-y: auto;">
                    <div style="background: #f8fafc; padding: 35px; border-right: 1px solid #e2e8f0; text-align: center;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}" style="width: 120px; height: 120px; background: white; border-radius: 25px; border: 4px solid #1a237e; margin-bottom: 20px;">
                        <div style="font-weight: 900; font-size: 1.2em; color: #1e293b;">${player.last_name}</div>
                        <div style="color: #64748b; font-size: 0.85em; font-weight: 700; margin-top: 5px;">OVR ${player.overall_rating} | ${player.position}</div>
                    </div>
                    <div style="padding: 35px;">
                        <p style="font-size: 0.9em; color: #64748b;">Ustaw parametry sprzedaży dla tego zawodnika.</p>
                        <button id="confirm-listing" style="width: 100%; padding: 15px; background: #1a237e; color: white; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px;">WYSTAW NA RYNEK</button>
                    </div>
                </div>
            </div>
        </div>
        <style> @keyframes modalSlideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } } </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('close-modal-btn').onclick = () => document.getElementById('sell-player-modal').remove();
}

// --- 3. GŁÓWNA FUNKCJA RENDERUJĄCA WIDOK ---
export async function renderRosterView(teamData, players) {
    const container = document.getElementById('roster-view-container');
    if (!container) return;

    const safePlayers = Array.isArray(players) ? players : [];

    // Definiujemy funkcję w window, żeby onclick w tabeli zadziałał
    window.sellPlayer = (playerId) => {
        const player = safePlayers.find(p => String(p.id) === String(playerId));
        if (player) openTransferModal(player);
    };

    container.innerHTML = `
        <div class="roster-container" style="padding: 30px; background: #f4f7f6; min-height: 100vh; font-family: 'Inter', sans-serif;">
            <h1 style="color: #1a237e; font-weight: 800;">ROSTER MANAGEMENT</h1>
            
            <div style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden; margin-top: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f8f9fa; color: #94a3b8; font-size: 0.75em; text-transform: uppercase;">
                        <tr>
                            <th style="padding: 15px 25px; text-align: left;">Player</th>
                            <th style="padding: 15px; text-align: left;">Pos</th>
                            <th style="padding: 15px; text-align: left;">Age</th>
                            <th style="padding: 15px; text-align: left;">Salary</th>
                            <th style="padding: 15px; text-align: left;">Potential</th>
                            <th style="padding: 15px; text-align: left;">OVR</th>
                            <th style="padding: 15px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safePlayers.map(player => {
                            const pot = getPotentialLabel(player.potential);
                            const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}&backgroundColor=f0f2f5`;
                            return `
                                <tr style="border-bottom: 1px solid #f8f9fa;">
                                    <td style="padding: 20px 25px;">
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <img src="${avatarUrl}" style="width: 50px; height: 50px; border-radius: 10px;">
                                            <div>
                                                <div style="font-weight: 800; color: #1a237e;">${player.first_name} ${player.last_name}</div>
                                                <div style="font-size: 10px; color: #94a3b8;">${player.height || '--'} cm</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 15px;">${player.position}</td>
                                    <td style="padding: 15px;">${player.age}</td>
                                    <td style="padding: 15px; color: #2e7d32; font-weight: 600;">$${(player.salary || 0).toLocaleString()}</td>
                                    <td style="padding: 15px; color: ${pot.color}; font-weight: 800;">${pot.label}</td>
                                    <td style="padding: 15px;"><b style="background: #e8f5e9; padding: 5px 10px; border-radius: 8px;">${player.overall_rating}</b></td>
                                    <td style="padding: 15px; text-align: center;">
                                        <button onclick="window.sellPlayer('${player.id}')" style="background: #fee2e2; color: #ef4444; border: 1px solid #ef4444; padding: 5px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">SELL</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
