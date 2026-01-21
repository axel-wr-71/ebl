/**
 * js/app/training_view.js
 * Zarządzanie widokiem treningu zawodników
 */
import { supabaseClient } from '../auth.js';

// --- LOGIKA POMOCNICZA ---

function getNextDayOfWeek(dayName) {
    const days = { 'Monday': 1, 'Friday': 5 };
    const targetDay = days[dayName];
    const now = new Date();
    const resultDate = new Date(now.getTime());
    resultDate.setDate(now.getDate() + (7 + targetDay - now.getDay()) % 7);
    return resultDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}

function calculateTotalSkills(p) {
    const skills = [
        p.skill_2pt, p.skill_3pt, p.skill_dunk, p.skill_ft, p.skill_passing, 
        p.skill_dribbling, p.skill_stamina, p.skill_rebound, p.skill_block, 
        p.skill_steal, p.skill_1on1_off, p.skill_1on1_def
    ];
    return skills.reduce((a, b) => (a || 0) + (parseInt(b) || 0), 0);
}

function getFlagUrl(countryCode) {
    if (!countryCode) return '';
    const code = String(countryCode).toLowerCase().trim();
    const finalCode = (code === 'el') ? 'gr' : code;
    return `https://flagcdn.com/w40/${finalCode}.png`;
}

// 8 Treningów z ukrytymi wybranymi skillami w opisie
const AVAILABLE_DRILLS = [
    { id: 'T_OFF_FB', name: 'Fast Break Mastery', skills: ['Dribbling', 'Passing'] },
    { id: 'T_DEF_PL', name: 'Perimeter Lockdown', skills: ['1on1 Def', 'Stealing', 'Stamina'] },
    { id: 'T_DEF_PP', name: 'Paint Protection', skills: ['Blocking', '1on1 Def'] },
    { id: 'T_OFF_MO', name: 'Motion Offense', skills: ['Passing', '2pt Shot', '3pt Shot'] },
    { id: 'T_OFF_PR', name: 'Pick & Roll Logic', skills: ['Passing', 'Dribbling', '2pt Shot'] },
    { id: 'T_SHOOT', name: 'Sharp Shooter Hub', skills: ['3pt Shot', 'Free Th.'] },
    { id: 'T_PHYS', name: 'Iron Defense', skills: ['Stealing', 'Blocking', 'Stamina'] },
    { id: 'T_TRANS', name: 'Transition Game', skills: ['Dribbling', 'Stamina', 'Passing'] }
];

