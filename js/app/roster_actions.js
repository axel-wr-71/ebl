// js/app/roster_actions.js

export const RosterActions = {
    // Uniwersalna funkcja do usuwania aktywnego modala
    closeModal: () => {
        const modal = document.getElementById('roster-modal-overlay');
        if (modal) modal.remove();
    },

    // 1. MODAL: PROFILE (Scouting Report)
    showProfile: (player, potLabel) => {
        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
                <div style="background:white; width:480px; border-radius:30px; padding:40px; position:relative; text-align:center; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                    <button onclick="document.getElementById('roster-modal-overlay').remove()" style="position:absolute; top:20px; right:20px; border:none; background:none; font-size:24px; cursor:pointer; color:#94a3b8;">&times;</button>
                    
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}" style="width:120px; height:120px; background:#f0f2f5; border-radius:50%; border:4px solid #1a237e; margin-bottom:20px;">
                    
                    <h2 style="margin:0; color:#1a237e; font-size:1.8em;">${player.first_name} ${player.last_name}</h2>
                    <p style="color:#64748b; font-weight:700; text-transform:uppercase; margin-top:5px;">
                        ${player.position} | AGE: ${player.age} | ${player.height || '--'}cm
                    </p>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:30px;">
                        <div style="background:#f8f9fa; padding:15px; border-radius:15px; border:1px solid #eee;">
                            <small style="color:#94a3b8; font-weight:800; display:block; margin-bottom:5px;">POTENTIAL CATEGORY</small>
                            <b style="color:${potLabel.color}; font-size:1.1em;">${potLabel.label}</b>
                        </div>
                        <div style="background:#f8f9fa; padding:15px; border-radius:15px; border:1px solid #eee;">
                            <small style="color:#94a3b8; font-weight:800; display:block; margin-bottom:5px;">CURRENT OVR</small>
                            <b style="color:#1a237e; font-size:1.3em;">${player.overall_rating}</b>
                        </div>
                    </div>

                    <div style="margin-top:20px; text-align:left; background:#fff9db; padding:15px; border-radius:12px; border:1px solid #fab005;">
                        <small style="font-weight:800; color:#862e00;">SCOUT NOTES:</small>
                        <p style="margin:5px 0 0 0; font-size:0.9em; color:#5c4100;">Player shows ${player.potential > 85 ? 'exceptional' : 'steady'} growth in current league conditions. High tactical discipline observed.</p>
                    </div>

                    <button onclick="document.getElementById('roster-modal-overlay').remove()" style="margin-top:30px; width:100%; padding:15px; background:#1a237e; color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer; transition:0.2s;">CLOSE REPORT</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 2. MODAL: TRAINING (Individual Focus)
    showTraining: (player) => {
        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
                <div style="background:white; width:450px; border-radius:30px; padding:40px; text-align:center; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                    <h2 style="color:#1a237e; margin-bottom:10px;">Individual Training</h2>
                    <p style="color:#64748b; margin-bottom:25px;">Select development focus for <b>${player.first_name} ${player.last_name}</b></p>
                    
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button onclick="alert('Shooting focus set!'); document.getElementById('roster-modal-overlay').remove()" style="padding:18px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left; display:flex; align-items:center; gap:15px; transition:0.2s;" onmouseover="this.style.borderColor='#3b82f6'">
                            <span style="font-size:20px;">🎯</span> 
                            <div>
                                <div style="color:#1a237e;">Offensive Specialist</div>
                                <small style="color:#94a3b8; font-weight:400;">Focus: 2PT, 3PT, Dunk, FT</small>
                            </div>
                        </button>

                        <button onclick="alert('Defense focus set!'); document.getElementById('roster-modal-overlay').remove()" style="padding:18px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left; display:flex; align-items:center; gap:15px; transition:0.2s;" onmouseover="this.style.borderColor='#3b82f6'">
                            <span style="font-size:20px;">🛡️</span> 
                            <div>
                                <div style="color:#1a237e;">Defensive Wall</div>
                                <small style="color:#94a3b8; font-weight:400;">Focus: Block, Steal, 1v1 Def, Reb</small>
                            </div>
                        </button>

                        <button onclick="alert('Playmaking focus set!'); document.getElementById('roster-modal-overlay').remove()" style="padding:18px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left; display:flex; align-items:center; gap:15px; transition:0.2s;" onmouseover="this.style.borderColor='#3b82f6'">
                            <span style="font-size:20px;">🏀</span> 
                            <div>
                                <div style="color:#1a237e;">Playmaker & Athleticism</div>
                                <small style="color:#94a3b8; font-weight:400;">Focus: Passing, Dribbling, Stamina</small>
                            </div>
                        </button>
                    </div>

                    <button onclick="document.getElementById('roster-modal-overlay').remove()" style="margin-top:25px; color:#94a3b8; background:none; border:none; cursor:pointer; font-weight:600; font-size:0.9em;">Maybe later</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 3. MODAL: SELL (Transfer Market)
    showSellConfirm: (player) => {
        const marketValue = (player.salary || 0) * 12;
        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
                <div style="background:white; width:420px; border-radius:30px; padding:40px; text-align:center; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                    <div style="width:70px; height:70px; background:#fee2e2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                        <span style="color:#ef4444; font-size:35px; font-weight:bold;">$</span>
                    </div>
                    <h2 style="color:#1a237e; margin:0;">Sell Player?</h2>
                    <p style="color:#64748b; margin-top:10px;">Are you sure you want to list <b>${player.first_name} ${player.last_name}</b> on the market?</p>
                    
                    <div style="margin:25px 0; padding:20px; background:#f0fdf4; border-radius:20px; border:1px solid #dcfce7;">
                        <small style="color:#166534; font-weight:800;">ESTIMATED MARKET VALUE</small><br>
                        <b style="color:#15803d; font-size:1.6em;">$${marketValue.toLocaleString()}</b>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <button onclick="document.getElementById('roster-modal-overlay').remove()" style="padding:15px; background:#f1f5f9; color:#64748b; border:none; border-radius:12px; font-weight:700; cursor:pointer;">CANCEL</button>
                        <button onclick="alert('Player listed on market!'); document.getElementById('roster-modal-overlay').remove()" style="padding:15px; background:#ef4444; color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer;">CONFIRM SELL</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
};
