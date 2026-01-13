const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const admin = document.getElementById('admin-panel');
    const userDisplay = document.getElementById('user-info-display');

    if(user) {
        if(landing) landing.style.display = 'none';
        if(app) app.style.display = 'block';
        if(user.email === 'strubbe23@gmail.com') admin.style.display = 'block';

        try {
            // Pobieranie z nowej tabeli teams
            let { data: teamData, error: fErr } = await _supabase
                .from('teams')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (!teamData && !fErr) {
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

            if(userDisplay) {
                let status = (user.email === 'strubbe23@gmail.com') ? "Admin" : (teamData ? teamData.team_name : "Manager");
                userDisplay.innerText = `${user.email} / ${status}`;
            }
        } catch (e) { console.log("Błąd:", e); }
    } else {
        if(landing) landing.style.display = 'block';
        if(app) app.style.display = 'none';
    }
}

async function logout() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

checkUser();
