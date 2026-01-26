import { supabaseClient } from '../auth.js';

/**
 * GŁÓWNA FUNKCJA RENDERUJĄCA WIDOK FINANSÓW
 * Modern Design - zgodny z widokiem ligi
 */
export async function renderFinancesView(teamData, players = null) {
    const container = document.getElementById('finances-view-container');
    if (!container) {
        console.error("Nie znaleziono kontenera finances-view-container");
        return;
    }

    // Pokaż ładowanie
    container.innerHTML = `
        <div class="market-modern-wrapper" style="padding: 30px; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 20px; color: #1a237e;">💰</div>
            <h2 style="color: #1a237e; font-weight: 800;">Ładowanie danych finansowych...</h2>
            <p style="color: #64748b; font-size: 0.95rem;">Pobieranie historii transakcji i analiz</p>
        </div>
    `;

    try {
        // 1. Pobieranie danych z Supabase
        const { data: logs, error: logsError } = await supabaseClient
            .from('financial_logs')
            .select('*')
            .eq('team_id', teamData.id)
            .order('created_at', { ascending: false });

        if (logsError) {
            console.error("Błąd pobierania logów:", logsError);
            throw new Error("Nie udało się pobrać historii finansowej");
        }

        const stats = calculateDetailedStats(logs);
        const weeklySalaries = await calculateTotalSalaries(teamData.id);
        
        // Obliczanie prognozy (Forecast)
        const weeklyForecast = (stats.income7d - (stats.expense7d + weeklySalaries));

        // 2. Pobierz aktualne dane drużyny (saldo)
        const { data: currentTeamData } = await supabaseClient
            .from('teams')
            .select('balance, ticket_price')
            .eq('id', teamData.id)
            .single();

        if (currentTeamData) {
            teamData.balance = currentTeamData.balance;
            teamData.ticket_price = currentTeamData.ticket_price;
        }

        // 3. Renderuj widok
        renderFinancesContent(container, stats, weeklySalaries, weeklyForecast, logs, teamData);

    } catch (error) {
        console.error("[FINANCES] Błąd:", error);
        container.innerHTML = `
            <div class="market-modern-wrapper" style="padding: 30px; text-align: center;">
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 12px; padding: 40px; margin-bottom: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px; color: #ef4444;">❌</div>
                    <h3 style="margin: 0 0 10px 0; color: #7c2d12; font-weight: 800;">Błąd ładowania danych finansowych</h3>
                    <p style="color: #92400e; margin-bottom: 20px;">${error.message}</p>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 25px;">Spróbuj ponownie za chwilę.</p>
                    <button onclick="window.switchTab('m-finances')" 
                            style="background: #1a237e; color: white; border: none; padding: 12px 30px; 
                                   border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                            onmouseover="this.style.background='#283593'; this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.background='#1a237e'; this.style.transform='translateY(0)';">
                        🔄 Spróbuj ponownie
                    </button>
                </div>
            </div>
        `;
    }
}

