// js/app/roster_actions.js

export const RosterActions = {
    // Uniwersalna funkcja do usuwania aktywnego modala
    closeModal: () => {
        const modal = document.getElementById('roster-modal-overlay');
        if (modal) modal.remove();
    },

    // 1. MODAL: ROZBUDOWANY PROFIL (Statystyki, Nagrody, Historia Treningu)
    showProfile: (player, potLabel) => {
        // Symulacja danych historycznych (w przyszłości pobierane z bazy)
        const trainingHistory = [
            { date: '10.01', intensity: 85 },
            { date: '11.01', intensity: 40 },
            { date: '12.01', intensity: 95 },
            { date: '13.01', intensity: 60 },
            { date: '14.01', intensity: 75 },
            { date: '15.01', intensity: 90 }
        ];

        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(15px);">
                <div style="background:white; width:900px; max-height:90vh; border-radius:35px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 60px rgba(0,0,0,0.5);">
                    
                    <div style="background:#1a237e; color:white; padding:40px; display:flex; align-items:center; gap:30px; position:relative;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}" style="width:130px; height:130px; background:white; border-radius:25px; padding:5px; border:4px solid #3b82f6;">
                        <div style="text-align:left;">
                            <h1 style="margin:0; font-size:2.8em; font-weight:900;">${player.first_name} ${player.last_name}</h1>
                            <p style="margin:5px 0; opacity:0.8; font-size:1.1em;">${player.position} | ${player.height || '--'} cm | ${player.age} Years Old</p>
                            <div style="display:inline-block; background:${potLabel.color}; padding:6px 16px; border-radius:12px; font-weight:900; font-size:0.85em; margin-top:10px;">${potLabel.label}</div>
                        </div>
                        <button onclick="document.getElementById('roster-modal-overlay').remove()" style="position:absolute; top:30px; right:30px; background:none; border:none; color:white; font-size:35px; cursor:pointer;">&times;</button>
                    </div>

                    <div style="padding:40px; display:grid; grid-template-columns: 1fr 1fr; gap:40px; overflow-y:auto;">
                        
                        <div>
                            <h3 style="color:#1a237e; font-size:0.9em; letter-spacing:1px; border-bottom:2px solid #f0f2f5; padding-bottom:10px; margin-bottom:20px;">🏆 AWARDS & ACHIEVEMENTS</h3>
                            <div style="display:flex; gap:15px; margin-bottom:35px;">
                                <div title="Season MVP" style="font-size:35px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">🥇</div>
                                <div title="All-Star Team" style="font-size:35px;">⭐</div>
                                <div title="Top Scorer" style="font-size:35px;">🏀</div>
                                <div title="Rookie Status" style="font-size:35px; ${player.is_rookie ? '' : 'filter:grayscale(1); opacity:0.3;'}">💎</div>
                            </div>

                            <h3 style="color:#1a237e; font-size:0.9em; letter-spacing:1px; border-bottom:2px solid #f0f2f5; padding-bottom:10px; margin-bottom:20px;">📊 PLAYER METRICS</h3>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                                ${this._renderProfileMetric("Overall Rating", player.overall_rating, "#1a237e")}
                                ${this._renderProfileMetric("Potential Cap", player.potential, potLabel.color)}
                                ${this._renderProfileMetric("Stamina Level", player.skill_stamina, "#10b981")}
                                ${this._renderProfileMetric("Market Value", "$" + ((player.salary || 0)*12).toLocaleString(), "#2e7d32")}
                            </div>
                        </div>

                        <div style="background:#f8f9fa; padding:30px; border-radius:30px; border:1px solid #f0f0f0;">
                            <h3 style="color:#1a237e; font-size:0.9em; letter-spacing:1px; margin-bottom:25px;">⚡ TRAINING INTENSITY HISTORY</h3>
                            
                            <div style="display:flex; align-items:flex-end; justify-content:space-between; height:180px; padding-bottom:10px; border-bottom:2px solid #e2e8f0;">
                                ${trainingHistory.map(h => `
                                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10px;">
                                        <div style="width:70%; background:linear-gradient(to top, #3b82f6, #60a5fa); height:${h.intensity}%; border-radius:8px 8px 2px 2px; position:relative; min-height:5px;">
                                            <span style="position:absolute; top:-22px; width:100%; text-align:center; font-size:10px; font-weight:900; color:#1e40af;">${h.intensity}%</span>
                                        </div>
                                        <span style="font-size:10px; color:#94a3b8; font-weight:bold;">${h.date}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <p style="margin-top:20px; font-size:0.85em; color:#64748b; line-height:1.5;">
                                Wykres przedstawia zaangażowanie zawodnika w proces treningowy w ciągu ostatnich 6 sesji.
                            </p>
                        </div>

                    </div>

                    <div style="padding:20px 40px; background:#f8f9fa; text-align:right;">
                        <button onclick="document.getElementById('roster-modal-overlay').remove()" style="padding:12px 30px; background:#1a237e; color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer;">CLOSE PROFILE</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    _renderProfileMetric: (label, val, color) => `
        <div style="background:white; padding:15px; border-radius:15px; border:1px solid #e2e8f0;">
            <small style="color:#94a3b8; font-weight:800; text-transform:uppercase; font-size:0.7em;">${label}</small>
            <div style="color:${color}; font-size:1.4em; font-weight:900; margin-top:5px;">${val}</div>
        </div>
    `,

    // 2. MODAL: TRENING (Indywidualny)
    showTraining: (player) => {
        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
                <div style="background:white; width:450px; border-radius:30px; padding:40px; text-align:center;">
                    <h2 style="color:#1a237e; margin-bottom:10px;">Assign Training Focus</h2>
                    <p style="color:#64748b; margin-bottom:25px;">Improve <b>${player.first_name}</b>'s specific skill sets</p>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button onclick="alert('Shooting set'); document.getElementById('roster-modal-overlay').remove()" style="padding:15px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left;">🎯 Offensive Drill (Shooting/Finishing)</button>
                        <button onclick="alert('Defense set'); document.getElementById('roster-modal-overlay').remove()" style="padding:15px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left;">🛡️ Defensive Drill (Steals/Blocks)</button>
                        <button onclick="alert('Physical set'); document.getElementById('roster-modal-overlay').remove()" style="padding:15px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:15px; cursor:pointer; font-weight:700; text-align:left;">⚡ Physical & Stamina</button>
                    </div>
                    <button onclick="document.getElementById('roster-modal-overlay').remove()" style="margin-top:20px; color:#94a3b8; background:none; border:none; cursor:pointer; font-weight:600;">Cancel</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // 3. MODAL: RYNEK TRANSFEROWY (Zaawansowana Aukcja)
    showSellConfirm: (player) => {
        const marketValue = (player.salary || 0) * 12;

        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
                <div style="background:white; width:480px; border-radius:35px; padding:40px; text-align:center; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                    <h2 style="color:#1a237e; margin:0;">Transfer Market</h2>
                    <p style="color:#64748b; margin-top:5px;">Listing: <b>${player.first_name} ${player.last_name}</b></p>
                    
                    <div style="margin-top:30px; text-align:left; display:flex; flex-direction:column; gap:20px;">
                        
                        <div>
                            <label style="font-weight:800; font-size:0.75em; color:#94a3b8; text-transform:uppercase;">Auction Type</label>
                            <select id="market-auction-type" style="width:100%; padding:14px; border-radius:15px; border:2px solid #f0f2f5; font-weight:700; color:#1a237e; margin-top:8px;" onchange="window.updatePriceLabel(this.value)">
                                <option value="standard">Standard Auction (Bidding)</option>
                                <option value="instant">Instant Buy (Fixed Price)</option>
                                <option value="hybrid">Hybrid (Bidding + Buy Now)</option>
                            </select>
                        </div>

                        <div>
                            <label id="price-input-label" style="font-weight:800; font-size:0.75em; color:#94a3b8; text-transform:uppercase;">Starting Bid ($)</label>
                            <input type="number" id="market-price-input" value="${marketValue}" style="width:100%; padding:14px; border-radius:15px; border:2px solid #f0f2f5; font-weight:900; color:#2e7d32; font-size:1.3em; margin-top:8px; box-sizing:border-box;">
                        </div>

                        <div>
                            <label style="font-weight:800; font-size:0.75em; color:#94a3b8; text-transform:uppercase;">Duration</label>
                            <select id="market-duration" style="width:100%; padding:14px; border-radius:15px; border:2px solid #f0f2f5; font-weight:700; color:#1a237e; margin-top:8px;">
                                <option value="12">12 Hours</option>
                                <option value="24" selected>24 Hours</option>
                                <option value="48">48 Hours</option>
                                <option value="72">3 Days</option>
                            </select>
                        </div>

                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:35px;">
                        <button onclick="document.getElementById('roster-modal-overlay').remove()" style="padding:16px; background:#f1f5f9; color:#64748b; border:none; border-radius:15px; font-weight:700; cursor:pointer;">CANCEL</button>
                        <button onclick="window.submitListing('${player.id}')" style="padding:16px; background:#1a237e; color:white; border:none; border-radius:15px; font-weight:700; cursor:pointer;">LIST PLAYER</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // --- Logika dynamiczna modala aukcji ---
        window.updatePriceLabel = (type) => {
            const label = document.getElementById('price-input-label');
            if (type === 'instant') label.innerText = "Fixed Price ($)";
            else if (type === 'standard') label.innerText = "Starting Bid ($)";
            else label.innerText = "Min. Bidding Price ($)";
        };

        window.submitListing = (pid) => {
            const type = document.getElementById('market-auction-type').value;
            const price = document.getElementById('market-price-input').value;
            const time = document.getElementById('market-duration').value;
            
            // Tutaj nastąpi wysłanie do bazy danych
            console.log(`Sending to DB: Player ${pid}, Type: ${type}, Price: ${price}, Time: ${time}h`);
            alert(`Player listed successfully for $${price}!`);
            document.getElementById('roster-modal-overlay').remove();
        };
    }
};
