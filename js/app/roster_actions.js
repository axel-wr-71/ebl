// js/app/roster_actions.js

export const RosterActions = {
    closeModal: () => {
        const modal = document.getElementById('roster-modal-overlay');
        if (modal) modal.remove();
    },

    showProfile: (player, potLabel) => {
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
                                <div title="Season MVP" style="font-size:35px;">🥇</div>
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

    // 3. MODAL: RYNEK TRANSFEROWY (Zaktualizowany)
    showSellConfirm: (player) => {
        const marketValue = (player.salary || 0) * 12;

        const modalHtml = `
            <div id="roster-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,10,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(12px);">
                <div style="background:white; width:550px; border-radius:40px; padding:0; position:relative; overflow:hidden; box-shadow:0 30px 70px rgba(0,0,0,0.6);">
                    
                    <button onclick="document.getElementById('roster-modal-overlay').remove()" style="position:absolute; top:25px; right:25px; background:#f1f5f9; border:none; width:40px; height:40px; border-radius:50%; font-size:22px; cursor:pointer; color:#64748b; z-index:10; display:flex; align-items:center; justify-content:center;">&times;</button>

                    <div style="padding:40px 40px 20px 40px; text-align:center; background:linear-gradient(to bottom, #f8fafc, white);">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${player.last_name}" style="width:100px; height:100px; background:white; border-radius:50%; border:3px solid #1a237e; margin-bottom:15px;">
                        <h2 style="color:#1a237e; margin:0; font-size:1.8em;">${player.first_name} ${player.last_name}</h2>
                        <div style="display:flex; justify-content:center; gap:10px; margin-top:8px; color:#64748b; font-weight:700; font-size:0.9em; text-transform:uppercase; letter-spacing:1px;">
                            <span>${player.position}</span> • <span>${player.age} yrs</span> • <span>${player.height || '--'}cm</span>
                        </div>
                    </div>

                    <div style="padding:0 40px 40px 40px;">
                        <h3 style="color:#94a3b8; font-size:0.75em; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">1. Select Auction Type</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:25px;">
                            ${this._renderTypeCard('standard', 'Bidding', '🔨', true)}
                            ${this._renderTypeCard('instant', 'Instant', '⚡', false)}
                            ${this._renderTypeCard('hybrid', 'Hybrid', '⚖️', false)}
                        </div>

                        <div id="price-fields-container" style="display:grid; grid-template-columns:1fr; gap:15px; margin-bottom:25px;">
                            <div id="bid-field">
                                <label style="font-weight:800; font-size:0.75em; color:#94a3b8; text-transform:uppercase;">Starting Bid ($)</label>
                                <input type="number" id="market-price-bid" value="${marketValue}" style="width:100%; padding:14px; border-radius:15px; border:2px solid #f1f5f9; font-weight:900; color:#1a237e; font-size:1.1em; margin-top:5px; box-sizing:border-box;">
                            </div>
                            <div id="buy-field" style="display:none;">
                                <label style="font-weight:800; font-size:0.75em; color:#94a3b8; text-transform:uppercase;">Buy Now Price ($)</label>
                                <input type="number" id="market-price-buy" value="${Math.round(marketValue * 1.5)}" style="width:100%; padding:14px; border-radius:15px; border:2px solid #f1f5f9; font-weight:900; color:#059669; font-size:1.1em; margin-top:5px; box-sizing:border-box;">
                            </div>
                        </div>

                        <h3 style="color:#94a3b8; font-size:0.75em; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">2. Duration</h3>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom:35px;">
                            ${this._renderDurationCard('12', '12h')}
                            ${this._renderDurationCard('24', '24h', true)}
                            ${this._renderDurationCard('48', '48h')}
                            ${this._renderDurationCard('72', '3d')}
                        </div>

                        <button onclick="window.submitListing('${player.id}')" style="width:100%; padding:20px; background:#1a237e; color:white; border:none; border-radius:20px; font-weight:800; font-size:1.1em; cursor:pointer; transition:0.3s; box-shadow:0 10px 20px rgba(26,35,126,0.3);">LIST ON MARKET</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // --- Logika wyboru kafelków ---
        window.selectAuctionType = (type, el) => {
            document.querySelectorAll('.auction-type-card').forEach(c => {
                c.style.borderColor = '#f1f5f9';
                c.style.background = 'white';
            });
            el.style.borderColor = '#1a237e';
            el.style.background = '#f8fafc';
            el.dataset.selected = "true";

            const bidF = document.getElementById('bid-field');
            const buyF = document.getElementById('buy-field');
            
            if(type === 'standard') { bidF.style.display = 'block'; buyF.style.display = 'none'; }
            else if(type === 'instant') { bidF.style.display = 'none'; buyF.style.display = 'block'; }
            else { bidF.style.display = 'block'; buyF.style.display = 'block'; }
        };

        window.selectDuration = (val, el) => {
            document.querySelectorAll('.duration-card').forEach(c => {
                c.style.background = '#f1f5f9';
                c.style.color = '#64748b';
            });
            el.style.background = '#1a237e';
            el.style.color = 'white';
            el.dataset.value = val;
        };

        window.submitListing = async (pid) => {
            const selectedCard = Array.from(document.querySelectorAll('.auction-type-card')).find(c => c.style.borderColor === 'rgb(26, 35, 126)');
            const type = selectedCard ? selectedCard.dataset.type : 'standard';
            const priceBid = document.getElementById('market-price-bid').value;
            const priceBuy = document.getElementById('market-price-buy').value;
            const duration = Array.from(document.querySelectorAll('.duration-card')).find(c => c.style.background === 'rgb(26, 35, 126)').dataset.value;

            console.log(`DB Action: Player ${pid}, Type: ${type}, Bid: ${priceBid}, BuyNow: ${priceBuy}, Time: ${duration}h`);
            alert('Transfer Listed!');
            document.getElementById('roster-modal-overlay').remove();
        };
    },

    _renderTypeCard: (type, label, emoji, active) => `
        <div class="auction-type-card" data-type="${type}" onclick="window.selectAuctionType('${type}', this)" style="cursor:pointer; padding:15px; border-radius:15px; border:2px solid ${active ? '#1a237e' : '#f1f5f9'}; text-align:center; transition:0.2s; background:${active ? '#f8fafc' : 'white'};">
            <div style="font-size:1.5em; margin-bottom:5px;">${emoji}</div>
            <div style="font-size:0.8em; font-weight:800; color:#1a237e;">${label}</div>
        </div>
    `,

    _renderDurationCard: (val, label, active) => `
        <div class="duration-card" data-value="${val}" onclick="window.selectDuration('${val}', this)" style="cursor:pointer; padding:12px; border-radius:12px; background:${active ? '#1a237e' : '#f1f5f9'}; color:${active ? 'white' : '#64748b'}; font-weight:800; text-align:center; transition:0.2s; font-size:0.85em;">
            ${label}
        </div>
    `
};
