// js/config.js

// Domyślna konfiguracja - fallback jeśli baza nie ma danych
export const APP_CONFIG = {
    // Teksty regulaminu i polityki prywatności
    terms: {
        title: "Terms of Service",
        content: `## Elite Buzzer League Terms of Service
        
### 1. Acceptance of Terms
By registering an account, you agree to these Terms of Service...

### 2. Game Rules
- Respect other players
- No cheating or using exploits
- Follow fair play principles...

### 3. Account Management
You are responsible for maintaining the security of your account...

*Last updated: ${new Date().toLocaleDateString('en-US')}*`,
        
        acceptText: "I accept the Terms of Service and Privacy Policy",
        requiredText: "(required to create an account)"
    },
    
    privacy: {
        title: "Privacy Policy",
        content: `## Elite Buzzer League Privacy Policy
        
### 1. Data Collection
We collect only necessary information for game operation...

### 2. Data Usage
Your data is used exclusively for:
- Game functionality
- Account management
- Communication about updates...

### 3. Data Protection
We implement security measures to protect your information...

*Last updated: ${new Date().toLocaleDateString('en-US')}*`
    },
    
    // Teksty newslettera
    newsletter: {
        title: "Newsletter Subscription",
        description: "Get game updates, special offers, and news about Elite Buzzer League",
        acceptText: "I agree to receive notifications and updates",
        subscribeText: "Subscribe to newsletter"
    },
    
    // Teksty formularza rejestracji
    registration: {
        title: "EBL Registration",
        emailLabel: "Email Address",
        passwordLabel: "Password (min. 8 characters)",
        passwordConfirmLabel: "Confirm Password",
        usernameLabel: "Username",
        teamNameLabel: "Your Team Name",
        countryLabel: "Country of Origin",
        
        hints: {
            password: "Password must contain at least 8 characters",
            passwordConfirm: "Re-enter your password for verification",
            username: "Will be visible to other players",
            country: "Select your country from the dropdown menu"
        },
        
        submitText: "Create Account",
        loadingText: "Registering...",
        successMessage: "✅ Registration successful! Check your email to confirm your account.",
        termsRequired: "You must accept the Terms of Service and Privacy Policy",
        passwordsMismatch: "Passwords do not match",
        
        // Walidacja
        validation: {
            emailRequired: "Please enter a valid email address",
            passwordLength: "Password must be at least 8 characters long",
            passwordComplexity: "Password must contain at least one lowercase letter, one uppercase letter, and one number",
            usernameLength: "Username must be at least 3 characters",
            teamNameLength: "Team name must be at least 3 characters",
            countryRequired: "Please select your country",
            fieldsRequired: "Please fill in all required fields"
        }
    },
    
    // Teksty logowania
    login: {
        title: "EBL Login",
        emailLabel: "Email",
        passwordLabel: "Password",
        submitText: "Login",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account?",
        registerLink: "Register here",
        hasAccount: "Already have an account?",
        loginLink: "Login here"
    },
    
    // Błędy
    errors: {
        userExists: "User with this email already exists",
        emailNotConfirmed: "Please confirm your email before logging in",
        invalidCredentials: "Invalid email or password",
        registrationFailed: "An unexpected error occurred during registration",
        loginFailed: "An unexpected error occurred during login"
    }
};

// Eksport funkcji pomocniczych
export function getConfig() {
    return APP_CONFIG;
}

export function updateConfig(newConfig) {
    Object.assign(APP_CONFIG, newConfig);
    console.log("[CONFIG] Configuration updated");
    return APP_CONFIG;
}

// Sprawdź czy istnieje konfiguracja w localStorage
export function loadConfigFromStorage() {
    try {
        const savedConfig = localStorage.getItem('ebl_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            updateConfig(parsed);
            console.log("[CONFIG] Loaded from localStorage");
            return true;
        }
    } catch (e) {
        console.warn("[CONFIG] Could not load config from localStorage:", e);
    }
    return false;
}

// Zapisz konfigurację do localStorage
export function saveConfigToStorage() {
    try {
        localStorage.setItem('ebl_config', JSON.stringify(APP_CONFIG));
        console.log("[CONFIG] Saved to localStorage");
        return true;
    } catch (e) {
        console.warn("[CONFIG] Could not save config to localStorage:", e);
    }
    return false;
}

