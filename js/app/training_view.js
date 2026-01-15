// js/app/training_view.js

export function renderTrainingDashboard(teamData, players) {
    const appContainer = document.getElementById('app-main-view');
    
    appContainer.innerHTML = `
        <div class="training-container" style="padding: 30px; color: white; font-family: 'Inter', sans-serif;">
            <header style="margin-bottom: 40px;">
                <h1 style="font-size: 2.5em; letter-spacing: -1px; font-weight: 800;">TRAINING <span style="color: #1DA1F2;">CENTER</span></h1>
                <p style="color: #666;">Manage your team development and weekly focus</p>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 50px;">
                ${renderScheduleCard('MONDAY', teamData.monday_focus)}
                ${renderScheduleCard('FRIDAY', teamData.friday_focus)}
            </div>

            <div style="background: #111; border-radius: 20px; padding: 25px; border: 1px solid #222;">
                <h3 style="margin-bottom: 20px; font-size: 1.2em; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #2ecc71;">●</span> ROSTER DEVELOPMENT
                </h3>
                <div id="player-training-list">
                    ${players.map(player => renderPlayerProgressRow(player)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderScheduleCard(day, currentFocus) {
    return `
        <div style="background: linear-gradient(145deg, #1a1a1a, #111); padding: 30px; border-radius: 25px; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="font-size: 0.8em; color: #555; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">${day} SESSION</div>
            <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 20px; color: #1DA1F2;">${currentFocus || 'NOT SET'}</div>
            
            <select onchange="updateTrainingFocus('${day}', this.value)" style="width: 100%; background: #000; color: white; border: 1px solid #444; padding: 12px; border-radius: 12px; cursor: pointer;">
                <option value="SHARP_SHOOTER">SHARP SHOOTER</option>
                <option value="PAINT_PROTECTOR">PAINT PROTECTOR</option>
                <option value="PERIMETER_DEFENDER">PERIMETER DEFENDER</option>
                <option value="PLAYMAKING_FOCUS">PLAYMAKING FOCUS</option>
                <option value="BIG_MAN_INSIDE">BIG MAN INSIDE</option>
                <option value="ISOLATION_SCORER">ISOLATION SCORER</option>
            </select>
        </div>
    `;
}

function renderPlayerProgressRow(player) {
    // Obliczamy procent postępu do pełnego punktu (np. z 14.20 postęp to 20%)
    const skillProgress = (val) => (val % 1) * 100;

    return `
        <div style="display: grid; grid-template-columns: 2fr 3fr 1fr; align-items: center; padding: 15px 0; border-bottom: 1px solid #222;">
            <div>
                <div style="font-weight: bold;">${player.last_name}</div>
                <div style="font-size: 0.75em; color: #555;">Age: ${player.age} | Pot: ${player.potential}</div>
            </div>
            
            <div style="padding: 0 20px;">
                <div style="font-size: 0.7em; color: #888; margin-bottom: 5px; text-transform: uppercase;">Focus Progress</div>
                <div style="width: 100%; height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${skillProgress(player.skill_2pt)}%; height: 100%; background: #1DA1F2; box-shadow: 0 0 10px #1DA1F2;"></div>
                </div>
            </div>

            <div style="text-align: right; font-family: 'Courier New', monospace; color: #2ecc71;">
                +0.04
            </div>
        </div>
    `;
}
