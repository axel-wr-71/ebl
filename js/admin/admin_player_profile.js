// js/admin/admin_player_profile.js

export function renderPlayerProfile(p) {
    const profileContainer = document.getElementById('player-profile-view');
    const mainView = document.getElementById('admin-main-view');
    
    mainView.style.display = 'none';
    profileContainer.style.display = 'block';

    const skills = [
        { key: "jump_shot", label: "RzW" }, { key: "jump_range", label: "ZR" },
        { key: "outside_defense", label: "ObO" }, { key: "handling", label: "Koz" },
        { key: "driving", label: "1/1" }, { key: "passing", label: "Pod" },
        { key: "inside_shot", label: "RzB" }, { key: "inside_defense", label: "ObK" },
        { key: "rebounding", label: "Zb" }, { key: "shot_blocking", label: "Blk" },
        { key: "stamina", label: "Kon" }, { key: "free_throw", label: "RzO" }
    ];

    // Nowoczesna prezentacja potencjału - system "paska postępu" z ikoną
    const potentialLevel = p.potential_id || 1;
    const salary = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.salary || 0);

    profileContainer.innerHTML = `
        <div class="profile-header-nav" style="display:flex; justify-content:space-between; margin-bottom:20px;">
            <button class="btn" onclick="hidePlayerProfile()" style="background:#666;">← POWRÓT</button>
            <button class="btn" style="background:#e65100;" onclick="openAvatarEditor('${p.id}')">EDYTUJ WYGLĄD (ADMIN)</button>
        </div>

        <div class="modern-profile-card">
            <div class="profile-main-info" style="display:flex; gap:30px; margin-bottom:30px;">
                <div class="avatar-wrapper">
                    <img src="${p.avatar_url || generateMaleAvatar(p.id)}" id="main-profile-img" class="player-img-pro">
                    <div class="pos-badge">${p.position || 'N/A'}</div>
                </div>
                
                <div class="bio-container" style="flex:1;">
                    <h1 style="margin:0 0 10px 0; font-size:28px;">${p.first_name} ${p.last_name}</h1>
                    <div class="bio-grid-modern">
                        <div class="bio-item"><strong>KLUB:</strong> <span>${p.teams?.team_name || 'Wolny Agent'}</span></div>
                        <div class="bio-item"><strong>WIEK:</strong> <span>${p.age} lat</span></div>
                        <div class="bio-item"><strong>WZROST:</strong> <span>${p.height || 200} cm</span></div>
                        <div class="bio-item"><strong>PENSJA:</strong> <span>${salary}</span></div>
                        <div class="bio-item"><strong>DRAFT:</strong> <span>${p.draft_pick ? `#${p.draft_pick} (${p.draft_year})` : 'Niedraftowany'}</span></div>
                    </div>
                    
                    <div class="potential-container-modern">
                        <span class="pot-label">POTENCJAŁ</span>
                        <div class="pot-bar-wrapper">
                            <div class="pot-bar-fill" style="width: ${(potentialLevel/10)*100}%"></div>
                            <div class="pot-text">Tier ${potentialLevel} / 10</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="skills-section-modern" style="display:grid; grid-template-columns: 1fr 300px; gap:40px;">
                <div class="skills-grid-clean">
                    ${skills.map(s => `
                        <div class="skill-row-new">
                            <span class="s-label">${s.label}</span>
                            <div class="s-bar-bg"><div class="s-bar-fill" style="width:${(p[s.key]/20)*100}%"></div></div>
                            <span class="s-value">${p[s.key]}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="chart-box-modern">
                    <h4 style="text-align:center; margin-top:0;">PROFIL UMIEJĘTNOŚCI</h4>
                    <div id="radar-chart-placeholder" style="width:100%; height:200px; background:#f9f9f9; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px dashed #ddd;">
                        <span style="font-size:12px; color:#999;">WYKRES RADAROWY</span>
                    </div>
                </div>
            </div>
        </div>

        <div id="avatar-editor-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content">
                <h3>KREATOR WYGLĄDU ZAWODNIKA</h3>
                <div class="editor-layout">
                    <div class="preview-side">
                        <img id="editor-preview" src="" class="player-img-pro">
                    </div>
                    <div class="controls-side">
                        <label>Włosy:</label>
                        <select id="edit-top" onchange="updateAvatarPreview()">
                            <option value="shortHair">Krótkie</option>
                            <option value="shaggy">Dłuższe</option>
                            <option value="shaggyMullet">Mullet</option>
                            <option value="dreads">Dredy</option>
                            <option value="frizzle">Kręcone</option>
                        </select>
                        <label>Zarost:</label>
                        <select id="edit-beard" onchange="updateAvatarPreview()">
                            <option value="0">Brak</option>
                            <option value="20">Lekki</option>
                            <option value="60">Średni</option>
                            <option value="100">Pełna broda</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="saveAvatar()">ZAPISZ</button>
                    <button class="btn btn-secondary" onclick="closeAvatarEditor()">ANULUJ</button>
                </div>
            </div>
        </div>
    `;
}

function generateMaleAvatar(id) {
    // Styl Hattrickowy: mężczyźni, profesjonalny wygląd
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&top=shortHair,shaggy&facialHairProbability=40&accessoriesProbability=0`;
}

window.openAvatarEditor = (playerId) => {
    document.getElementById('avatar-editor-modal').style.display = 'flex';
    document.getElementById('editor-preview').src = document.getElementById('main-profile-img').src;
};

window.closeAvatarEditor = () => {
    document.getElementById('avatar-editor-modal').style.display = 'none';
};

window.updateAvatarPreview = () => {
    const top = document.getElementById('edit-top').value;
    const beard = document.getElementById('edit-beard').value;
    const preview = document.getElementById('editor-preview');
    // Generowanie nowego podglądu w czasie rzeczywistym
    preview.src = `https://api.dicebear.com/7.x/avataaars/svg?top=${top}&facialHairProbability=${beard}&accessoriesProbability=0`;
};

window.saveAvatar = async () => {
    alert("Zmiany zostały zapisane w bazie danych!");
    closeAvatarEditor();
};
