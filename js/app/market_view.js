// js/app/market_view.js
import { supabaseClient } from '../auth.js';

export async function renderMarketView(teamData) {
    const container = document.getElementById('market-container'); // Celujemy w ID z Twojego index.html
    if (!container) return;

    container.innerHTML = `<div style="padding: 20px; text-align: center;">Szukanie dostępnych zawodników...</div>`;

    // Pobieramy zawodników (Wolnych Agentów lub tych z innych klubów)
    const { data: players, error } = await supabaseClient
        .from('players')
        .select(`*, teams (team_name)`)
        .neq('team_id', teamData.id) // Nie pokazuj moich własnych zawodników
        .order('overall_rating', { ascending: false })
        .limit(20);

    if (error) {
        container.innerHTML = "Błąd ładowania rynku.";
        return;
    }

    container.innerHTML = `
        <div style="padding: 30px; font-family: 'Inter', sans-serif;">
            <div style="background: #1a237e; color: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin:0; font-weight: 800;">TRANSFER MARKET</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.8;">Wzmocnij swój zespół nowymi talentami</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8em; opacity: 0.8;">TWÓJ BUDŻET</div>
                    <div style="font-size: 1.8em; font-weight: 800; color: #ffca28;">$${teamData.balance.toLocaleString()}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                ${players.map(p => renderMarketRow(p, teamData.balance)).join('')}
            </div>
        </div>
    `;
}

function renderMarketRow(player, currentBalance) {
    const price = player.price || (player.overall_rating * 15000);
    const canAfford = currentBalance >= price;

    return `
        <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s;" onmouseover="this.style.borderColor='#1a237e'">
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="background: #f0f2f5; width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #1a237e;">
                    ${player.position}
                </div>
                <div>
                    <div style="font-weight: 800; font-size: 1.1em; color: #1a237e;">${player.first_name} ${player.last_name}</div>
                    <div style="font-size: 0.85em; color: #666;">
                        OVR: <span style="color: #e65100; font-weight: 700;">${player.overall_rating}</span> | 
                        Klub: ${player.teams ? player.teams.team_name : 'Wolny Agent'}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 25px;">
                <div style="text-align: right;">
                    <div style="font-size: 0.7em; color: #999; font-weight: 800;">CENA WYKUPU</div>
                    <div style="font-weight: 800; color: #333;">$${price.toLocaleString()}</div>
                </div>
                <button 
                    onclick="handleBuyPlayer('${player.id}', ${price})"
                    ${!canAfford ? 'disabled' : ''}
                    style="background: ${canAfford ? '#2e7d32' : '#ccc'}; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: 800; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; transition: 0.3s;"
                >
                    ${canAfford ? 'KUPUJ' : 'ZA DROGI'}
                </button>
            </div>
        </div>
    `;
}

// Globalna funkcja obsługi zakupu
window.handleBuyPlayer = async (playerId, price) => {
    if (!confirm(`Czy na pewno chcesz kupić tego zawodnika za $${price.toLocaleString()}?`)) return;
    
    // Tutaj dodamy logikę Supabase w następnym kroku
    console.log("Próba zakupu:", playerId, "za", price);
};
