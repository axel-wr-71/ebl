// js/app/training_view.js
import { supabaseClient } from '../auth.js';

let currentCalendarDate = new Date();

export async function renderTrainingDashboard(teamData, players) {
    const appContainer = document.getElementById('app-main-view');
    if (!appContainer) return;

    // Fetch training history
    const { data: history } = await supabaseClient
        .from('training_history')
        .select('*')
        .eq('team_id', teamData.id)
        .order('training_date', { ascending: false });

    appContainer.innerHTML = `
        <div class="training-container" style="padding: 30px; color: #333; font-family: 'Inter', sans-serif; background: #f4f7f6; min-height: 100vh;">
            <header style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="font-size: 2.2em; font-weight: 800; color: #1a237e; margin:0;">TRAINING <span style="color: #e65100;">HUB</span></h1>
                    <p style="color: #666; margin: 5px 0 0 0;">Optimize performance for: <strong style="color: #1a237e;">${teamData.name}</strong></p>
                </div>
                <div style="background: #1a237e; color: white; padding: 12px 24px; border-radius: 50px; box-shadow: 0 4px 15px rgba(26, 35, 126, 0.2); font-weight: bold;">
                    🏀 ${teamData.name.toUpperCase()}
                </div>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px;">
                ${renderFocusCard('MONDAY', teamData.monday_training_focus)}
                ${renderFocusCard('FRIDAY', teamData.friday_training_focus)}
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px;">
                <div style="background: white; border-radius: 20px; padding: 30px; border: 1px solid #e0e0e0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <h3 style="margin-bottom: 25px; font-size: 1.1em; font-weight: 700; color: #1a237e; text-transform: uppercase; letter-spacing: 1px;">
                        🚀 Latest Impact
                    </h3>
                    <div id="player-training-list">
                        ${renderImprovedPlayers(players)}
                    </div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 30px; border: 1px solid #e0e0e0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div id="calendar-container">
                        ${renderCalendar(currentCalendarDate, history || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getNextTrainingDate(dayName) {
    const days = { 'MONDAY': 1, 'FRIDAY': 5 };
    const targetDay = days[dayName];
    let result = new Date();
    result.setDate(result.getDate() + (targetDay + 7 - result.getDay()) % 7);
    if (result <= new Date()) result.setDate(result.getDate() + 7);
    return result.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderFocusCard(day, currentFocus) {
    const focusOptions = {
        'SHARP_SHOOTER': { img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop', label: 'Sharp Shooter' },
        'PAINT_PROTECTOR': { img: 'https://images.unsplash.com/photo-1519861531473-920036214751?w=200&h=200&fit=crop', label: 'Paint Protector' },
        'PERIMETER_DEFENDER': { img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=200&h=200&fit=crop', label: 'Perimeter Def' },
        'PLAYMAKING_FOCUS': { img: 'https://images.unsplash.com/photo-1518063311540-30b8acb1d7a8?w=200&h=200&fit=crop', label: 'Playmaking' },
        'BIG_MAN_INSIDE': { img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop', label: 'Big Man Inside' },
        'ISOLATION_SCORER': { img: 'https://images.unsplash.com/photo-1466193341027-56e68017ee2d?w=200&h=200&fit=crop', label: 'ISO Scorer' }
    };

    const selected = focusOptions[currentFocus] || { img: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=200&h=200&fit=crop', label: 'Not Set' };
    const nextDate = getNextTrainingDate(day);

    return `
        <div style="background: white; padding: 25px; border-radius: 20px; border: 1px solid #e0e0e0; position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img id="focus-img-${day}" src="${selected.img}" style="width: 80px; height: 80px; border-radius: 15px; object-fit: cover; border: 3px solid #f0f2f5;">
                    <div>
                        <div style="font-size: 0.7em; color: #999; text-transform: uppercase; font-weight: bold;">${day} Session</div>
                        <div id="focus-label-${day}" style="font-size: 1.4em; font-weight: 800; color: #1a237e;">${selected.label}</div>
                        <div style="font-size: 0.8em; color: #e65100; font-weight: bold;">Next: ${nextDate}</div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <select onchange="window.updateTrainingFocus('${day}', this.value)" style="flex: 1; background: #f8f9fa; border: 1px solid #ddd; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer;">
                    ${Object.entries(focusOptions).map(([key, obj]) => `
                        <option value="${key}" ${currentFocus === key ? 'selected' : ''}>${obj.label}</option>
                    `).join('')}
                </select>
                <button onclick="window.saveTrainingManual('${day}')" style="background: #1a237e; color: white; border: none; padding: 0 20px; border-radius: 10px; font-weight: bold; cursor: pointer;">SAVE</button>
            </div>
        </div>
    `;
}

function renderImprovedPlayers(players) {
    const improved = players.filter(p => parseFloat(p.last_training_growth) > 0);
    if (improved.length === 0) return `<div style="text-align: center; color: #999; padding: 40px;">Waiting for next session data...</div>`;

    return improved.map(player => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8f9fa;">
            <div style="font-weight: 700; color: #333;">${player.last_name.toUpperCase()}</div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-family: monospace; font-weight: bold; color: #2ecc71;">+${parseFloat(player.last_training_growth).toFixed(3)}</div>
                <div style="width: 60px; height: 4px; background: #eee; border-radius: 2px;"><div style="width: 70%; height: 100%; background: #2ecc71;"></div></div>
            </div>
        </div>
    `).join('');
}

function renderCalendar(date, history) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return `
        <div style="text-align: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button onclick="window.changeMonth(-1)" style="border: 1px solid #eee; background: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;">&lt;</button>
                <h4 style="margin:0; font-weight: 800; color: #1a237e; text-transform: uppercase; font-size: 0.9em;">${monthNames[month]} ${year}</h4>
                <button onclick="window.changeMonth(1)" style="border: 1px solid #eee; background: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;">&gt;</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                ${['S','M','T','W','T','F','S'].map(d => `<div style="font-size: 0.7em; font-weight: 800; color: #ccc;">${d}</div>`).join('')}
                ${Array(firstDay).fill('<div></div>').join('')}
                ${Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasSession = history.some(h => h.training_date === dateStr);
                    return `<div style="height: 30px; display: flex; align-items: center; justify-content: center; font-size: 0.85em; border-radius: 6px; ${hasSession ? 'background: #e65100; color: white; font-weight: bold;' : 'color: #777'}">${day}</div>`;
                }).join('')}
            </div>
        </div>
    `;
}

// HANDLERS
window.updateTrainingFocus = (day, val) => {
    const focusOptions = {
        'SHARP_SHOOTER': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
        'PAINT_PROTECTOR': 'https://images.unsplash.com/photo-1519861531473-920036214751?w=200&h=200&fit=crop'
        // ... (dodaj pozostałe linki tutaj dla podglądu live)
    };
    document.getElementById(`focus-img-${day}`).src = focusOptions[val] || '';
};

window.saveTrainingManual = async (day) => {
    const select = document.querySelector(`select[onchange*="${day}"]`);
    const val = select.value;
    const column = day === 'MONDAY' ? 'monday_training_focus' : 'friday_training_focus';
    
    const { error } = await supabaseClient.from('teams').update({ [column]: val }).eq('id', window.userTeamId);
    if (!error) alert(`Training for ${day} saved!`);
};

window.changeMonth = (val) => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + val);
    // Logic to re-render or reload would go here
    location.reload(); 
};
