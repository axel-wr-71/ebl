// js/app/training_view.js
import { supabaseClient } from '../auth.js';

/**
 * Zaktualizowany moduł treningowy:
 * - 12 zawodników (pełny skład)
 * - Indywidualne profile treningowe
 * - Sekcja Personelu (Offense, Defense, General)
 * - Kalendarz i Historia
 */
export async function renderTrainingDashboard(teamData, players, currentWeek = 0) {
    const appContainer = document.getElementById('app-main-view');
    if (!appContainer) return;

    try {
        // Pobieranie historii treningów dla kalendarza
        const { data: history } = await supabaseClient
            .from('training_history')
            .select('*')
            .eq('team_id', teamData.id)
            .order('training_date', { ascending: false });

        const isOffSeason = currentWeek >= 15;

        appContainer.innerHTML = `
            <div class="training-container" style="padding: 30px; font-family: 'Inter', sans-serif; background: #f4f7f6; min-height: 100vh;">
                
                <header style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="font-size: 2em; font-weight: 900; color: #1a237e; margin:0;">CENTRE DE FORMATION</h1>
                        <p style="margin:5px 0 0 0; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                            Season 1 • <span style="color: #e65100;">Week ${currentWeek}</span> • ${getWeekStatusLabel(currentWeek)}
                        </p>
                    </div>
                    <div style="background: white; padding: 15px 25px; border-radius: 12px; border: 1px solid #e0e0e0; text-align: right;">
                        <div style="font-size: 0.7em; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Weekly Session Count</div>
                        <div style="font-size: 1.2em; font-weight: 900; color: #1a237e;">5 / 5 Sessions</div>
                    </div>
                </header>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                    ${renderStaffMember('OFFENSE', 'Technical Specialist', teamData.coach_offense_lvl || 1, '#e65100')}
                    ${renderStaffMember('DEFENSE', 'Defensive Coordinator', teamData.coach_defense_lvl || 1, '#1a237e')}
                    ${renderStaffMember('GENERAL', 'Performance Coach', teamData.coach_general_lvl || 1, '#455a64')}
                </div>

                <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 30px;">
                    
                    <div style="background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.02); overflow: hidden;">
                        <div style="padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin:0; font-size: 0.9em; font-weight: 800; color: #1a237e; text-transform: uppercase;">Player Training Focus (Full Roster)</h3>
                            <span style="font-size: 0.75em; color: #64748b;">Max 3 players per position</span>
                        </div>
                        <div style="max-height: 600px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #ffffff; position: sticky; top: 0; z-index: 10;">
                                    <tr style="text-align: left; font-size: 0.7em; color: #94a3b8; border-bottom: 1px solid #f1f5f9;">
                                        <th style="padding: 15px 20px;">PLAYER</th>
                                        <th style="padding: 15px 20px;">SKILL SET FOCUS</th>
                                        <th style="padding: 15px 20px; text-align: right;">EST. GROWTH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${players.slice(0, 12).map(p => renderPlayerRow(p, isOffSeason)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        <div style="background: white; border-radius: 20px; padding: 25px; border: 1px solid #e2e8f0;">
                            <h3 style="margin: 0 0 20px 0; font-size: 0.9em; font-weight: 800; color: #1a237e; text-transform: uppercase;">Activity Calendar</h3>
                            ${renderCalendar(currentCalendarDate, history || [])}
                        </div>

                        <div style="background: white; border-radius: 20px; padding: 25px; border: 1px solid #e2e8f0;">
                            <h3 style="margin: 0 0 15px 0; font-size: 0.9em; font-weight: 800; color: #1a237e; text-transform: uppercase;">Latest Progress Logs</h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${renderSimpleLogs(players)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Critical Render Error:", err);
    }
}

function renderStaffMember(title, role, lvl, color) {
    return `
        <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; background: ${color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1.2em;">${lvl}</div>
            <div>
                <div style="font-size: 0.75em; font-weight: 800; color: ${color};">${title}</div>
                <div style="font-size: 0.85em; font-weight: 700; color: #1a237e;">${role}</div>
            </div>
        </div>
    `;
}

function renderPlayerRow(p, isLocked) {
    const growth = ((p.is_rookie ? 0.08 : 0.05) * (p.potential_cat === 'GOAT' ? 1.5 : 1)).toFixed(3);
    
    return `
        <tr style="border-bottom: 1px solid #f8fafc; transition: background 0.2s;" onmouseover="this.style.background='#fcfdfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px 20px;">
                <div style="font-weight: 800; color: #1a237e; font-size: 0.9em;">${p.last_name}</div>
                <div style="font-size: 0.7em; color: #94a3b8;">${p.position} | Age: ${p.age} | ${p.potential_cat}</div>
            </td>
            <td style="padding: 15px 20px;">
                <select onchange="window.saveTrainingFocus(${p.id}, this.value)" ${isLocked ? 'disabled' : ''} 
                    style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.8em; font-weight: 600; background: #fff; cursor: pointer;">
                    <option value="GENERAL" ${p.current_training_focus === 'GENERAL' ? 'selected' : ''}>General Training</option>
                    <option value="OFFENSE" ${p.current_training_focus === 'OFFENSE' ? 'selected' : ''}>Offensive Skills</option>
                    <option value="DEFENSE" ${p.current_training_focus === 'DEFENSE' ? 'selected' : ''}>Defensive Drills</option>
                    <option value="PHYSICAL" ${p.current_training_focus === 'PHYSICAL' ? 'selected' : ''}>Strength & Conditioning</option>
                </select>
            </td>
            <td style="padding: 15px 20px; text-align: right;">
                <span style="font-family: monospace; font-weight: 900; color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 6px; font-size: 0.85em;">+${growth}</span>
            </td>
        </tr>
    `;
}

function renderCalendar(date, history) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return `
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center;">
            ${['S','M','T','W','T','F','S'].map(d => `<div style="font-size: 0.65em; font-weight: 800; color: #94a3b8; padding-bottom: 10px;">${d}</div>`).join('')}
            ${Array(firstDay).fill('<div></div>').join('')}
            ${Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasSession = history.some(h => h.training_date === dateStr);
                return `<div style="height: 28px; line-height: 28px; font-size: 0.75em; border-radius: 5px; ${hasSession ? 'background: #1a237e; color: white; font-weight: bold;' : 'color: #64748b'}">${day}</div>`;
            }).join('')}
        </div>
    `;
}

function renderSimpleLogs(players) {
    return players.filter(p => p.last_training_growth > 0).slice(0, 5).map(p => `
        <div style="display: flex; justify-content: space-between; font-size: 0.8em; padding: 8px 0; border-bottom: 1px dotted #e2e8f0;">
            <span style="font-weight: 700; color: #1a237e;">${p.last_name}</span>
            <span style="color: #059669; font-weight: 800;">+${parseFloat(p.last_training_growth).toFixed(3)} EXP</span>
        </div>
    `).join('') || '<div style="font-size: 0.8em; color: #94a3b8; text-align: center;">No sessions recorded today.</div>';
}

function getWeekStatusLabel(week) {
    if (week === 0) return "Pre-season Friendlies";
    if (week === 6) return "All-Star Event";
    if (week >= 11 && week <= 14) return "Playoff Intensity";
    if (week === 15) return "Off-season / Draft";
    return "Regular Season Training";
}

// --- WINDOW FUNCTIONS ---
window.saveTrainingFocus = async (playerId, focus) => {
    try {
        const { error } = await supabaseClient
            .from('players')
            .update({ current_training_focus: focus })
            .eq('id', playerId);
        if (error) throw error;
        console.log(`Focus updated for player ${playerId}: ${focus}`);
    } catch (e) { console.error("Error updating focus:", e); }
};