// Pobierz konfigurację z tabeli site_settings w bazie danych
export async function loadConfigFromDatabase(supabase) {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('setting_key, setting_value, setting_type')
            .eq('setting_type', 'registration_texts');
        
        if (error) {
            console.error("[CONFIG] Database error:", error);
            return false;
        }
        
        if (data && data.length > 0) {
            console.log("[CONFIG] Found", data.length, "settings in database");
            
            // Konwertuj dane z bazy na obiekt konfiguracji
            const dbConfig = convertDbSettingsToConfig(data);
            
            // Zaktualizuj konfigurację z bazy
            updateConfig(dbConfig);
            
            // Zapisz w localStorage jako cache
            saveConfigToStorage();
            
            console.log("[CONFIG] Loaded from database successfully");
            return true;
        } else {
            console.log("[CONFIG] No settings found in database, using defaults");
            return false;
        }
        
    } catch (e) {
        console.warn("[CONFIG] Could not load config from database:", e);
        return false;
    }
}

// Konwertuj ustawienia z bazy na strukturę konfiguracji
function convertDbSettingsToConfig(dbSettings) {
    const config = {};
    
    dbSettings.forEach(setting => {
        const { setting_key, setting_value, setting_type } = setting;
        
        try {
            // Próbuj sparsować JSON, jeśli to tekst, użyj jako string
            let value;
            try {
                value = JSON.parse(setting_value);
            } catch (e) {
                value = setting_value;
            }
            
            // Tworzenie zagnieżdżonej struktury na podstawie klucza
            const keys = setting_key.split('.');
            let current = config;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            
        } catch (e) {
            console.warn(`[CONFIG] Error processing setting ${setting_key}:`, e);
        }
    });
    
    return config;
}

// Zapisz konfigurację do bazy danych
export async function saveConfigToDatabase(supabase, config = null) {
    try {
        const configToSave = config || APP_CONFIG;
        
        // Konwertuj obiekt konfiguracji na płaską strukturę dla bazy
        const settingsToSave = convertConfigToDbSettings(configToSave);
        
        // Usuń stare ustawienia tego typu
        const { error: deleteError } = await supabase
            .from('site_settings')
            .delete()
            .eq('setting_type', 'registration_texts');
        
        if (deleteError) throw deleteError;
        
        // Wstaw nowe ustawienia
        const { error: insertError } = await supabase
            .from('site_settings')
            .insert(settingsToSave);
        
        if (insertError) throw insertError;
        
        console.log("[CONFIG] Saved to database successfully");
        return true;
        
    } catch (e) {
        console.error("[CONFIG] Could not save config to database:", e);
        return false;
    }
}

// Konwertuj obiekt konfiguracji na płaską strukturę dla bazy
function convertConfigToDbSettings(config, prefix = '', result = [], settingType = 'registration_texts') {
    for (const [key, value] of Object.entries(config)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Rekurencyjnie przetwórz zagnieżdżone obiekty
            convertConfigToDbSettings(value, fullKey, result, settingType);
        } else {
            // Zapisz wartość jako JSON jeśli to obiekt/array, inaczej jako string
            const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            result.push({
                setting_key: fullKey,
                setting_value: settingValue,
                setting_type: settingType,
                updated_at: new Date().toISOString()
            });
        }
    }
    
    return result;
}

// Utwórz domyślne ustawienia w bazie jeśli nie istnieją
export async function initializeDefaultSettings(supabase) {
    try {
        // Sprawdź czy istnieją już ustawienia
        const { data: existingSettings } = await supabase
            .from('site_settings')
            .select('setting_key')
            .eq('setting_type', 'registration_texts')
            .limit(1);
        
        if (!existingSettings || existingSettings.length === 0) {
            console.log("[CONFIG] No settings found, creating defaults...");
            
            // Zapisz domyślną konfigurację do bazy
            const saved = await saveConfigToDatabase(supabase, APP_CONFIG);
            
            if (saved) {
                console.log("[CONFIG] Default settings created in database");
                return true;
            }
        }
        
        return false;
        
    } catch (e) {
        console.error("[CONFIG] Error initializing default settings:", e);
        return false;
    }
}
