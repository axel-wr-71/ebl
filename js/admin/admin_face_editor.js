// js/admin/admin_face_editor.js

// Definicje kształtów SVG (uproszczone przykłady - styl Hattrick)
const FACE_FEATURES = {
    skin: ['#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524'],
    eyes: [
        '<circle cx="35" cy="45" r="3" fill="black"/><circle cx="65" cy="45" r="3" fill="black"/>', // Kropki
        '<path d="M30 45 Q35 40 40 45" fill="none" stroke="black"/><path d="M60 45 Q65 40 70 45" fill="none" stroke="black"/>' // Łuki
    ],
    nose: [
        '<path d="M50 45 L50 55 L45 55" fill="none" stroke="black"/>', // L-kształtny
        '<path d="M48 55 Q50 58 52 55" fill="none" stroke="black"/>' // Mały łuk
    ],
    mouth: [
        '<path d="M40 70 Q50 75 60 70" fill="none" stroke="black"/>', // Uśmiech
        '<path d="M42 72 L58 72" fill="none" stroke="black"/>' // Płaska linia
    ]
};

export function generatePlayerSVG(config) {
    // config to np. { skin: 0, eyes: 1, nose: 0, mouth: 0 }
    return `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <path d="M20 40 Q20 10 50 10 Q80 10 80 40 L80 70 Q80 90 50 90 Q20 90 20 70 Z" fill="${FACE_FEATURES.skin[config.skin]}"/>
            ${FACE_FEATURES.eyes[config.eyes]}
            ${FACE_FEATURES.nose[config.nose]}
            ${FACE_FEATURES.mouth[config.mouth]}
        </svg>
    `;
}

export function renderFaceEditor(player) {
    const config = player.face_config || { skin: 0, eyes: 0, nose: 0, mouth: 0 };
    
    return `
        <div class="hattrick-editor" style="display:flex; gap:20px; align-items:start;">
            <div id="face-preview-big" style="width:150px; height:150px; background:#eee; border-radius:10px;">
                ${generatePlayerSVG(config)}
            </div>
            <div class="controls" style="flex:1;">
                <h4>Cechy twarzy (Styl Hattrick)</h4>
                <div class="control-row">
                    <label>Skóra:</label>
                    <input type="range" min="0" max="${FACE_FEATURES.skin.length - 1}" value="${config.skin}" 
                           oninput="updatePreview('${player.id}', 'skin', this.value)">
                </div>
                </div>
        </div>
    `;
}
