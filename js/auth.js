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
    const userDisplay = document.getElementById('user-display');

    if(user) {
        // 1. Natychmiastowe pokazanie aplikacji i ukrycie landing page
        if(landing) landing.style.display = 'none';
        if(app) app.style.display = 'block';
        
        // 2. Panel Administratora - SPRAWDZANE PIERWSZE (niezależnie od bazy)
        if(user.email === 'strubbe23@gmail.com') {
            if(admin) admin.style.display = 'block';
        } else {
            if(admin) admin.style.display = 'none';
        }

        // 3. Obsługa danych drużyny (w bloku try-catch, aby błędy nie blokowały reszty)
        try {
            let { data: teamData } = await _supabase
                .from('teams')
                .select('*')
                .eq('manager_id', user.id)
                .maybeSingle();

            if (!teamData) {
                const defaultName = `Team ${user.email.split('@')[0]}`;
                const { data: newTeam, error: createError } = await _supabase
                    .from('teams')
                    .insert([{ 
                        manager_id: user.id, 
                        team_name: defaultName,
                        balance: 500000,
                        country: "Poland"
                    }])
                    .select()
                    .single();

                if (!createError) teamData = newTeam;
            }

            // Wyświetlanie danych w rogu
            if(userDisplay) {
                const teamName = teamData ? teamData.team_name : "...";
                userDisplay.innerText = `${user.email} / ${teamName}`;
            }
        } catch (err) {
            console.error("Błąd bazy danych (teams):", err);
            if(userDisplay) userDisplay.innerText = user.email;
        }

    } else {
        if(landing) landing.style.display = 'block';
        if(app) app.style.display = 'none';
    }
}

async function logout() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

// Uruchomienie sprawdzenia przy starcie
checkUser();
