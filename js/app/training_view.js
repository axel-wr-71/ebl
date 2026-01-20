import { supabaseClient } from '../auth.js';

export const TrainingView = {
    render: async () => {
        const appContainer = document.getElementById('app-main-view');
        if (!appContainer) return;

        const teamId = window.gameState?.teamId;
        const currentSeason = window.gameState?.currentSeason || 1;

        try {
            // Pobieramy dane: Zespół (z trenerem), Gracze, Historia
            const { data: teamData } = await supabaseClient.from('teams').select('*, coaches(*)').eq('id', teamId).single();
            const { data: players } = await supabaseClient.from('players').select('*').eq('team_id', teamId).order('pos_order', { ascending: true });
            const { data: history } = await supabaseClient.from('player_training_history').select('*, players(last_name)').eq('team_id', teamId).limit(10).order('created_at', { ascending: false });

            const coach = teamData.coaches || { coach_name: "Assistant Coach", specialty: "GENERAL", coaching_level: 2 };

            appContainer.innerHTML = `
                <div style="padding: 30px; background: #f0f2f5; min-height: 100vh; font-family: -apple-system, sans-serif;">
                    
                    <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px;">
                        <div>
                            <h1 style="font-size: 2.5rem; font-weight: 900; color: #1e293b; margin: 0;">TRAINING <span style="color: #3b82f6;">HUB</span></h1>
                            <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px; background: white; padding: 10px 20px; border-radius: 15px; border: 1px solid #e2e8f0;">
                                <div style="font-size: 1.5rem;">👨‍🏫</div>
                                <div>
                                    <div style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Head Coach</div>
                                    <div style="font-weight: 800; color: #1e293b;">${coach.coach_name} <span style="color: #3b82f6;">(Spec: ${coach.specialty})</span></div>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right; color: #64748b; font-weight: 700;">Season ${currentSeason}</div>
                    </header>

                    <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 30px;">
                        
                        <div style="display: flex; flex-direction: column; gap: 30px;">
                            
                            <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                ${renderTeamFocusCard('MONDAY', teamData.monday_training_focus, coach)}
                                ${renderTeamFocusCard('FRIDAY', teamData.friday_training_focus, coach)}
                            </section>

                            <section style="background: white; border-radius: 30px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                                <h2 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 20px; color: #1e293b;">Player Individual Focus</h2>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    ${players.map(p => renderPlayerRow(p, currentSeason)).join('')}
                                </div>
                            </section>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 30px;">
                            <div style="background: white; border-radius: 30px; padding: 25px; border: 1px solid #e2e8f0;">
                                <h3 style="font-size: 0.9rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 20px;">Development Log</h3>
                                ${history?.map(h => `
                                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc;">
                                        <span style="font-weight: 700; color: #1e293b;">${h.players.last_name}</span>
                                        <span style="color: #10b981; font-weight: 800;">+${h.amount} ${h.skill_increased}</span>
                                    </div>
                                `).join('') || 'Waiting for first session...'}
                            </div>

                            <div style="background: #1e293b; color: white; border-radius: 30px; padding: 25px;">
                                <div id="training-calendar-mini"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) { console.error(e); }
    }
};

function renderTeamFocusCard(day, currentFocus, coach) {
    const options = {
        'SHOOTING': { label: 'Sharp Shooter', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800' },
        'DEFENSE': { label: 'Iron Defense', img: 'https://images.unsplash.com/photo-1519861531473-920036214751?auto=format&fit=crop&q=80&w=800' },
        'PHYSICAL': { label: 'Elite Conditioning', img: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800' },
        'PLAYMAKING': { label: 'Tactical Play', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' }
    };

    const active = options[currentFocus] || options['SHOOTING'];
    const isSynergy = coach.specialty === currentFocus;

    return `
        <div style="position: relative; height: 300px; border-radius: 25px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.2); transition: 0.3s;">
            <img src="${active.img}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 60%);"></div>
            
            <div style="position: absolute; top: 20px; right: 20px;">
                ${isSynergy ? `<div style="background: #ef4444; color: white; padding: 5px 12px; border-radius: 10px; font-weight: 900; font-size: 0.7rem; animation: pulse 2s infinite;">🔥 COACH SYNERGY +15%</div>` : ''}
            </div>

            <div style="position: absolute; bottom: 25px; left: 25px; right: 25px;">
                <div style="font-size: 0.7rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; margin-bottom: 5px;">${day} SESSION</div>
                <div style="font-size: 1.5rem; font-weight: 900; color: white; margin-bottom: 15px;">${active.label}</div>
                
                <div style="display: flex; gap: 10px;">
                    <select onchange="window.updateTeamTraining('${day}', this.value)" style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); color: white; padding: 10px; border-radius: 12px; font-weight: 700; outline: none;">
                        ${Object.entries(options).map(([key, val]) => `<option value="${key}" ${currentFocus === key ? 'selected' : ''}>${val.label}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerRow(p, season) {
    const isRookie = p.age <= 19;
    const isLocked = p.training_locked_season >= season;
    
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: #f8fafc; border-radius: 20px; border: 1px solid #f1f5f9;">
            <div style="width: 180px;">
                <div style="font-weight: 800; color: #1e293b;">${p.last_name} ${isRookie ? '👶' : ''}</div>
                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700;">${p.position} | POT: ${p.potential}</div>
            </div>
            <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                <select id="ind-focus-${p.id}" ${isLocked ? 'disabled' : ''} style="padding: 8px; border-radius: 10px; border: 1px solid #e2e8f0; font-weight: 700; font-size: 0.8rem;">
                    <option value="skill_3pt" ${p.individual_training_skill === 'skill_3pt' ? 'selected' : ''}>3PT Shooting</option>
                    <option value="skill_1on1_def" ${p.individual_training_skill === 'skill_1on1_def' ? 'selected' : ''}>Individual Defense</option>
                    <option value="skill_passing" ${p.individual_training_skill === 'skill_passing' ? 'selected' : ''}>Playmaking</option>
                </select>
                ${!isLocked ? `<button onclick="window.saveIndTraining('${p.id}')" style="background:#1e293b; color:white; border:none; padding:8px 15px; border-radius:10px; font-weight:800; font-size:0.7rem; cursor:pointer;">LOCK</button>` : `<span style="color:#10b981; font-weight:800; font-size:0.7rem;">ACTIVE</span>`}
            </div>
            <div style="width: 60px; text-align: right; font-family: monospace; font-weight: 800; color: #3b82f6;">
                +${parseFloat(p.last_training_growth || 0).toFixed(2)}
            </div>
        </div>
    `;
}

// Globalne akcje
window.updateTeamTraining = async (day, value) => {
    // Tutaj update Supabase i TrainingView.render()
    console.log(`Updating ${day} to ${value}`);
};

window.saveIndTraining = async (id) => {
    const skill = document.getElementById(`ind-focus-${id}`).value;
    // Tutaj wywołanie RosterActions.saveTraining(id, skill)
};
