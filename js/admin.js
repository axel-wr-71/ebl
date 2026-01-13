// js/admin.js

/**
 * Ładowanie listy elementów (potencjały/skille) do selecta w panelu Admina
 */
async function loadConfigList() {
    const type = document.getElementById('config-type-select').value;
    const itemSelect = document.getElementById('config-item-select');
    const listContainer = document.getElementById('config-list-container');
    
    if(!type) {
        listContainer.style.display = 'none';
        return;
    }

    const { data, error } = await _supabase
        .from('game_config')
        .select('*')
        .eq('category', type)
        .order('key_name', { ascending: true });

    if(error) return console.error(error);

    itemSelect.innerHTML = '<option value="">-- Wybierz konkretny element --</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.key_name;
        option.textContent = `${item.key_name}: ${item.name_pl} / ${item.name_en}`;
        itemSelect.appendChild(option);
    });

    listContainer.style.display = 'block';
}

/**
 * Pokazywanie formularza edycji po wybraniu np. Potencjału nr 5
 */
async function showConfigEditor() {
    const type = document.getElementById('config-type-select').value;
    const key = document.getElementById('config-item-select').value;
    const editor = document.getElementById('config-editor-fields');

    if(!key) {
        editor.style.display = 'none';
        return;
    }

    const { data } = await _supabase
        .from('game_config')
        .select('*')
        .eq('category', type)
        .eq('key_name', key)
        .single();

    if(data) {
        document.getElementById('edit-item-title').innerText = `Edytujesz: ${data.name_pl}`;
        document.getElementById('edit-name-pl').value = data.name_pl;
        document.getElementById('edit-name-en').value = data.name_en;
        editor.style.display = 'block';
    }
}

/**
 * Zapisywanie zmienionej nazwy do bazy
 */
async function saveGameConfig() {
    const type = document.getElementById('config-type-select').value;
    const key = document.getElementById('config-item-select').value;
    const nPl = document.getElementById('edit-name-pl').value;
    const nEn = document.getElementById('edit-name-en').value;

    const { error } = await _supabase
        .from('game_config')
        .update({ name_pl: nPl, name_en: nEn })
        .eq('category', type)
        .eq('key_name', key);

    if(error) alert("Błąd zapisu: " + error.message);
    else {
        alert("Zapisano pomyślnie!");
        loadConfigList(); // Odśwież listę
    }
}

/**
 * 6. Globalna lista zawodników dla Admina
 */
async function fetchAdminPlayersList() {
    const season = document.getElementById('filter-season').value;
    const container = document.getElementById('admin-players-table');
    
    container.innerHTML = "<p>Ładowanie...</p>";

    // Pobieramy zawodników oraz nazwy ich potencjałów jednym zapytaniem
    const { data, error } = await _supabase
        .from('players')
        .select(`
            id, name, age, position, potential_id, country, team_id,
            game_config!inner (name_pl)
        `)
        // Mała uwaga: Aby to zadziałało idealnie, w Supabase musi być relacja FK 
        // między players.potential_id a game_config.key_name (jako int)
        // Jeśli nie masz relacji, pobierzemy to prościej:
        
    const { data: players } = await _supabase.from('players').select('*').limit(100);
    const { data: configs } = await _supabase.from('game_config').eq('category', 'potential');

    let html = `<table class="admin-table">
        <tr>
            <th>Zawodnik</th><th>Wiek</th><th>Poz</th><th>Potencjał</th><th>Kraj</th><th>Akcje</th>
        </tr>`;

    players.forEach(p => {
        const potName = configs.find(c => c.key_name == p.potential_id)?.name_pl || p.potential_id;
        html += `<tr>
            <td><b>${p.name}</b></td>
            <td>${p.age}</td>
            <td>${p.position}</td>
            <td>${potName}</td>
            <td>${p.country}</td>
            <td><button onclick="console.log('${p.id}')">Edytuj</button></td>
        </tr>`;
    });

    html += `</table>`;
    container.innerHTML = html;
}