export async function renderTrainingView(team, players) {
    const container = document.getElementById('training-view-container');
    if (!container) return;

    // Pobieranie danych systemowych z obiektu team (zgodnie z SQL)
    const currentWeek = team.current_week || 1;
    const currentSeason = team.current_season || 1;
    const staffEff = ((team.coach_general_lvl || 0) * 2.5).toFixed(1);

    let html = `
        <div class="training-header" style="padding: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 style="margin:0; font-weight:900; color:#1a237e; letter-spacing:-1px; font-size: 2rem;">TRAINING <span style="color:#e65100">CENTER</span></h1>
                <p style="margin:0; color:#64748b; font-weight: 500;">Season ${currentSeason} | Week ${currentWeek} | Team Practice Management</p>
            </div>
            <div style="text-align: right;">
                <span style="background:#f1f5f9; padding: 8px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color:#1e293b; border: 1px solid #e2e8f0;">
                    STAFF EFFICIENCY: <span style="color:#059669">+${staffEff}%</span>
                </span>
            </div>
        </div>

        <div style="margin: 0 25px 30px 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            
            <div style="background: #1a237e; border-radius: 20px; padding: 25px; color: white; box-shadow: 0 10px 25px rgba(26,35,126,0.2);">
                <div style="margin-bottom: 15px;">
                    <h3 style="margin:0; text-transform: uppercase; color: #ffab40; font-size: 0.9rem;">Monday (${getNextDayOfWeek('Monday')})</h3>
                </div>
                <select id="sel-mon" style="width: 100%; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-weight: 700; margin-bottom: 15px;">
                    ${AVAILABLE_DRILLS.map(d => `<option value="${d.id}" ${team.monday_training_focus === d.id ? 'selected' : ''} style="color: black;">${d.name}</option>`).join('')}
                </select>
                <button onclick="window.saveWeeklyDrill('${team.id}', 'monday')" style="width: 100%; padding: 12px; border-radius: 10px; border: none; background: #ffab40; color: #1a237e; font-weight: 900; cursor: pointer; text-transform: uppercase; font-size: 0.8rem;">Save Monday Plan</button>
            </div>

            <div style="background: #1e293b; border-radius: 20px; padding: 25px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 15px;">
                    <h3 style="margin:0; text-transform: uppercase; color: #38bdf8; font-size: 0.9rem;">Friday (${getNextDayOfWeek('Friday')})</h3>
                </div>
                <select id="sel-fri" style="width: 100%; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-weight: 700; margin-bottom: 15px;">
                    ${AVAILABLE_DRILLS.map(d => `<option value="${d.id}" ${team.friday_training_focus === d.id ? 'selected' : ''} style="color: black;">${d.name}</option>`).join('')}
                </select>
                <button onclick="window.saveWeeklyDrill('${team.id}', 'friday')" style="width: 100%; padding: 12px; border-radius: 10px; border: none; background: #38bdf8; color: white; font-weight: 900; cursor: pointer; text-transform: uppercase; font-size: 0.8rem;">Save Friday Plan</button>
            </div>

        </div>

        <div style="margin: 0 25px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                <thead>
                    <tr style="text-align: left; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">
                        <th style="padding: 10px 25px;">Player & Potential</th>
                        <th style="padding: 10px; text-align: center;">Skill Points</th>
                        <th style="padding: 10px;">Individual Drill (Thu)</th>
                        <th style="padding: 10px; text-align: right;">Growth</th>
                    </tr>
                </thead>
                <tbody>
                    ${players.map(p => {
                        const currentTotal = calculateTotalSkills(p);
                        const maxCap = p.max_total_cap || 240;
                        const progressPercent = Math.min((currentTotal / maxCap) * 100, 100);
                        
                        return `
                        <tr style="background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-radius: 16px;">
                            <td style="padding: 18px 25px; border-radius: 16px 0 0 16px; border: 1px solid #f1f5f9; border-right: none;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}" style="width: 45px; height: 45px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
                                    <div>
                                        <div style="font-weight: 800; color: #1a237e; font-size: 0.95rem;">
                                            ${p.first_name} ${p.last_name} <img src="${getFlagUrl(p.country)}" style="width:14px; vertical-align:middle;">
                                        </div>
                                        <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase;">
                                            ${p.position} • OVR ${p.overall_rating}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 18px 10px; text-align: center;">
                                <div style="font-size: 0.85rem; font-weight: 900; color: #1e293b;">${currentTotal} / ${maxCap}</div>
                                <div style="width: 100px; height: 6px; background: #f1f5f9; border-radius: 10px; margin: 5px auto; overflow: hidden; border: 1px solid #e2e8f0;">
                                    <div style="width: ${progressPercent}%; height: 100%; background: #1a237e;"></div>
                                </div>
                            </td>
                            <td style="padding: 18px 10px;">
                                <select onchange="window.updatePlayerFocus('${p.id}', this.value)" 
                                        style="width: 100%; padding: 8px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 700; color: #1a237e; background: #f8fafc;">
                                    <option value="GENERAL" ${p.individual_training_skill === 'GENERAL' ? 'selected' : ''}>General</option>
                                    <option value="OFFENSE" ${p.individual_training_skill === 'OFFENSE' ? 'selected' : ''}>Offense</option>
                                    <option value="DEFENSE" ${p.individual_training_skill === 'DEFENSE' ? 'selected' : ''}>Defense</option>
                                    <option value="PHYSICAL" ${p.individual_training_skill === 'PHYSICAL' ? 'selected' : ''}>Physical</option>
                                </select>
                            </td>
                            <td style="padding: 18px 25px; text-align: right; border-radius: 0 16px 16px 0; border: 1px solid #f1f5f9; border-left: none;">
                                <div style="font-weight: 900; color: #059669; font-family: monospace;">+${(p.last_training_growth || 0).toFixed(3)}</div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

window.saveWeeklyDrill = async (teamId, day) => {
    // Sprawdzanie blokady 24h
    const now = new Date();
    // Tutaj można dodać zaawansowaną logikę sprawdzania daty następnego przeliczenia z bazy
    
    const selectId = day === 'monday' ? 'sel-mon' : 'sel-fri';
    const drillId = document.getElementById(selectId).value;
    const dbColumn = day === 'monday' ? 'monday_training_focus' : 'friday_training_focus';

    try {
        const { error } = await supabaseClient
            .from('teams')
            .update({ [dbColumn]: drillId })
            .eq('id', teamId);
        
        if (error) throw error;
        alert(`${day.toUpperCase()} plan updated!`);
    } catch (err) {
        console.error("Update error:", err.message);
    }
};

window.updatePlayerFocus = async (playerId, focusValue) => {
    try {
        await supabaseClient
            .from('players')
            .update({ individual_training_skill: focusValue })
            .eq('id', playerId);
    } catch (err) {
        console.error("Player update error:", err.message);
    }
};
