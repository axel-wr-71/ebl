function renderPlayerRow(p) {
    const isRookie = p.is_rookie || p.age <= 19;
    const potData = window.getPotentialData(p.potential);
    
    // Obliczanie wzrostu dla Safari/MacBook
    const heightCm = p.height || 0;
    const inchesTotal = heightCm * 0.393701;
    const ft = Math.floor(inchesTotal / 12);
    const inc = Math.round(inchesTotal % 12);
    const heightInFt = `${ft}'${inc}"`;

    return `
        <tr style="border-bottom: 1px solid #f8fafc; vertical-align: middle;">
            <td style="padding: 20px;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.last_name}" 
                         style="width: 65px; height: 65px; background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; object-fit: cover;">
                    
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <strong style="color: #1a237e; font-size: 1.1rem;">${p.first_name} ${p.last_name}</strong>
                            ${isRookie ? '<span style="background:#fee2e2; color:#ef4444; font-size:0.6rem; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase;">Rookie</span>' : ''}
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f8fafc; padding: 10px; border-radius: 10px; font-size: 0.65rem; border: 1px solid #edf2f7; min-width: 380px;">
                            <div>
                                <div style="color:#1a237e; margin-bottom:4px; font-weight:800; text-transform:uppercase; border-bottom:1px solid #e2e8f0;">Attack</div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Inside (2PT)</span> <strong>${p.skill_2pt ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>3PT Shot</span> <strong>${p.skill_3pt ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Dunk</span> <strong>${p.skill_dunk ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Passing</span> <strong>${p.skill_passing ?? '-'}</strong></div>
                            </div>
                            <div>
                                <div style="color:#1a237e; margin-bottom:4px; font-weight:800; text-transform:uppercase; border-bottom:1px solid #e2e8f0;">Defense</div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>1v1 Def</span> <strong>${p.skill_1on1_def ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Steal</span> <strong>${p.skill_steal ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Block</span> <strong>${p.skill_block ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>1v1 Off</span> <strong>${p.skill_1on1_off ?? '-'}</strong></div>
                            </div>
                            <div>
                                <div style="color:#1a237e; margin-bottom:4px; font-weight:800; text-transform:uppercase; border-bottom:1px solid #e2e8f0;">General</div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Rebound</span> <strong>${p.skill_rebound ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Dribble</span> <strong>${p.skill_dribbling ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Stamina</span> <strong>${p.skill_stamina ?? '-'}</strong></div>
                                <div style="display:flex; justify-content:space-between; margin:2px 0;"><span>Free Throw</span> <strong>${p.skill_ft ?? '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
            
            <td style="padding: 20px; font-weight: 700; color: #64748b;">${p.position}</td>
            <td style="padding: 20px; font-weight: 500; color: #64748b; font-size: 0.8rem;">
                ${heightCm} cm<br><span style="font-size: 0.7rem; opacity: 0.6;">${heightInFt}</span>
            </td>
            <td style="padding: 20px; font-weight: 700; color: #64748b;">${p.age}</td>
            <td style="padding: 20px;">
                <div style="border-bottom: 3px solid ${potData.color}; display: inline-block; padding-bottom: 2px;">
                    <span style="font-weight: 800; color: #1e293b; font-size: 0.85rem;">${potData.label}</span>
                </div>
            </td>
            <td style="padding: 20px; font-weight: 800; color: #059669;">$${(p.salary || 0).toLocaleString()}</td>
            <td style="padding: 20px;">
                <div style="width: 42px; height: 42px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #166534; font-size: 1.1rem;">
                    ${p.overall_rating || '??'}
                </div>
            </td>
            <td style="padding: 20px; text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn-profile-trigger" data-id="${p.id}" style="background: #1a237e; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 0.65rem;">Profile</button>
                    <button style="background: #f1f5f9; color: #1a237e; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 0.65rem;">Train</button>
                    <button style="background: white; color: #ef4444; border: 1px solid #fee2e2; padding: 8px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; text-transform: uppercase; font-size: 0.65rem;">Sell</button>
                </div>
            </td>
        </tr>
    `;
}
