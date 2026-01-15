// js/app/finances_view.js
import { supabaseClient } from '../auth.js';

export async function renderFinancesView(teamData) {
    const container = document.getElementById('finances-container');
    if (!container) return;

    // Pobieramy historię finansową z ostatniego miesiąca
    const { data: logs, error } = await supabaseClient
        .from('financial_logs')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false })
        .limit(20);

    const weeklySalaries = await calculateTotalSalaries(teamData.id);

    container.innerHTML = `
        <div style="padding: 30px; font-family: 'Inter', sans-serif; background: #f8f9fa;">
            <h1 style="color: #1a237e; font-weight: 800;">FINANCIAL CENTER</h1>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 15px; border-left: 5px solid #2e7d32; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <small style="color: #666; font-weight: 700;">SALDO KONTA</small>
                    <div style="font-size: 1.8em; font-weight: 800; color: #2e7d32;">$${teamData.balance.toLocaleString()}</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 15px; border-left: 5px solid #d32f2f; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <small style="color: #666; font-weight: 700;">TYGODNIOWE PŁACE</small>
                    <div style="font-size: 1.8em; font-weight: 800; color: #d32f2f;">-$${weeklySalaries.toLocaleString()}</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 15px; border-left: 5px solid #1a237e; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <small style="color: #666; font-weight: 700;">SZAC. DOCHÓD Z MECZU</small>
                    <div style="font-size: 1.8em; font-weight: 800; color: #1a237e;">+$${(teamData.arena_capacity * teamData.ticket_price * 0.8).toLocaleString()}</div>
                </div>
            </div>

            <div style="background: white; border-radius: 15px; overflow: hidden; border: 1px solid #e0e0e0;">
                <div style="padding: 20px; background: #1a237e; color: white; font-weight: 700;">OSTATNIE OPERACJE</div>
                <table style="width: 100%; border-collapse: collapse;">
                    ${logs && logs.length > 0 ? logs.map(log => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 15px;">${new Date(log.created_at).toLocaleDateString()}</td>
                            <td style="padding: 15px; font-weight: 700;">${log.description}</td>
                            <td style="padding: 15px; text-align: right; color: ${log.amount > 0 ? '#2e7d32' : '#d32f2f'}; font-weight: 800;">
                                ${log.amount > 0 ? '+' : ''}${log.amount.toLocaleString()} $
                            </td>
                        </tr>
                    `).join('') : '<tr ><td style="padding:20px; text-align:center; color:#999;">Brak zarejestrowanych transakcji</td></tr>'}
                </table>
            </div>
        </div>
    `;
}

async function calculateTotalSalaries(teamId) {
    const { data } = await supabaseClient
        .from('players')
        .select('salary')
        .eq('team_id', teamId);
    return data ? data.reduce((sum, p) => sum + (p.salary || 0), 0) : 0;
}
