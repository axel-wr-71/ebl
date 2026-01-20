import { supabaseClient } from '../auth.js';

export const TrainingView = {
    render: async () => {
        // Zmiana: Celujemy w dedykowany kontener sekcji, nie w main-view
        const container = document.getElementById('training-view-container');
        if (!container) return;

        const teamId = window.gameState?.teamId;
        const currentSeason = window.gameState?.currentSeason || 1;

        try {
            // Pobieramy dane
            const { data: teamData } = await supabaseClient
                .from('teams')
                .select('*, coaches(*)')
                .eq('id', teamId)
                .single();

            const { data: players } = await supabaseClient
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .order('pos_order', { ascending: true });

            const { data: history } = await supabaseClient
                .from('player_training_history')
                .select('*, players(last_name)')
                .eq('team_id', teamId)
                .limit(8)
                .order('created_at', { ascending: false });

            const coach = teamData.coaches || { coach_name: "Assistant Coach", specialty: "GENERAL" };

            // Renderowanie HTML - usunięte sztywne wysokości i tła, aby pasowało do Drag & Drop
            container.innerHTML = `
                <div style="padding: 20px; font-family: 'Inter', sans-serif;">
                    
                    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <div>
                            <h2 style="font-size: 1.8rem; font-weight: 900; color: #1a237e; margin: 0;">TRAINING <span style="color: #e65100;">HUB</span></h2>
                            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: 600; font-size: 0.85rem;">Zarządzaj rozwojem składu w Sezonie ${currentSeason}</p>
                        </div>
                        <div style="background: white; padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 1.2rem;">👨‍🏫</span>
                            <div>
                                <div style="font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Trener główny</div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">${coach.coach_name} <span style="color: #e65100;">[${coach.specialty}]</span></div>
                            </div>
                        </div>
                    </header>

                    <div style="display: grid; grid-template-columns: 1fr 350px; gap: 20px;">
                        
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            
                            <section style="display: flex; flex-direction: column; gap: 15px;">
                                ${renderTeamFocusCard('MONDAY', teamData.monday_training_focus, coach)}
                                ${renderTeamFocusCard('FRIDAY', teamData.friday_training_focus, coach)}
                            </section>

                            <section style="background: white; border-radius: 20px; padding: 25px; border: 1px solid #e2e8f0;">
                                <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 20px; color: #1e293b; display: flex; justify-content: space-between;">
                                    <span>Indywidualny Fokus</span>
                                    <span style="font-size: 0.75rem; color: #94a3b8;">${players.length}/12 Graczy</span>
                                </h3>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    ${players.map(p => renderPlayerRow(p, currentSeason)).join('')}
                                </div>
                            </section>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div style="background: white; border-radius: 20px; padding: 20px; border: 1px solid #e2e8f0;">
                                <h3 style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px;">Ostatnie Postępy</h3>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    ${history?.length > 0 ? history.map(h => `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 0.85rem;">
                                            <span style="font-weight: 700; color: #1e293b;">${h.players.last_name}</span>
                                            <span style="color: #10b981; font-weight: 800;">+${h.amount} ${h.skill_increased}</span>
                                        </div>
                                    `).join('') : '<p style="font-size:0.8rem; color:#94a3b8;">Oczekiwanie na pierwszą sesję...</p>'}
                                </div>
                            </div>

                            <div style="background: #1a237e; color: white; border-radius: 20px; padding: 20px; text-align: center;">
                                <div style="font-size: 0.7rem; font-weight: 800; opacity: 0.7; text-transform: uppercase; margin-bottom: 10px;">Intensywność Treningu</div>
                                <div style="font-size: 2rem; font-weight: 900;">HIGH</div>
                                <div style="font-size: 0.65rem; margin-top: 10px; color: #fbbf24;">⚠️ Zwiększone ryzyko kontuzji (+5%)</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("[Training] Render error:", e);
        }
    }
};

function renderTeamFocusCard(day, currentFocus, coach) {
    const options = {
        'SHOOTING': { label: 'Trening Strzelecki', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800' },
        'DEFENSE': { label: 'Defensywa i Zbiórki', img: 'https://images.unsplash.com/photo-1519861531473-920036214751?w=800' },
        'PHYSICAL': { label: 'Przygotowanie Fizyczne', img: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=800' },
        'PLAYMAKING': { label: 'Taktyka i Rozgrywanie', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800' }
    };

    const active = options[currentFocus] || options['SHOOTING'];
    const isSynergy = coach.specialty === currentFocus;

    return `
        <div style="position: relative; height: 160px; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <img src="${active.img}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.4);">
            <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(26,35,126,0.8) 0%, rgba(0,0,0,0) 100%);"></div>
            
            <div style="position: absolute; top: 15px; right: 15px;">
                ${isSynergy ? `<div style="background: #e65100; color: white; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 0.6rem;">🔥 SYNERGIA TRENERA +15%</div>` : ''}
            </div>

            <div style="position: absolute; top: 0; bottom: 0; left: 20px; display: flex; flex-direction: column; justify-content: center; width: 60%;">
                <div style="font-size: 0.65rem; font-weight: 800; color: #fbbf24; text-transform: uppercase;">SESJA: ${day}</div>
                <div style="font-size: 1.2rem; font-weight: 900; color: white; margin-bottom: 10px;">${active.label}</div>
                
                <select onchange="window.updateTeamTraining('${day}', this.value)" 
                    style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; outline: none; width: fit-content;">
                    ${Object.entries(options).map(([key, val]) => `<option value="${key}" ${currentFocus === key ? 'selected' : ''} style="color: black;">Zmień na: ${val.label}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

function renderPlayerRow(p, season) {
    const isRookie = p.is_rookie || p.age <= 19; // Wsparcie dla flagi is_rookie
    const isLocked = p.training_locked_season >= season;
    
    return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 12px; width: 220px;">
                <div style="width: 32px; height: 32px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; color: #64748b;">${p.position}</div>
                <div>
                    <div style="font-weight: 800; color: #1e293b; font-size: 0.85rem;">${p.last_name} ${isRookie ? '<span title="Rookie">👶</span>' : ''}</div>
                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">Wiek: ${p.age} | POT: ${p.potential}</div>
                </div>
            </div>
            
            <div style="flex: 1; display: flex; align-items: center; gap: 10px; justify-content: flex-end; padding-right: 20px;">
                <select id="ind-focus-${p.id}" ${isLocked ? 'disabled' : ''} 
                    style="padding: 5px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 700; font-size: 0.75rem; background: white;">
                    <option value="skill_3pt" ${p.individual_training_skill === 'skill_3pt' ? 'selected' : ''}>Rzuty 3pkt</option>
                    <option value="skill_1on1_def" ${p.individual_training_skill === 'skill_1on1_def' ? 'selected' : ''}>Obrona 1v1</option>
                    <option value="skill_passing" ${p.individual_training_skill === 'skill_passing' ? 'selected' : ''}>Rozgrywanie</option>
                </select>
                ${!isLocked 
                    ? `<button onclick="window.saveIndTraining('${p.id}')" style="background:#1a237e; color:white; border:none; padding:6px 12px; border-radius:8px; font-weight:800; font-size:0.65rem; cursor:pointer;">ZABLOKUJ</button>` 
                    : `<span style="color:#10b981; font-weight:800; font-size:0.65rem; padding: 6px 12px;">AKTYWNY</span>`
                }
            </div>

            <div style="width: 50px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #1a237e; font-size: 0.8rem;">
                +${parseFloat(p.last_training_growth || 0).toFixed(2)}
            </div>
        </div>
    `;
}

// Globalne akcje (wymagane dla onclick w Safari)
window.updateTeamTraining = async (day, value) => {
    try {
        const teamId = window.gameState?.teamId;
        const column = day === 'MONDAY' ? 'monday_training_focus' : 'friday_training_focus';
        
        await supabaseClient.from('teams').update({ [column]: value }).eq('id', teamId);
        TrainingView.render(); // Re-render
    } catch (err) { console.error(err); }
};

window.saveIndTraining = async (id) => {
    try {
        const skill = document.getElementById(`ind-focus-${id}`).value;
        const currentSeason = window.gameState?.currentSeason || 1;

        await supabaseClient.from('players').update({ 
            individual_training_skill: skill,
            training_locked_season: currentSeason 
        }).eq('id', id);
        
        TrainingView.render();
    } catch (err) { console.error(err); }
};
