// js/admin/admin_players.js

export function renderPlayersList(players) {
    const container = document.getElementById('admin-main-view');
    container.innerHTML = `
        <div class="admin-section">
            <h2 class="section-title">Baza Wszystkich Zawodników</h2>
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="text-align:left;">ZAWODNIK</th>
                            <th>WIEK</th>
                            <th>POZ</th>
                            <th>JS</th>
                            <th>JR</th>
                            <th>OD</th>
                            <th>HA</th>
                            <th>DR</th>
                            <th>PA</th>
                            <th>IS</th>
                            <th>ID</th>
                            <th>RE</th>
                            <th>BL</th>
                            <th>ST</th>
                            <th>FT</th>
                            <th>AKCJA</th>
                        </tr>
                    </thead>
                    <tbody id="players-table-body">
                        ${players.map(p => {
                            const fullName = (p.first_name || p.last_name) 
                                ? `${p.first_name || ''} ${p.last_name || ''}`.trim() 
                                : `Gracz ${p.id.substring(0, 5)}`;
                            
                            return `
                            <tr>
                                <td style="text-align:left; font-weight:bold;">${fullName}</td>
                                <td>${p.age}</td>
                                <td style="color:var(--nba-orange); font-weight:800;">${p.position || '??'}</td>
                                <td class="skill-cell">${p.jump_shot}</td>
                                <td class="skill-cell">${p.jump_range}</td>
                                <td class="skill-cell">${p.outside_defense}</td>
                                <td class="skill-cell">${p.handling}</td>
                                <td class="skill-cell">${p.driving}</td>
                                <td class="skill-cell">${p.passing}</td>
                                <td class="skill-cell">${p.inside_shot}</td>
                                <td class="skill-cell">${p.inside_defense}</td>
                                <td class="skill-cell">${p.rebounding}</td>
                                <td class="skill-cell">${p.shot_blocking}</td>
                                <td class="skill-cell">${p.stamina}</td>
                                <td class="skill-cell">${p.free_throw}</td>
                                <td>
                                    <button class="btn-show" onclick="viewPlayerProfile('${p.id}')">PROFIL</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