function renderFinancesContent(container, stats, weeklySalaries, weeklyForecast, logs, teamData) {
    console.log("[FINANCES] Renderowanie zawartości...");

    container.innerHTML = `
        <div class="market-modern-wrapper">
            <!-- NAGŁÓWEK -->
            <div class="market-management-header" style="padding: 20px 0 30px 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
                <div>
                    <h1 style="margin:0; font-weight:900; color:#1a237e; text-transform:uppercase; font-family: 'Inter', sans-serif; font-size: 1.8rem;">
                        FINANCE <span style="color:#059669">HUB</span>
                    </h1>
                    <p style="margin:10px 0 0 0; color:#64748b; font-size: 0.95rem;">
                        Zarządzanie budżetem | 
                        <span style="color:#1a237e; font-weight:600;">Drużyna: ${teamData.team_name}</span>
                    </p>
                </div>
                <div style="background:#059669; color:white; padding:12px 24px; border-radius:12px; font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:8px; box-shadow: 0 4px 12px rgba(5,150,105,0.2);">
                    <span style="font-size: 1.2rem;">💰</span>
                    Saldo: $${teamData.balance.toLocaleString()}
                </div>
            </div>

            <!-- KPI CARDS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0;">
                ${renderStatCard('PRZYCHODY (7D)', stats.income7d, '#10b981', '↑', '💵')}
                ${renderStatCard('WYDATKI (7D)', stats.expense7d, '#ef4444', '↓', '📉')}
                ${renderStatCard('PENSJE TYGODNIOWE', weeklySalaries, '#f58426', '∑', '👥')}
                ${renderStatCard('PROGNOZA TYGODNIA', weeklyForecast, weeklyForecast >= 0 ? '#3b82f6' : '#ef4444', '⇄', '📊')}
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-top: 20px;">
                
                <!-- LEWA KOLUMNA -->
                <div>
                    <!-- STRUKTURA PRZEPŁYWÓW -->
                    <div style="background: #fff; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin:0; font-size: 1.1rem; color:#1a237e; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
                                <span style="width: 8px; height: 24px; background: #059669; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 10px;"></span>
                                Struktura Przepływów
                            </h2>
                            <div style="font-size: 0.85rem; color: #64748b;">
                                Ostatnie 30 dni
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${renderFinancialBar('Bilety & Arena', stats.cat_tickets, stats.max_cat, '#3b82f6')}
                            ${renderFinancialBar('Merchandising', stats.cat_merch, stats.max_cat, '#10b981')}
                            ${renderFinancialBar('Umowy Sponsorskie', stats.cat_sponsors, stats.max_cat, '#8b5cf6')}
                            ${renderFinancialBar('Rynek Transferowy', stats.cat_transfers, stats.max_cat, '#f59e0b')}
                            <div style="height: 1px; background: #f1f5f9; margin: 10px 0;"></div>
                            ${renderFinancialBar('Koszty Operacyjne (Pensje)', -weeklySalaries, stats.max_cat, '#ef4444')}
                        </div>
                    </div>

                    <!-- HISTORIA TRANSAKCJI -->
                    <div style="background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="padding: 20px 25px; background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="margin:0; font-size: 1.1rem; color:white; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
                                HISTORIA TRANSAKCJI
                            </h2>
                            <span style="font-size: 0.75rem; opacity: 0.7; font-weight: 600;">Ostatnie 50 wpisów</span>
                        </div>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                <thead style="background: #f8fafc; position: sticky; top: 0;">
                                    <tr>
                                        <th style="text-align: left; padding: 15px 25px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Data</th>
                                        <th style="text-align: left; padding: 15px 25px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Opis</th>
                                        <th style="text-align: right; padding: 15px 25px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Kwota</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${logs && logs.length > 0 ? logs.map(log => `
                                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" 
                                            onmouseover="this.style.background='#f8fafc'" 
                                            onmouseout="this.style.background='white'">
                                            <td style="padding: 14px 25px; color: #64748b; font-size: 0.85rem; font-weight: 500;">
                                                ${new Date(log.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                                            </td>
                                            <td style="padding: 14px 25px; font-weight: 500; color: #1e293b;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-size: 1rem; color: ${log.amount > 0 ? '#10b981' : '#ef4444'}">
                                                        ${log.amount > 0 ? '↗' : '↘'}
                                                    </span>
                                                    ${log.description}
                                                </div>
                                            </td>
                                            <td style="padding: 14px 25px; text-align: right; color: ${log.amount > 0 ? '#10b981' : '#ef4444'}; font-weight: 700;">
                                                ${log.amount > 0 ? '+' : ''}$${log.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    `).join('') : `
                                        <tr>
                                            <td colspan="3" style="padding: 40px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
                                                <div style="font-size: 2rem; margin-bottom: 10px;">📝</div>
                                                <p>Brak zarejestrowanych transakcji</p>
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- PRAWA KOLUMNA -->
                <div>
                    <!-- ZARZĄDZANIE CENAMI -->
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
                        <h2 style="margin:0 0 20px 0; color:#f58426; font-size: 1.1rem; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
                            🎫 Strategia Biletowa
                        </h2>
                        
                        <div style="margin-top: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Cena za bilet</label>
                                <span id="ticket-price-display" style="font-size: 1.8rem; font-weight: 800; color: #f58426;">$${teamData.ticket_price || 25}</span>
                            </div>
                            
                            <input type="range" min="10" max="250" value="${teamData.ticket_price || 25}" 
                                style="width: 100%; height: 6px; background: #334155; border-radius: 3px; appearance: none; cursor: pointer; margin: 15px 0;"
                                oninput="document.getElementById('ticket-price-display').innerText = '$' + this.value"
                                onchange="updateTicketPrice('${teamData.id}', this.value)">
                            
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-top: 10px; font-weight: 600; padding: 0 5px;">
                                <span>$$10</span>
                                <span>Optymalna</span>
                                <span>$$250</span>
                            </div>
                            
                            <div style="margin-top: 25px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; border-left: 3px solid #f58426;">
                                <div style="display: flex; align-items: flex-start; gap: 10px;">
                                    <span style="font-size: 1.2rem;">💡</span>
                                    <div>
                                        <strong>Wskazówka:</strong> 
                                        <div style="margin-top: 5px;">Optymalna cena to <strong style="color:#f58426">$35 - $45</strong> dla obecnej siły składu i poziomu popularności.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onclick="handleArenaExpansion()" 
                            style="width: 100%; background: linear-gradient(135deg, #f58426 0%, #e67616 100%); color: white; border: none; padding: 16px; border-radius: 10px; margin-top: 25px; font-weight: 700; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; letter-spacing: 0.5px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(245,132,38,0.3)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            🏟️ MODERNIZUJ ARENĘ
                        </button>
                    </div>

                    <!-- KOSZTY STAŁE -->
                    <div style="background: #fff; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h2 style="margin:0 0 20px 0; font-size: 1.1rem; color:#1a237e; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
                            💼 Koszty Sztabu
                        </h2>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
                                <div>
                                    <div style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Trener główny</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">+ 4 asystentów</div>
                                </div>
                                <div style="font-weight: 700; color: #ef4444; font-size: 1rem;">$7,500</div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
                                <div>
                                    <div style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Sztab medyczny</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Lekarz + 3 fizjoterapeutów</div>
                                </div>
                                <div style="font-weight: 700; color: #ef4444; font-size: 1rem;">$3,200</div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
                                <div>
                                    <div style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">Administracja</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Zarząd + marketing</div>
                                </div>
                                <div style="font-weight: 700; color: #ef4444; font-size: 1rem;">$1,800</div>
                            </div>
                            
                            <div style="height: 1px; background: #e2e8f0; margin: 10px 0;"></div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">Łącznie / tydzień</div>
                                <div style="font-weight: 900; color: #dc2626; font-size: 1.1rem;">$12,500</div>
                            </div>
                        </div>

                        <button style="width: 100%; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 20px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;"
                                onmouseover="this.style.background='#e2e8f0';"
                                onmouseout="this.style.background='#f1f5f9';">
                            📋 Zarządzaj Sztabem
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- ANALIZA FINANSOWA -->
            <div style="background: #fff; border-radius: 12px; padding: 25px; margin-top: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h2 style="margin:0 0 20px 0; font-size: 1.1rem; color:#1a237e; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
                    📈 Analiza Finansowa
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 8px;">Miesięczny bilans</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${(stats.income7d * 4 - (stats.expense7d * 4 + weeklySalaries * 4)) >= 0 ? '#059669' : '#ef4444'};">$${((stats.income7d * 4 - (stats.expense7d * 4 + weeklySalaries * 4))).toLocaleString()}</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 8px;">Dni do bankructwa</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${teamData.balance / ((stats.expense7d + weeklySalaries) / 7) > 30 ? '#059669' : '#f59e0b'};">${Math.floor(teamData.balance / ((stats.expense7d + weeklySalaries) / 7))}</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 8px;">Margines zysku</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${(stats.income7d / (stats.expense7d + weeklySalaries) * 100) >= 20 ? '#059669' : '#f59e0b'};">${((stats.income7d / (stats.expense7d + weeklySalaries)) * 100).toFixed(1)}%</div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 8px;">Pensje/Przychody</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${(weeklySalaries / stats.income7d * 100) <= 60 ? '#059669' : '#ef4444'};">${((weeklySalaries / stats.income7d) * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            
            <!-- STOPKA -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: #1a237e; font-size: 0.9rem;">Finance Hub • ${teamData.team_name}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">Dane finansowe • Zaktualizowano: ${new Date().toLocaleDateString()}</div>
                    </div>
                    <button onclick="window.switchTab('m-finances')" 
                            style="background: #059669; color: white; border: none; padding: 10px 20px; 
                                   border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;"
                            onmouseover="this.style.background='#10b981'; this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.background='#059669'; this.style.transform='translateY(0)';">
                        🔄 Odśwież dane
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- FUNKCJE POMOCNICZE ---

function renderStatCard(label, value, color, trendIcon, mainIcon) {
    const isPositive = trendIcon === '↑';
    const formattedValue = typeof value === 'number' ? `$${value.toLocaleString()}` : value;
    
    return `
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; transition: all 0.3s;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)';">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">${label}</div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: ${color};">${formattedValue}</div>
                </div>
                <div style="width: 48px; height: 48px; background: ${color}15; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                    ${mainIcon}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; color: ${isPositive ? '#10b981' : '#ef4444'};">
                <span style="font-size: 0.9rem;">${trendIcon}</span>
                <span>${isPositive ? 'Wzrost' : 'Spadek'} w ciągu ostatnich 7 dni</span>
            </div>
        </div>
    `;
}

function renderFinancialBar(label, value, max, color) {
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const percentage = Math.max(5, Math.min(100, (absValue / (max || 1)) * 100));
    const formattedValue = `$${absValue.toLocaleString()}`;
    
    return `
        <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: #475569;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${label}</span>
                    ${isNegative ? '<span style="font-size: 0.7rem; color: #ef4444;">(koszt)</span>' : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-weight: 800; color: ${color};">${isNegative ? '-' : '+'}${formattedValue}</span>
                </div>
            </div>
            <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 20px; overflow: hidden; position: relative;">
                <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 20px; 
                        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); position: relative;">
                    <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.3);"></div>
                </div>
            </div>
        </div>
    `;
}

function calculateDetailedStats(logs) {
    const stats = {
        income7d: 0,
        expense7d: 0,
        cat_tickets: 0,
        cat_merch: 0,
        cat_sponsors: 0,
        cat_transfers: 0,
        max_cat: 50000
    };

    if (!logs) return stats;

    // Filtruj tylko z ostatnich 7 dni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = logs.filter(log => new Date(log.created_at) >= sevenDaysAgo);

    recentLogs.forEach(log => {
        const val = Math.abs(log.amount);
        if (log.amount > 0) {
            stats.income7d += val;
            if (log.category === 'tickets') stats.cat_tickets += val;
            if (log.category === 'merch') stats.cat_merch += val;
            if (log.category === 'sponsors') stats.cat_sponsors += val;
        } else {
            stats.expense7d += val;
            if (log.category === 'transfers') stats.cat_transfers += val;
        }
    });

    // Jeśli brak danych z ostatnich 7 dni, użyj 30% wszystkich danych
    if (stats.income7d === 0 && stats.expense7d === 0 && logs.length > 0) {
        const sampleSize = Math.min(logs.length, 10);
        logs.slice(0, sampleSize).forEach(log => {
            const val = Math.abs(log.amount) * 0.3; // 30% wartości
            if (log.amount > 0) {
                stats.income7d += val;
            } else {
                stats.expense7d += val;
            }
        });
    }

    // Ustaw maksymalną wartość dla wykresów
    const maxValues = [
        stats.cat_tickets,
        stats.cat_merch,
        stats.cat_sponsors,
        stats.cat_transfers,
        stats.income7d,
        stats.expense7d
    ].filter(v => v > 0);
    
    stats.max_cat = maxValues.length > 0 ? Math.max(...maxValues) * 1.2 : 50000;

    return stats;
}

async function calculateTotalSalaries(teamId) {
    try {
        const { data } = await supabaseClient
            .from('players')
            .select('salary')
            .eq('team_id', teamId);
        
        return data ? data.reduce((sum, p) => sum + (p.salary || 0), 0) : 0;
    } catch (error) {
        console.error("Błąd pobierania pensji:", error);
        return 10000; // Domyślna wartość
    }
}

// --- AKCJE UŻYTKOWNIKA ---

window.updateTicketPrice = async (teamId, newPrice) => {
    try {
        const price = parseInt(newPrice);
        if (isNaN(price) || price < 10 || price > 250) {
            alert("Cena biletów musi być w zakresie $10 - $250");
            return;
        }

        const { error } = await supabaseClient
            .from('teams')
            .update({ ticket_price: price })
            .eq('id', teamId);

        if (error) throw error;
        
        // Pokaż potwierdzenie
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `✅ Cena biletów zaktualizowana na $${price}`;
        document.body.appendChild(notification);
        
        // Usuń powiadomienie po 3 sekundach
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        console.log("Cena biletów zaktualizowana pomyślnie.");
    } catch (err) {
        console.error("Błąd aktualizacji ceny:", err);
        alert("Nie udało się zaktualizować ceny biletów. Spróbuj ponownie.");
    }
};

window.handleArenaExpansion = () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 20px; color: #f58426;">🏟️</div>
            <h3 style="margin: 0 0 15px 0; color: #1a237e; font-weight: 800;">Modernizacja Areny</h3>
            <p style="color: #64748b; margin-bottom: 25px; line-height: 1.5;">
                Ta funkcja zostanie odblokowana w następnej aktualizacji (V 2.2).<br>
                Będziesz mógł zwiększyć pojemność areny i poprawić doświadczenia kibiców.
            </p>
            <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                    style="background: #1a237e; color: white; border: none; padding: 12px 30px; 
                           border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                    onmouseover="this.style.background='#283593';"
                    onmouseout="this.style.background='#1a237e';">
                Zamknij
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Dodaj animacje CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
};
