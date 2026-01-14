const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Eksportujemy klienta, żeby inne pliki (manager.js) widziały to samo połączenie
window.supabase = _supabase;

async function signIn() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    if(!e || !p) return alert("Wypełnij pola!");

    const { error } = await _supabase.auth.signInWithPassword({email:e, password:p});
    if(error) alert("Błąd: " + error.message);
    else checkUser();
}

async function signUp() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    const { error } = await _supabase.auth.signUp({email:e, password:p});
    if(error) alert(error.message);
    else alert("Konto stworzone! Sprawdź maila.");
}

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('game-app');
    const userDisplay = document.getElementById('user-info-display');

    if(user) {
        // 1. Ukrywamy stronę logowania, pokazujemy aplikację
        if(landing) landing.style.display = 'none';
        if(app) app.style.display = 'block';

        // 2. Ustalamy rolę (Twoja definicja ADMINA)
        const isAdmin = (user.email === 'strubbe23@gmail.com');
        const role = isAdmin ? 'admin' : 'manager';

        try {
            // 3. Pobieranie lub tworzenie danych zespołu dla Managera
            let { data: teamData, error: fErr } = await _supabase
                .from('teams')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (!teamData && !fErr && !isAdmin) {
                // Tworzymy zespół tylko jeśli to nie jest admin i nie ma jeszcze zespołu
                const { data: newTeam } = await _supabase
                    .from('teams')
                    .insert([{ 
                        owner_id: user.id, 
                        team_name: `Team ${user.email.split('@')[0]}`,
                        balance: 500000
                    }])
                    .select().single();
                teamData = newTeam;
            }

            // 4. Wyświetlanie info o użytkowniku w nagłówku
            if(userDisplay) {
                let statusName = isAdmin ? "Admin" : (teamData ? teamData.team_name : "Manager");
                userDisplay.innerText = `${user.email} (${statusName})`;
            }

            // 5. KLUCZOWY MOMENT: Wywołanie funkcji z index.html, która pokazuje odpowiednie menu
            if (typeof setupUI === 'function') {
                setupUI(role);
            }

        } catch (e) { 
            console.error("Błąd inicjalizacji użytkownika:", e); 
        }
    } else {
        // Brak zalogowanego użytkownika
        if(landing) landing.style.display = 'block';
        if(app) app.style.display = 'none';
    }
}

async function logout() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

// Sprawdź stan sesji przy załadowaniu strony
checkUser();
