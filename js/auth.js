const SUPABASE_URL = 'https://zzsscobtzwbwubchqjyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdrjVOU6jVHGVpsxcUygmg_kqPqz1aC';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function signIn() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    const { error } = await _supabase.auth.signInWithPassword({email:e, password:p});
    if(error) alert("Błąd logowania: " + error.message); else checkUser();
}

async function signUp() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    const { error } = await _supabase.auth.signUp({email:e, password:p});
    if(error) alert("Błąd rejestracji: " + error.message); else alert("Konto stworzone!");
}

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if(user) {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('game-app').style.display = 'block';
        document.getElementById('user-display').innerText = user.email;
        
        // Pokazuje panel admina tylko dla Ciebie
        if(user.email === 'strubbe23@gmail.com') {
            document.getElementById('admin-panel').style.display = 'block';
        }
    }
}

async function logout() { 
    await _supabase.auth.signOut(); 
    location.reload(); 
}

checkUser();
