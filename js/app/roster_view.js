// js/app/roster_view.js
import { supabaseClient } from '../auth.js';

// --- 1. FUNKCJE POMOCNICZE (KOLORY I SKILLE) ---

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

// --- 2. LOGIKA MODALI (PROFIL I SPRZEDAŻ) ---

function openProfileModal(player) {
    const pot = getPotentialLabel(player.potential);
    const modalHtml = `
        <div id="active-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px);">
            <div style="background:white; width:450px; border-radius:25px; padding:30px; position:relative; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:15px; right:15px; border:none; background:none; font-size:24px; cursor:pointer; color:#94a3b8;">&times;</button>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}" style="width:100px; height:100px; background:#f0f2f5; border-radius:50%; border:3px solid #1a237e; margin-bottom:15px;">
                <h2 style="margin:0; color:#1a237e;">${player.first_name} ${player.last_name}</h2>
                <p style="color:#64748b; font-weight:600; margin:5px 0;">${player.position} | AGE: ${player.age} | ${player.height}cm</p>
                <div style="background:#f8f9fa; padding:20px; border-radius:15px; margin-top:20px; display:flex; justify-content:space-around; border:1px solid #f0f0f0;">
                    <div><small style="color:#94a3b8; font-weight:700; text-transform:uppercase;">Potential</small><br><b style="color:${pot.color}">${pot.label}</b></div>
                    <div><small style="color:#94a3b8; font-weight:700; text-transform:uppercase;">Current OVR</small><br><b style="color:#1a237e; font-size:1.2em;">${player.overall_rating}</b></div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top:25px; width:100%; padding:12px; background:#1a237e; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; transition: 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">CLOSE REPORT</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openSellModal(player) {
    const suggestedPrice = (player.salary || 0) * 12; // Przykładowa logika wyceny
    const modalHtml = `
        <div id="active-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px);">
            <div style="background:white; width:400px; border-radius:25px; padding:30px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <div style="width:60px; height:60px; background:#fef2f2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                    <span style="color:#ef4444; font-size:30px;">$</span>
                </div>
                <h2 style="margin:0; color:#1a237e;">Sell Player?</h2>
                <p style="color:#64748b;">Are you sure you want to list <b>${player.first_name} ${player.last_name}</b> on the transfer market?</p>
                
                <div style="margin:20px 0; padding:15px; background:#f8f9fa; border-radius:12px;">
                    <small style="color:#94a3b8; font-weight:700;">ESTIMATED VALUE</small><br>
                    <b style="color:#2e7d32; font-size:1.4em;">$${suggestedPrice.toLocaleString()}</b>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding:12px; background:#f1f5f9; color:#64748b; border:none; border-radius:10px; font-weight:700; cursor:pointer;">CANCEL</button>
                    <button onclick="alert('Player listed on market!'); this.parentElement.parentElement.parentElement.remove()" style="padding:12px; background:#ef4444; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">CONFIRM SELL</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --- 3. RENDEROWANIE WIERSZA ---

function renderPlayerRowInternal(player, potLabel) {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}&backgroundColor=f0f2f5`;
    const currentOvr = player.overall_rating || 0;
    const maxPot = player.potential || 1;
    const progressWidth = Math.min(Math.round((currentOvr / maxPot) * 100), 100);

    return `
        <tr style="border-bottom: 1px solid #f8f9fa; transition: 0.2s;" onmouseover="this.style.background='#fcfdfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 20px 25px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 800; color: #1a237e; font-size: 1.1em;">${player.first_name} ${player.last_name}</span>
                        ${player.is_rookie ? '<span style="background:#ef4444; color:white; font-size:9px; padding:2px 6px; border-radius:4px; font-weight:900;">ROOKIE</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <img src="${avatarUrl}" style="width: 60px; height: 60px; border-radius: 12px; border: 1px solid #e0e0e0; background: #fff;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f8f9fa; padding: 12px; border-radius: 12px; border: 1px solid #f0f0f0; flex-grow: 1; max-width: 400px;">
                            <div>
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Attack</div>
                                ${renderSkillMini('2PT', player.skill_2pt)}
                                ${renderSkillMini('3PT', player.skill_3pt)}
                                ${renderSkillMini('Dunk', player.skill_dunk)}
                                ${renderSkillMini('Pass', player.skill_passing)}
                            </div>
                            <div>
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Defense</div>
                                ${renderSkillMini('1v1 Def', player.skill_1on1_def)}
                                ${renderSkillMini('Reb', player.skill_rebound)}
                                ${renderSkillMini('Block', player.skill_block)}
                                ${renderSkillMini('Steal', player.skill_steal)}
                            </div>
                            <div>
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">General</div>
                                ${renderSkillMini('1v1 Off', player.skill_1on1_off)}
                                ${renderSkillMini('Dribble', player.skill_dribbling)}
                                ${renderSkillMini('Stamina', player.skill_stamina)}
                                ${renderSkillMini('FT', player.skill_ft)}
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            <td style="padding: 15px;"><div style="font-size: 0.85em; font-weight: 600; color: #444; background: #f0f2f5; display: inline-block; padding: 4px 12px; border-radius: 20px;">${player.position}</div></td>
            <td style="padding: 15px; color: #666; font-weight: 600;">${player.age}</td>
            <td style="padding: 15px; color: #666; font-weight: 600;">${player.height || '--'} cm</td>
            <td style="padding: 15px; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #2e7d32; font-size: 0.9em;">$${(player.salary || 0).toLocaleString()}</td>
            <td style="padding: 15px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 800; color: ${potLabel.color}; font-size: 0.8em; white-space: nowrap;">${potLabel.label}</span>
                    <div style="width: 80px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progressWidth}%; height: 100%; background: ${potLabel.color};"></div>
                    </div>
                    <span style="font-size: 9px; font-weight: 700; color: #94a3b8;">${progressWidth}% cap</span>
                </div>
            </td>
            <td style="padding: 15px;"><div style="width: 45px; height: 45px; border-radius: 12px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1em; border: 2px solid #c8e6c9;">${player.overall_rating || 0}</div></td>
            <td style="padding: 15px; text-align: center;">
                <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
                    <button onclick="window.sellPlayer('${player.id}')" style="width: 100px; background: #fee2e2; border: 1px solid #ef4444; padding: 6px 0; border-radius: 8px; color: #ef4444; font-weight: 700; cursor: pointer; font-size: 0.7em; transition: 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='white'">SELL</button>
                    <button onclick="window.showPlayerProfile('${player.id}')" style="width: 100px; background: white; border: 1px solid #1a237e; padding: 6px 0; border-radius: 8px; color: #1a237e; font-weight: 700; cursor: pointer; font-size: 0.7em; transition: 0.2s;" onmouseover="this.style.background='#1a237e'; this.style.color='white'">PROFILE</button>
                </div>
            </td>
        </tr>
    `;
}

// --- 4. GŁÓWNA FUNKCJA WIDOKU ---

export async function renderRosterView(teamData, players) {
    const container = document.getElementById('roster-view-container');
    if (!container) return;

    const safePlayers = Array.isArray(players) ? players : [];

    // Podpięcie logiki przycisków pod globalny obiekt window
    window.sellPlayer = (playerId) => {
        const player = safePlayers.find(p => String(p.id) === String(playerId));
        if (player) openSellModal(player);
    };

    window.showPlayerProfile = (playerId) => {
        const player = safePlayers.find(p => String(p.id) === String(playerId));
        if (player) openProfileModal(player);
    };

    container.innerHTML = `
        <div style="padding: 30px; background: #f4f7f6; min-height: 100vh; font-family: 'Inter', sans-serif;">
            <h1 style="color: #1a237e; font-weight: 800; margin-bottom: 20px;">ROSTER MANAGEMENT</h1>
            
            <div style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f8f9fa; color: #94a3b8; font-size: 0.75em; text-transform: uppercase;">
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
                        ${safePlayers.map(p => {
                            const potLabel = getPotentialLabel(p.potential);
                            return renderPlayerRowInternal(p, potLabel);
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
