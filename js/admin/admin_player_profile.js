// js/admin/admin_player_profile.js
import { supabaseClient } from '../auth.js';

// --- ZAAWANSOWANY ALGORYTM GENEROWANIA TWARZY SVG (Realistyczny Styl Sportowy) ---
function generatePlayerSVG(config) {
    if (!config) config = { skin: 1, eyes: 0, nose: 0, mouth: 0, hair: 0, beard: 0 };
    
    const skinColors = ['#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524', '#C68642', '#71492E', '#442E1F'];
    const skin = skinColors[config.skin] || skinColors[1];
    const hairColor = "#1a1a1a";

    // Oczy z powiekami i źrenicami
    const eyes = [
        `<g transform="translate(33,45)"><path d="M-8 0 Q0 -6 8 0 Q0 6 -8 0" fill="white" stroke="#333" stroke-width="0.5"/><circle cx="0" cy="0" r="2.5" fill="#333"/><circle cx="1" cy="-1" r="0.8" fill="white"/></g>
         <g transform="translate(67,45)"><path d="M-8 0 Q0 -6 8 0 Q0 6 -8 0" fill="white" stroke="#333" stroke-width="0.5"/><circle cx="0" cy="0" r="2.5" fill="#333"/><circle cx="1" cy="-1" r="0.8" fill="white"/></g>`,
        `<g transform="translate(33,45)"><path d="M-8 0 Q0 -4 8 0" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round"/></g>
         <g transform="translate(67,45)"><path d="M-8 0 Q0 -4 8 0" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round"/></g>`
    ];

    // Bardziej anatomiczne nosy
    const noses = [
        `<path d="M47 48 Q50 62 54 55" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2" stroke-linecap="round"/>`,
        `<path d="M45 58 Q50 63 55 58" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>`,
        `<path d="M48 45 L50 60 L44 60" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>`
    ];

    // Usta z wargami
    const mouths = [
        `<path d="M40 78 Q50 85 60 78" fill="none" stroke="#844" stroke-width="2.5" stroke-linecap="round"/>`,
        `<path d="M42 80 L58 80" fill="none" stroke="#844" stroke-width="2" stroke-linecap="round"/>`,
        `<path d="M44 77 Q50 72 56 77" fill="none" stroke="#844" stroke-width="2" stroke-linecap="round"/>`
    ];

    // Sportowe fryzury
    const hairs = [
        '', // Łysy
        `<path d="M25 40 Q25 5 50 5 Q75 5 75 40 Q50 32 25 40" fill="${hairColor}"/>`, // Buzzcut
        `<path d="M22 40 Q20 -5 50 -5 Q80 -5 78 40 L80 45 Q50 25 20 45 Z" fill="${hairColor}"/>`, // Fade / High Top
        `<circle cx="50" cy="25" r="28" fill="${hairColor}" fill-opacity="0.9"/>`, // Afro
        `<path d="M25 35 L30 10 M40 30 L45 5 M55 30 L60 5 M70 35 L75 10" stroke="${hairColor}" stroke-width="5" stroke-linecap="round"/>` // Krótkie dredy
    ];

    return `
        <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <defs>
                <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="${skin}" />
                    <stop offset="100%" stop-color="${skin}" stop-opacity="0.85" />
                </radialGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <path d="M40 85 L40 100 Q50 105 60 100 L60 85" fill="${skin}" opacity="0.9"/>
            <path d="M25 40 Q25 10 50 10 Q75 10 75 40 L75 70 Q75 95 50 95 Q25 95 25 70 Z" fill="url(#skinGrad)" stroke="rgba(0,0,0,0.1)"/>
            
            ${eyes[config.eyes] || eyes[0]}
            ${noses[config.nose] || noses[0]}
            ${mouths[config.mouth] || mouths[0]}
            ${hairs[config.hair] || ''}
            
            <path d="M25 70 Q50 85 75 70" fill="none" stroke="black" opacity="0.05" stroke-width="4"/>
        </svg>
    `;
}

