// js/app/roster_view.js

/**
 * Helper: Nowoczesny styl kwadratów pozycji z wzorkiem
 */
function getPositionStyle(pos) {
    const styles = {
        'PG': '#2563eb', // Royal Blue
        'SG': '#7c3aed', // Deep Violet
        'SF': '#059669', // Emerald
        'PF': '#ea580c', // Cinnabar
        'C':  '#dc2626'  // Crimson
    };
    const color = styles[pos] || '#475569';
    
    return `
        background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%);
        background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0);
        background-size: 4px 4px;
        color: white;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-weight: 900;
        font-size: 0.8rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-shadow: 1px 1px 0px rgba(0,0,0,0.2);
    `;
}

/**
 * Helper: Kolory dla OVR
 */
function getOvrStyle(ovr) {
    if (ovr >= 90) return { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', bold: '900' };
    if (ovr >= 80) return { bg: '#f0fdf4', border: '#22c55e', color: '#166534', bold: '800' };
    if (ovr >= 70) return { bg: '#f0f9ff', border: '#3b82f6', color: '#1e3a8a', bold: '700' };
    if (ovr >= 60) return { bg: '#fff7ed', border: '#fdba74', color: '#9a3412', bold: '600' };
    return { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', bold: '600' };
}

function getFlagUrl(countryCode) {
    if (!countryCode) return '';
    return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`;
}

function updateGlobalHeader(teamName, leagueName, countryCode) {
    const headerTeamName = document.querySelector('.team-info b, #global-team-name');
    const headerLeagueName = document.querySelector('.team-info span[style*="color: #ff4500"], #global-league-name');
    if (headerTeamName) headerTeamName.textContent = teamName;
    if (headerLeagueName) {
        const flagHtml = countryCode ? `<img src="${getFlagUrl(countryCode)}" style="width:16px; height:16px; margin-right:5px; vertical-align:middle; border-radius:50%; object-fit:cover;">` : '';
        headerLeagueName.innerHTML = `${flagHtml}${leagueName}`;
    }
}

export function renderRosterView(team, players) {
    const container = document.getElementById('roster-view-container');
    if (!container) return;

    const teamName = team?.team_name || team?.name || 'Twoja Drużyna';
    const leagueName = team?.league_name || 'Super League';
    const leagueCountry = team?.country || team?.league_country || 'US';

    updateGlobalHeader(teamName, leagueName, leagueCountry);

    const topStars = [...players].sort((a, b) => calculateOVR(b) - calculateOVR(a)).slice(0, 2);

    let html = `
        <div class="roster-management-header" style="padding: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin:0; font-weight:900; color:#1a237e; text-transform:uppercase; font-family: system-ui;">ROSTER <span style="color:#e65100">MANAGEMENT</span></h1>
                <p style="margin:0; color:#64748b; display: flex; align-items: center; gap: 6px;">
                    Current squad: <strong style="color:#1a237e">${teamName}</strong> | 
                    League: <img src="${getFlagUrl(leagueCountry)}" style="width:18px; height:18px; border-radius:50%; object-fit:cover;"> <strong style="color:#1a237e">${leagueName}</strong>
                </p>
            </div>
            <div style="background:#1a237e; color:white; padding:10px 20px; border-radius:30px; font-weight:bold; font-size:0.85rem;">
                🏀 SQUAD SIZE: ${players.length} / 12
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px 30px 20px;">
            ${topStars.map((star, idx) => {
                const potData = window.getPotentialData ? window.getPotentialData(star.potential) : { label: 'Prospect', icon: '', color: '#3b82f6' };
                const starOvr = calculateOVR(star);
                return `
                <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 100%); border-radius: 15px; padding: 25px; display: flex; align-items: center; gap: 20px; color: white; position: relative; overflow: hidden;">
                    <div style="position: absolute; right: -5px; top: -5px; font-size: 70px; opacity: 0.15; font-weight: 900;">${starOvr}</div>
                    <div style="position: relative; z-index: 2;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${star.last_name}" 
                             style="width: 75px; height: 75px; background: white; border-radius: 12px; border: 3px solid rgba(255,255,255,0.2); object-fit: cover;">
                        <img src="${getFlagUrl(star.nationality)}" style="position: absolute; bottom: -5px; right: -5px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #1a237e; background: white; object-fit: cover;">
                    </div>
                    <div style="z-index: 2;">
                        <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #ffab40; font-weight: 800;">
                            ${idx === 0 ? 'Franchise Star' : 'Future Pillar'}
                        </span>
                        <h2 style="margin: 5px 0; font-size: 1.5rem;">${star.first_name} ${star.last_name}</h2>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="${getPositionStyle(star.position)}; width: 30px; height: 30px; font-size: 0.65rem;">${star.position}</div>
                            <span style="font-size: 0.9rem; opacity: 0.8;"><strong>${potData.label} ${potData.icon}</strong></span>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>

        <div style="margin: 0 20px; padding-bottom: 40px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                <thead>
                    <tr style="text-align: left; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">
                        <th style="padding: 10px 25px;">Player & Scouting Report</th>
                        <th style="padding: 10px; text-align: center;">Pos</th>
                        <th style="padding: 10px;">HT (cm/ft)</th>
                        <th style="padding: 10px;">Age</th>
                        <th style="padding: 10px;">Potential Class</th>
                        <th style="padding: 10px;">Salary</th>
                        <th style="padding: 10px; text-align: center;">OVR</th>
                        <th style="padding: 20px 25px; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody id="roster-list-body">
                    ${players.map(p => renderPlayerRow(p)).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function calculateOVR(p) {
    const skills = [p.skill_2pt, p.skill_3pt, p.skill_dunk, p.skill_ft, p.skill_passing, p.skill_dribbling, p.skill_stamina, p.skill_rebound, p.skill_block, p.skill_steal, p.skill_1on1_off, p.skill_1on1_def];
    const sum = skills.reduce((a, b) => (a || 0) + (b || 0), 0);
    return Math.round((sum / 240) * 100);
}

function renderPlayerRow(p) {
    const isRookie = p.is_rookie || p.age <= 19;
    const potData = window.getPotentialData ? window.getPotentialData(p.potential) : { label: 'Prospect', icon: '', color: '#3b82f6' };
    const ovr = calculateOVR(p);
    const ovrStyle = getOvrStyle(ovr);

    const heightCm = p.height || 0;
    const heightInFt = heightCm > 0 ? `${Math.floor((heightCm * 0.393701) / 12)}'${Math.round((heightCm * 0.393701) % 12)}"` : '--';

    return `
        <tr style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <td style="padding: 20px 25px; border-radius: 15px 0 0 15px; border: 1px solid #f1f5f9; border-right: none;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}" style="width: 60px; height: 60px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <img src="${getFlagUrl(p.nationality)}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    </div>
                    
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <strong style="color: #1a237e; font-size: 1.05rem;">${p.first_name} ${p.last_name}</strong>
                            ${isRookie ? '<span style="background:#fee2e2; color:#ef4444; font-size:0.6rem; font-weight:800; padding:2px 6px; border-radius:4px;">ROOKIE</span>' : ''}
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 10px; border-radius: 10px; font-size: 0.65rem; border: 1px solid #edf2f7; min-width: 380px;">
                            <div><div style="color:#1a237e; font-weight:800; border-bottom:1px solid #e2e8f0; margin-bottom:3px;">OFF</div>
                                <div style="display:flex; justify-content:space-between;"><span>2PT</span> <strong>${p.skill_2pt ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>3PT</span> <strong>${p.skill_3pt ?? '-'}</strong></div>
                            </div>
                            <div><div style="color:#1a237e; font-weight:800; border-bottom:1px solid #e2e8f0; margin-bottom:3px;">DEF</div>
                                <div style="display:flex; justify-content:space-between;"><span>1v1</span> <strong>${p.skill_1on1_def ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>BLK</span> <strong>${p.skill_block ?? '-'}</strong></div>
                            </div>
                            <div><div style="color:#1a237e; font-weight:800; border-bottom:1px solid #e2e8f0; margin-bottom:3px;">GEN</div>
                                <div style="display:flex; justify-content:space-between;"><span>PAS</span> <strong>${p.skill_passing ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>STA</span> <strong>${p.skill_stamina ?? '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            <td style="padding: 20px 10px; text-align: center;">
                <div style="${getPositionStyle(p.position)}">
                    ${p.position}
                </div>
            </td>
            <td style="padding: 20px 10px; font-weight: 500; color: #64748b; font-size: 0.8rem;">${heightCm} cm<br><small>${heightInFt}</small></td>
            <td style="padding: 20px 10px; font-weight: 700; color: #64748b;">${p.age}</td>
            <td style="padding: 20px 10px;"><div style="border-bottom: 3px solid ${potData.color}; display: inline-block;"><span style="font-weight: 800; color: #1e293b; font-size: 0.85rem;">${potData.label} ${potData.icon}</span></div></td>
            <td style="padding: 20px 10px; font-weight: 800; color: #059669;">$${(p.salary || 0).toLocaleString()}</td>
            <td style="padding: 20px 10px; text-align: center;">
                <div style="width: 42px; height: 42px; background: ${ovrStyle.bg}; border: 2px solid ${ovrStyle.border}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: ${ovrStyle.bold}; color: ${ovrStyle.color}; font-size: 1.1rem;">
                    ${ovr}
                </div>
            </td>
            <td style="padding: 20px 25px; text-align: right; border-radius: 0 15px 15px 0; border: 1px solid #f1f5f9; border-left: none;">
                <div style="display: flex; gap: 6px; justify-content: flex-end;">
                    <button class="btn-profile-trigger" data-id="${p.id}" style="background: #1a237e; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.65rem;">Profile</button>
                    <button class="btn-train-trigger" data-id="${p.id}" style="background: #f1f5f9; color: #1a237e; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.65rem;">Train</button>
                </div>
            </td>
        </tr>
    `;
}
