// Plik: js/auth.js

const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function signIn() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    
    if(!e || !p) {
        alert(currentLang === 'pl' ? "Wypełnij wszystkie pola!" : "Fill all fields!");
        return;
    }

    const { error } = await _supabase.auth.signInWithPassword({email:e, password:p});
    if(error) {
        alert(currentLang === 'pl' ? "Błąd logowania: " + error.message : "Login error: " + error.message);
    } else {
        checkUser();
    }
}

async function signUp() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    
    if(!e || !p) {
        alert(currentLang === 'pl' ? "Wypełnij wszystkie pola!" : "Fill all fields!");
        return;
    }

    const { error } = await _supabase.auth.signUp({email:e, password:p});
    if(error) {
        alert(currentLang === 'pl' ? "Błąd rejestracji: " + error.message : "Signup error: " + error.message);
    } else {
        alert(currentLang === 'pl' ? "Konto stworzone! Sprawdź e-mail." : "Account created! Check your email.");
    }
}

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('game-app');
    const admin = document.getElementById('admin-panel');
    // Używamy ID z Twojego HTML: user-info-display
    const userDisplay = document.getElementById('user-info-display');

    if(user) {
        landing.style.display = 'none';
        app.style.display = 'block';

        // 1. PANEL ADMINA - sprawdzany od razu
        if(user.email === 'strubbe23@gmail.com') {
            if(admin) admin.style.display = 'block';
        } else {
            if(admin) admin.style.display = 'none';
        }

        // 2. AUTOMATYCZNA DRUŻYNA I WYŚWIETLANIE
        try {
            // Pobierz drużynę z bazy
            let { data: teamData } = await _supabase
                .from('teams')
                .select('*')
                .eq('manager_id', user.id)
                .maybeSingle();

            // Jeśli nie ma drużyny w bazie, stwórz ją
            if (!teamData) {
                const defaultName = `Team ${user.email.split('@')[0]}`;
                const { data: newTeam } = await _supabase
                    .from('teams')
                    .insert([{ 
                        manager_id: user.id, 
                        team_name: defaultName,
                        balance: 500000,
                        country: "Poland"
                    }])
                    .select()
                    .single();
                teamData = newTeam;
            }

            // Aktualizacja tekstu w nagłówku (Email / Nazwa Drużyny)
            if(userDisplay) {
                const teamName = teamData ? teamData.team_name : "Manager";
                userDisplay.innerText = `${user.email} / ${teamName}`;
            }
        } catch (err) {
            console.error("Błąd drużyny:", err);
            if(userDisplay) userDisplay.innerText = user.email;
        }

    } else {
        landing.style.display = 'block';
        app.style.display = 'none';
    }
}

async function logout() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

// Sprawdź status przy starcie
checkUser();
