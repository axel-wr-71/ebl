import { supabaseClient } from '../auth.js';

// --- LOGIKA POMOCNICZA ---

/**
 * Oblicza datę najbliższego dnia tygodnia i sprawdza blokadę 24h
 */
function getTrainingDayInfo(dayName) {
    const days = { 'Monday': 1, 'Friday': 5 };
    const targetDay = days[dayName];
    const now = new Date();
    
    const trainingDate = new Date(now.getTime());
    trainingDate.setDate(now.getDate() + (7 + targetDay - now.getDay()) % 7);
    trainingDate.setHours(9, 0, 0, 0); // Zakładamy start treningu o 09:00 rano

    const diffInMs = trainingDate - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const isLocked = diffInHours < 24 && diffInHours > 0;

    return {
        formattedDate: trainingDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
        isLocked: isLocked,
        hoursLeft: Math.max(0, Math.floor(diffInHours))
    };
}

function calculateTotalSkills(p) {
    const skills = [
        p.skill_2pt, p.skill_3pt, p.skill_dunk, p.skill_ft, p.skill_passing, 
        p.skill_dribbling, p.skill_stamina, p.skill_rebound, p.skill_block, 
        p.skill_steal, p.skill_1on1_off, p.skill_1on1_def
    ];
    return skills.reduce((a, b) => (a || 0) + (parseInt(b) || 0), 0);
}

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

    const monInfo = getTrainingDayInfo('Monday');
    const friInfo = getTrainingDayInfo('Friday');
    const staffEff = ((team.coach_general_lvl || 0) * 2.5).toFixed(1);

    let html = `
        <div class="training-header" style="padding: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 style="margin:0; font-weight:900; color:#1a237e; letter-spacing:-1px; font-size: 2rem;">TRAINING <span style="color:#e65100">CENTER</span></h1>
                <p style="margin:0; color:#64748b; font-weight: 500;">Season ${team.current_season} | Week ${team.current_week} | Team Practice</p>
            </div>
            <div style="text-align: right;">
                <span style="background:#f1f5f9; padding: 8px 15px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color:#1e293b; border: 1px solid #e2e8f0;">
                    STAFF EFFICIENCY: <span style="color:#059669">+${staffEff}%</span>
                </span>
            </div>
        </div>

        <div style="margin: 0 25px 30px 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            ${renderDayColumn('Monday', monInfo, team.monday_training_focus, team.id)}
            ${renderDayColumn('Friday', friInfo, team.friday_training_focus, team.id)}
        </div>

        <div style="margin: 0 25px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                <thead>
                    <tr style="text-align: left; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase;">
                        <th style="padding: 10px 25px;">Player</th>
                        <th style="padding: 10px; text-align: center;">Skill Points</th>
                        <th style="padding: 10px;">Individual Focus (Thu)</th>
                        <th style="padding: 10px; text-align: right;">Growth</th>
                    </tr>
                </thead>
                <tbody>
                    ${players.map(p => renderPlayerRow(p)).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderDayColumn(day, info, currentFocus, teamId) {
    const bgColor = day === 'Monday' ? '#1a237e' : '#1e293b';
    const accentColor = day === 'Monday' ? '#ffab40' : '#38bdf8';
    
    return `
        <div style="background: ${bgColor}; border-radius: 24px; padding: 25px; color: white; position: relative; ${info.isLocked ? 'opacity: 0.8;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin:0; text-transform: uppercase; color: ${accentColor}; font-size: 0.9rem; letter-spacing: 1px;">${day} (${info.formattedDate})</h3>
                ${info.isLocked ? '<span style="font-size: 0.6rem; background: #ef4444; padding: 4px 8px; border-radius: 6px;">LOCKED</span>' : ''}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                ${AVAILABLE_DRILLS.map(d => `
                    <button 
                        onclick="window.selectDrill('${teamId}', '${day.toLowerCase()}', '${d.id}')"
                        ${info.isLocked ? 'disabled' : ''}
                        style="padding: 10px; border-radius: 12px; border: 1px solid ${currentFocus === d.id ? accentColor : 'rgba(255,255,255,0.1)'}; 
                        background: ${currentFocus === d.id ? accentColor : 'rgba(255,255,255,0.05)'}; 
                        color: ${currentFocus === d.id ? (day === 'Monday' ? '#1a237e' : 'white') : 'white'};
                        font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                        ${d.name}
                    </button>
                `).join('')}
            </div>

            <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); text-align: center;">
                ${info.isLocked ? `Locked: Training starts in ${info.hoursLeft}h` : 'Changes auto-save on click'}
            </div>
        </div>
    `;
}

function renderPlayerRow(p) {
    const currentTotal = calculateTotalSkills(p);
    const maxCap = p.max_total_cap || 240;
    const progressPercent = Math.min((currentTotal / maxCap) * 100, 100);

    return `
        <tr style="background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-radius: 16px;">
            <td style="padding: 15px 25px; border-radius: 16px 0 0 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}" style="width: 35px; height: 35px; border-radius: 8px;">
                    <div style="font-weight: 800; color: #1a237e; font-size: 0.85rem;">${p.first_name} ${p.last_name}</div>
                </div>
            </td>
            <td style="text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 900;">${currentTotal} / ${maxCap}</div>
                <div style="width: 80px; height: 5px; background: #f1f5f9; border-radius: 10px; margin: 4px auto; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: #1a237e;"></div>
                </div>
            </td>
            <td>
                <select onchange="window.updatePlayerFocus('${p.id}', this.value)" 
                        style="width: 100%; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.7rem; font-weight: 700;">
                    <option value="GENERAL" ${p.individual_training_skill === 'GENERAL' ? 'selected' : ''}>General</option>
                    <option value="OFFENSE" ${p.individual_training_skill === 'OFFENSE' ? 'selected' : ''}>Offense</option>
                    <option value="DEFENSE" ${p.individual_training_skill === 'DEFENSE' ? 'selected' : ''}>Defense</option>
                    <option value="PHYSICAL" ${p.individual_training_skill === 'PHYSICAL' ? 'selected' : ''}>Physical</option>
                </select>
            </td>
            <td style="padding-right: 25px; text-align: right; border-radius: 0 16px 16px 0;">
                <div style="font-weight: 900; color: #059669; font-size: 0.8rem;">+${(p.last_training_growth || 0).toFixed(3)}</div>
            </td>
        </tr>
    `;
}

// --- AKCJE ---

window.selectDrill = async (teamId, day, drillId) => {
    const dbColumn = day === 'monday' ? 'monday_training_focus' : 'friday_training_focus';
    
    const { error } = await supabaseClient
        .from('teams')
        .update({ [dbColumn]: drillId })
        .eq('id', teamId);
    
    if (!error) {
        // Ponowne renderowanie widoku, aby pokazać zaznaczony przycisk (lub odświeżenie danych w SPA)
        alert(`${day.toUpperCase()} focus updated!`);
        location.reload(); // Prosty sposób na odświeżenie UI
    }
};

window.updatePlayerFocus = async (playerId, focusValue) => {
    await supabaseClient.from('players').update({ individual_training_skill: focusValue }).eq('id', playerId);
};
