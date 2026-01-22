// js/admin/config-admin.js
import { 
    APP_CONFIG, 
    updateConfig, 
    saveConfigToDatabase,
    loadConfigFromDatabase,
    saveConfigToStorage 
} from '../config.js';

export async function initConfigAdmin(supabase) {
    console.log("[ADMIN] Initializing configuration admin");
    
    // Załaduj aktualną konfigurację
    await loadConfigFromDatabase(supabase);
    
    // Sprawdź czy jesteśmy w panelu admina
    if (!document.getElementById('config-admin-container')) {
        console.log("[ADMIN] No admin container found");
        return;
    }
    
    // Renderuj interfejs administracyjny
    renderConfigAdmin();
    
    // Dodaj event listeners
    document.getElementById('save-config-btn')?.addEventListener('click', async () => {
        await saveConfigFromForm(supabase);
    });
    
    document.getElementById('reset-config-btn')?.addEventListener('click', async () => {
        await resetToDefaults(supabase);
    });
    
    document.getElementById('refresh-config-btn')?.addEventListener('click', async () => {
        await refreshFromDatabase(supabase);
    });
}

// Renderuj interfejs do edycji konfiguracji
function renderConfigAdmin() {
    const container = document.getElementById('config-admin-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="config-admin-panel">
            <h2>⚙️ Site Settings Configuration</h2>
            <p class="config-subtitle">Manage registration texts, terms, and newsletter content</p>
            
            <div class="config-sections">
                <div class="config-section">
                    <h3>📝 Terms of Service</h3>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="terms-title" value="${APP_CONFIG.terms.title || ''}" class="config-input">
                    </div>
                    <div class="form-group">
                        <label>Acceptance Text</label>
                        <input type="text" id="terms-accept-text" value="${APP_CONFIG.terms.acceptText || ''}" class="config-input">
                    </div>
                    <div class="form-group">
                        <label>Full Content (Markdown supported)</label>
                        <textarea id="terms-content" rows="10" class="config-textarea">${APP_CONFIG.terms.content || ''}</textarea>
                    </div>
                </div>
                
                <div class="config-section">
                    <h3>📜 Privacy Policy</h3>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="privacy-title" value="${APP_CONFIG.privacy.title || ''}" class="config-input">
                    </div>
                    <div class="form-group">
                        <label>Full Content (Markdown supported)</label>
                        <textarea id="privacy-content" rows="10" class="config-textarea">${APP_CONFIG.privacy.content || ''}</textarea>
                    </div>
                </div>
                
                <div class="config-section">
                    <h3>📧 Newsletter</h3>
                    <div class="form-group">
                        <label>Acceptance Text</label>
                        <input type="text" id="newsletter-accept-text" value="${APP_CONFIG.newsletter.acceptText || ''}" class="config-input">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="newsletter-description" value="${APP_CONFIG.newsletter.description || ''}" class="config-input">
                    </div>
                </div>
                
                <div class="config-section">
                    <h3>✅ Registration Form</h3>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="registration-title" value="${APP_CONFIG.registration.title || ''}" class="config-input">
                    </div>
                    <div class="form-group">
                        <label>Success Message</label>
                        <input type="text" id="registration-success-message" value="${APP_CONFIG.registration.successMessage || ''}" class="config-input">
                    </div>
                </div>
            </div>
            
            <div class="config-actions">
                <button id="refresh-config-btn" class="btn-secondary">
                    🔄 Refresh from Database
                </button>
                <button id="reset-config-btn" class="btn-warning">
                    ↩️ Reset to Defaults
                </button>
                <button id="save-config-btn" class="btn-primary">
                    💾 Save to Database
                </button>
            </div>
            
            <div class="config-status" id="config-status"></div>
        </div>
    `;
}

// Zapisz konfigurację z formularza
async function saveConfigFromForm(supabase) {
    try {
        // Pobierz wartości z formularza
        const updatedConfig = {
            terms: {
                title: document.getElementById('terms-title').value,
                acceptText: document.getElementById('terms-accept-text').value,
                content: document.getElementById('terms-content').value
            },
            privacy: {
                title: document.getElementById('privacy-title').value,
                content: document.getElementById('privacy-content').value
            },
            newsletter: {
                acceptText: document.getElementById('newsletter-accept-text').value,
                description: document.getElementById('newsletter-description').value
            },
            registration: {
                title: document.getElementById('registration-title').value,
                successMessage: document.getElementById('registration-success-message').value
            }
        };
        
        // Zaktualizuj lokalną konfigurację
        updateConfig(updatedConfig);
        
        // Zapisz do bazy danych
        const saved = await saveConfigToDatabase(supabase);
        
        if (saved) {
            showStatus("✅ Configuration saved to database successfully!", "success");
            
            // Zapisz też do localStorage jako cache
            saveConfigToStorage();
            
            // Odśwież widok po 2 sekundach
            setTimeout(() => {
                renderConfigAdmin();
                showStatus("Configuration updated in UI", "info");
            }, 2000);
        } else {
            showStatus("❌ Failed to save configuration to database", "error");
        }
        
    } catch (error) {
        console.error("[ADMIN] Error saving configuration:", error);
        showStatus("❌ Error: " + error.message, "error");
    }
}

// Zresetuj do domyślnych wartości
async function resetToDefaults(supabase) {
    if (confirm("Are you sure you want to reset to default configuration? This will overwrite all custom texts.")) {
        try {
            // Użyj domyślnej konfiguracji z config.js
            const defaultConfig = window.APP_CONFIG_DEFAULTS || {};
            
            // Zaktualizuj i zapisz
            updateConfig(defaultConfig);
            await saveConfigToDatabase(supabase);
            saveConfigToStorage();
            
            showStatus("✅ Configuration reset to defaults!", "success");
            
            // Odśwież widok
            setTimeout(() => {
                renderConfigAdmin();
            }, 500);
            
        } catch (error) {
            console.error("[ADMIN] Error resetting configuration:", error);
            showStatus("❌ Error resetting configuration", "error");
        }
    }
}

// Odśwież z bazy danych
async function refreshFromDatabase(supabase) {
    try {
        const loaded = await loadConfigFromDatabase(supabase);
        
        if (loaded) {
            showStatus("✅ Configuration refreshed from database!", "success");
            renderConfigAdmin();
        } else {
            showStatus("⚠️ Using cached configuration", "warning");
        }
        
    } catch (error) {
        console.error("[ADMIN] Error refreshing configuration:", error);
        showStatus("❌ Error refreshing configuration", "error");
    }
}

// Pokaż status
function showStatus(message, type = "info") {
    const statusEl = document.getElementById('config-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `config-status ${type}`;
    
    // Ukryj po 5 sekundach
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'config-status';
    }, 5000);
}

// CSS dla panelu administracyjnego
export const configAdminStyles = `
    .config-admin-panel {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 800px;
        margin: 0 auto;
    }
    
    .config-admin-panel h2 {
        color: #1a237e;
        margin-bottom: 8px;
    }
    
    .config-subtitle {
        color: #64748b;
        margin-bottom: 24px;
        font-size: 0.95rem;
    }
    
    .config-sections {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 32px;
    }
    
    .config-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
    }
    
    .config-section h3 {
        color: #374151;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .config-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.95rem;
        margin-bottom: 12px;
    }
    
    .config-textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: 'Inter', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        resize: vertical;
        min-height: 150px;
    }
    
    .config-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
    }
    
    .btn-primary, .btn-secondary, .btn-warning {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
    }
    
    .btn-primary {
        background: #1a237e;
        color: white;
    }
    
    .btn-primary:hover {
        background: #3949ab;
    }
    
    .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
    }
    
    .btn-secondary:hover {
        background: #e2e8f0;
    }
    
    .btn-warning {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
    }
    
    .btn-warning:hover {
        background: #fde68a;
    }
    
    .config-status {
        margin-top: 16px;
        padding: 12px;
        border-radius: 6px;
        font-weight: 600;
        text-align: center;
        transition: all 0.3s;
    }
    
    .config-status.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }
    
    .config-status.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
    
    .config-status.warning {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
    }
    
    .config-status.info {
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #bfdbfe;
    }
`;