export function renderPlayerProfile(p) {
    const profileContainer = document.getElementById('player-profile-view');
    const mainView = document.getElementById('admin-main-view');
    if (!profileContainer || !mainView) return;

    mainView.style.display = 'none';
    profileContainer.style.display = 'block';

    const mainSkills = [
        { key: "jump_shot", label: "RzW" }, { key: "jump_range", label: "ZR" },
        { key: "outside_defense", label: "ObO" }, { key: "handling", label: "Koz" },
        { key: "driving", label: "1/1" }, { key: "passing", label: "Pod" },
        { key: "inside_shot", label: "RzB" }, { key: "inside_defense", label: "ObK" },
        { key: "rebounding", label: "Zb" }, { key: "shot_blocking", label: "Blk" }
    ];

    const physicalSkills = [
        { key: "stamina", label: "Kon" }, { key: "free_throw", label: "RzO" }
    ];

    const potentialLevel = p.potential_id || 1;
    const salaryFormatted = (p.salary || 0).toLocaleString('pl-PL') + " $";
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();

    profileContainer.innerHTML = `
        <div class="profile-header-nav" style="margin-bottom: 20px;">
            <button class="btn-back" onclick="hidePlayerProfile()">← POWRÓT DO BAZY</button>
        </div>

        <div class="modern-profile-card">
            <div class="profile-main-info">
                <div class="avatar-column">
                    <div class="avatar-wrapper" id="svg-container" style="width:180px; height:200px; border:3px solid #ddd; background:#f8f9fa; border-radius:15px; overflow:hidden;">
                        ${generatePlayerSVG(p.face_config)}
                    </div>
                    <button class="btn-edit-avatar-new" onclick='openAvatarEditor(${JSON.stringify(p)})'>⚙️ EDYTUJ WYGLĄD</button>
                </div>
                
                <div class="bio-container">
                    <h1 class="player-title">${getFlagEmoji(p.country)} ${fullName}</h1>
                    <div class="bio-grid-modern">
                        <div class="bio-item"><strong>KLUB</strong><span>${p.teams ? p.teams.team_name : 'Wolny Agent'}</span></div>
                        <div class="bio-item"><strong>POZYCJA</strong><span>${p.position || 'N/A'}</span></div>
                        <div class="bio-item"><strong>WIEK</strong><span>${p.age} lat</span></div>
                        <div class="bio-item"><strong>WZROST</strong><span>${p.height || 200} cm</span></div>
                        <div class="bio-item"><strong>PENSJA</strong><span>${salaryFormatted}</span></div>
                        <div class="bio-item"><strong>DRAFT</strong><span>${p.draft_pick ? `#${p.draft_pick}` : 'N/A'}</span></div>
                    </div>
                    <div class="potential-section">
                        <div class="pot-header"><span>POTENCJAŁ</span><span>Tier ${potentialLevel}/10</span></div>
                        <div class="pot-bar-wrapper"><div class="pot-bar-fill" style="width: ${(potentialLevel/10)*100}%"></div></div>
                    </div>
                </div>
            </div>

            <div class="skills-container-new">
                <h2 class="skills-title">UMIEJĘTNOŚCI</h2>
                <div class="skills-split-view">
                    <div class="skill-column">${mainSkills.slice(0, 5).map(s => renderSkillBar(s, p)).join('')}</div>
                    <div class="skill-column">${mainSkills.slice(5, 10).map(s => renderSkillBar(s, p)).join('')}</div>
                </div>
                <div class="skills-physical-row">${physicalSkills.map(s => renderSkillBar(s, p)).join('')}</div>
            </div>
        </div>

        <div id="avatar-editor-modal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;">
            <div class="modal-content" style="background:#fff; padding:30px; border-radius:15px; max-width:600px; width:95%; display:flex; gap:20px;">
                <div id="editor-preview-container" style="width:200px; height:220px; border:2px solid #ccc; background:#f0f0f0; border-radius:10px;"></div>
                <div style="flex:1;">
                    <h3>KREATOR WYGLĄDU</h3>
                    <div class="controls-side" style="display:flex; flex-direction:column; gap:12px;">
                        <label>Kolor Skóry:</label><input type="range" id="f-skin" min="0" max="6" oninput="updateFacePreview()">
                        <label>Fryzura:</label><input type="range" id="f-hair" min="0" max="4" oninput="updateFacePreview()">
                        <label>Oczy:</label><input type="range" id="f-eyes" min="0" max="1" oninput="updateFacePreview()">
                        <label>Nos:</label><input type="range" id="f-nose" min="0" max="2" oninput="updateFacePreview()">
                        <label>Usta:</label><input type="range" id="f-mouth" min="0" max="2" oninput="updateFacePreview()">
                    </div>
                    <div style="margin-top:20px; display:flex; gap:10px;">
                        <button class="btn-save" onclick="saveFaceConfig()" style="flex:1; padding:12px; background:#28a745; color:white; border:none; border-radius:5px; cursor:pointer;">ZAPISZ</button>
                        <button class="btn-cancel" onclick="closeAvatarEditor()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:5px; cursor:pointer;">ANULUJ</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSkillBar(s, p) {
    const val = p[s.key] || 0;
    const percent = (val / 20) * 100;
    return `
        <div class="skill-row-new">
            <span class="s-label">${s.label}</span>
            <div class="s-bar-bg"><div class="s-bar-fill" style="width:${percent}%"></div></div>
            <span class="s-value">${val}</span>
        </div>
    `;
}

function getFlagEmoji(country) {
    const flags = { "Poland": "🇵🇱", "USA": "🇺🇸", "Spain": "🇪🇸", "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹" };
    return flags[country] || "🏳️";
}

let currentEditingPlayerId = null;

window.openAvatarEditor = (p) => {
    currentEditingPlayerId = p.id;
    const config = p.face_config || { skin: 1, eyes: 0, nose: 0, mouth: 0, hair: 0 };
    document.getElementById('avatar-editor-modal').style.display = 'flex';
    document.getElementById('f-skin').value = config.skin;
    document.getElementById('f-hair').value = config.hair;
    document.getElementById('f-eyes').value = config.eyes;
    document.getElementById('f-nose').value = config.nose;
    document.getElementById('f-mouth').value = config.mouth;
    updateFacePreview();
};

window.updateFacePreview = () => {
    const config = {
        skin: parseInt(document.getElementById('f-skin').value),
        hair: parseInt(document.getElementById('f-hair').value),
        eyes: parseInt(document.getElementById('f-eyes').value),
        nose: parseInt(document.getElementById('f-nose').value),
        mouth: parseInt(document.getElementById('f-mouth').value)
    };
    document.getElementById('editor-preview-container').innerHTML = generatePlayerSVG(config);
};

window.saveFaceConfig = async () => {
    const config = {
        skin: parseInt(document.getElementById('f-skin').value),
        hair: parseInt(document.getElementById('f-hair').value),
        eyes: parseInt(document.getElementById('f-eyes').value),
        nose: parseInt(document.getElementById('f-nose').value),
        mouth: parseInt(document.getElementById('f-mouth').value)
    };
    const { error } = await supabaseClient.from('players').update({ face_config: config }).eq('id', currentEditingPlayerId);
    if (!error) {
        document.getElementById('svg-container').innerHTML = generatePlayerSVG(config);
        closeAvatarEditor();
        alert("Zapisano!");
    } else {
        alert("Błąd: " + error.message);
    }
};

window.closeAvatarEditor = () => { document.getElementById('avatar-editor-modal').style.display = 'none'; };
window.hidePlayerProfile = () => {
    document.getElementById('player-profile-view').style.display = 'none';
    document.getElementById('admin-main-view').style.display = 'block';
};
