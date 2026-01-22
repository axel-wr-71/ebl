// js/content-manager.js

let _supabaseInstance = null;

// Domyślne ścieżki (fallback) - dopasowane do struktury GitHub Pages
const DEFAULT_CONTENT_PATHS = {
    terms_of_service: '/content/terms_of_service.html',
    privacy_policy: '/content/privacy_policy.html',
    email_confirm: '/content/emails/confirm_account.html',
    email_welcome: '/content/emails/welcome.html',
    email_password_reset: '/content/emails/password_reset.html',
    help_faq: '/content/help/faq.html',
    about_us: '/content/pages/about.html'
};

// Cache dla załadowanych treści
const CONTENT_CACHE = new Map();
const FILE_CACHE = new Map();

// Style CSS dla modalów treści
const CONTENT_MODAL_STYLES = `
    .content-modal-body {
        padding: 2rem;
        color: #374151;
        line-height: 1.6;
    }
    
    .content-modal-body h1,
    .content-modal-body h2,
    .content-modal-body h3 {
        color: #1a237e;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .content-modal-body h1 {
        font-size: 1.75rem;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }
    
    .content-modal-body h2 {
        font-size: 1.5rem;
    }
    
    .content-modal-body h3 {
        font-size: 1.25rem;
    }
    
    .content-modal-body p {
        margin-bottom: 1rem;
    }
    
    .content-modal-body ul,
    .content-modal-body ol {
        margin-left: 2rem;
        margin-bottom: 1rem;
    }
    
    .content-modal-body li {
        margin-bottom: 0.5rem;
    }
    
    .content-modal-body strong {
        color: #1a237e;
        font-weight: 700;
    }
    
    .content-modal-body a {
        color: #3b82f6;
        text-decoration: underline;
    }
    
    .content-modal-body blockquote {
        border-left: 4px solid #e65100;
        padding-left: 1rem;
        margin-left: 0;
        color: #64748b;
        font-style: italic;
    }
    
    .content-modal-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
    }
    
    .content-modal-body th,
    .content-modal-body td {
        border: 1px solid #e5e7eb;
        padding: 0.75rem;
        text-align: left;
    }
    
    .content-modal-body th {
        background: #f8fafc;
        font-weight: 700;
        color: #1a237e;
    }
    
    .content-modal-body .content-footer {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        color: #64748b;
        font-size: 0.9rem;
    }
`;

/**
 * Dodaje style CSS dla modalów treści
 */
function ensureModalStyles() {
    if (!document.getElementById('content-modal-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'content-modal-styles';
        styleEl.textContent = CONTENT_MODAL_STYLES;
        document.head.appendChild(styleEl);
    }
}

/**
 * Ładuje konfigurację treści z bazy danych
 */
export async function loadContentConfig(supabase) {
    try {
        console.log("[CONTENT] Loading content configuration from database...");
        
        const { data, error } = await supabase
            .from('site_content')
            .select('*')
            .eq('is_active', true)
            .order('content_type');
        
        if (error) {
            console.warn("[CONTENT] Database error:", error.message);
            return DEFAULT_CONTENT_PATHS;
        }
        
        if (data && data.length > 0) {
            console.log(`[CONTENT] Loaded ${data.length} content items`);
            
            // Konwertuj do formatu: { content_key: file_path }
            const contentConfig = {};
            data.forEach(item => {
                if (item.content_key && item.file_path) {
                    contentConfig[item.content_key] = item.file_path;
                }
            });
            
            // Cache w localStorage
            try {
                localStorage.setItem('ebl_content_config', JSON.stringify(contentConfig));
                localStorage.setItem('ebl_content_config_updated', new Date().toISOString());
            } catch (e) {
                console.warn("[CONTENT] Could not cache config:", e);
            }
            
            return contentConfig;
        }
        
        console.log("[CONTENT] No active content items found, using defaults");
        return DEFAULT_CONTENT_PATHS;
        
    } catch (error) {
        console.error("[CONTENT] Error loading content config:", error);
        return DEFAULT_CONTENT_PATHS;
    }
}

/**
 * Pobiera treść z pliku HTML
 */
export async function fetchContent(filePath, useCache = true) {
    if (!filePath) {
        console.warn("[CONTENT] No file path provided");
        return '<div style="padding: 2rem; text-align: center;"><p>Content not available at the moment.</p></div>';
    }
    
    // Sprawdź cache
    if (useCache && FILE_CACHE.has(filePath)) {
        console.log(`[CONTENT] Using cached content for: ${filePath}`);
        return FILE_CACHE.get(filePath);
    }
    
    try {
        console.log(`[CONTENT] Loading content from: ${filePath}`);
        
        // W GitHub Pages używamy ścieżek względnych
        const actualPath = filePath.startsWith('/') ? `.${filePath}` : filePath;
        
        const response = await fetch(actualPath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        
        // Cache'uj
        if (useCache) {
            FILE_CACHE.set(filePath, content);
        }
        
        return content;
        
    } catch (error) {
        console.error(`[CONTENT] Error loading content from ${filePath}:`, error);
        
        // Fallback dla konkretnych kluczy
        const fallbackContent = {
            terms_of_service: `
                <div class="content-container">
                    <h1>Terms of Service</h1>
                    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
                    
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using Elite Buzzer League, you accept and agree to be bound by these Terms of Service.</p>
                    
                    <h2>2. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and password.</p>
                    
                    <h2>3. Game Rules</h2>
                    <p>All users must follow fair play principles and respect other players.</p>
                    
                    <h2>4. Limitation of Liability</h2>
                    <p>Elite Buzzer League is provided "as is" without warranties of any kind.</p>
                    
                    <div class="content-footer">
                        <p>For questions about these terms, contact: support@elitebuzzerleague.com</p>
                    </div>
                </div>
            `,
            privacy_policy: `
                <div class="content-container">
                    <h1>Privacy Policy</h1>
                    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
                    
                    <h2>1. Information We Collect</h2>
                    <p>We collect information you provide directly, such as email address, username, and team name.</p>
                    
                    <h2>2. How We Use Information</h2>
                    <p>Your information is used to provide and improve the game, communicate with you, and ensure security.</p>
                    
                    <h2>3. Data Security</h2>
                    <p>We implement security measures to protect your personal information.</p>
                    
                    <h2>4. Your Rights</h2>
                    <p>You have the right to access, correct, or delete your personal information.</p>
                    
                    <div class="content-footer">
                        <p>For privacy concerns, contact: privacy@elitebuzzerleague.com</p>
                    </div>
                </div>
            `
        };
        
        // Sprawdź czy to któryś z głównych dokumentów
        const key = Object.keys(DEFAULT_CONTENT_PATHS).find(k => DEFAULT_CONTENT_PATHS[k] === filePath);
        if (key && fallbackContent[key]) {
            console.log(`[CONTENT] Using fallback content for: ${key}`);
            FILE_CACHE.set(filePath, fallbackContent[key]);
            return fallbackContent[key];
        }
        
        return '<div style="padding: 2rem; text-align: center;"><p>Content not available at the moment.</p><p>Please try again later.</p></div>';
    }
}

/**
 * Pobiera treść na podstawie klucza
 */
export async function getContentByKey(contentKey, supabase = null, config = null) {
    // Sprawdź w cache
    if (CONTENT_CACHE.has(contentKey)) {
        return CONTENT_CACHE.get(contentKey);
    }
    
    let contentConfig = config;
    const supabaseClient = supabase || _supabaseInstance;
    
    // Jeśli nie podano konfiguracji, spróbuj załadować
    if (!contentConfig && supabaseClient) {
        contentConfig = await loadContentConfig(supabaseClient);
    } else if (!contentConfig) {
        // Spróbuj z localStorage
        try {
            const cachedConfig = localStorage.getItem('ebl_content_config');
            if (cachedConfig) {
                contentConfig = JSON.parse(cachedConfig);
            } else {
                contentConfig = DEFAULT_CONTENT_PATHS;
            }
        } catch {
            contentConfig = DEFAULT_CONTENT_PATHS;
        }
    }
    
    const filePath = contentConfig[contentKey];
    if (!filePath) {
        console.warn(`[CONTENT] No config found for key: ${contentKey}`);
        return null;
    }
    
    const content = await fetchContent(filePath);
    
    if (content) {
        CONTENT_CACHE.set(contentKey, content);
    }
    
    return content;
}

/**
 * Tworzy modal z treścią
 */
function createContentModal() {
    const modal = document.createElement('div');
    modal.id = 'content-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 800px; max-height: 90vh;">
            <div class="modal-header">
                <h2 id="content-modal-title"></h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-form" style="padding: 0;">
                <div id="content-modal-body" class="content-modal-body" 
                     style="max-height: 70vh; overflow-y: auto; padding: 2rem;">
                </div>
            </div>
            <div id="content-modal-footer" class="form-footer" style="display: none;">
                <button id="accept-content-btn" class="btn-submit" style="margin: 0;">
                    I Accept
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Dodaj event listener do zamknięcia
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });
    
    // Kliknięcie poza modalem
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
    
    return modal;
}

/**
 * Pokazuje modal z treścią
 */
export function showContentModal(title, content, options = {}) {
    ensureModalStyles();
    
    let modal = document.getElementById('content-modal');
    if (!modal) {
        modal = createContentModal();
    }
    
    // Ustaw tytuł i treść
    document.getElementById('content-modal-title').textContent = title;
    document.getElementById('content-modal-body').innerHTML = content;
    
    // Obsługa przycisku akceptacji
    const footer = document.getElementById('content-modal-footer');
    const acceptBtn = document.getElementById('accept-content-btn');
    
    if (options.showAcceptButton) {
        footer.style.display = 'block';
        if (options.acceptButtonText) {
            acceptBtn.textContent = options.acceptButtonText;
        }
        
        // Usuń stare event listeners
        const newAcceptBtn = acceptBtn.cloneNode(true);
        acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
        
        // Dodaj nowy event listener
        newAcceptBtn.addEventListener('click', () => {
            if (options.onAccept) options.onAccept();
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    } else {
        footer.style.display = 'none';
    }
    
    // Pokaż modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Autozamknięcie
    if (options.autoClose) {
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }, options.autoClose);
    }
}

/**
 * Ukrywa modal z treścią
 */
export function hideContentModal() {
    const modal = document.getElementById('content-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Pokazuje regulamin
 */
export async function showTerms(supabase = _supabaseInstance, options = {}) {
    try {
        const content = await getContentByKey('terms_of_service', supabase);
        showContentModal(
            'Terms of Service',
            content || '<p>Terms of Service content is not available at the moment.</p>',
            options
        );
    } catch (error) {
        console.error('[CONTENT] Error showing terms:', error);
        showContentModal(
            'Terms of Service',
            '<p>Unable to load Terms of Service. Please try again later.</p>',
            options
        );
    }
}

/**
 * Pokazuje politykę prywatności
 */
export async function showPrivacy(supabase = _supabaseInstance, options = {}) {
    try {
        const content = await getContentByKey('privacy_policy', supabase);
        showContentModal(
            'Privacy Policy',
            content || '<p>Privacy Policy content is not available at the moment.</p>',
            options
        );
    } catch (error) {
        console.error('[CONTENT] Error showing privacy policy:', error);
        showContentModal(
            'Privacy Policy',
            '<p>Unable to load Privacy Policy. Please try again later.</p>',
            options
        );
    }
}

/**
 * Pobiera treść emaila
 */
export async function getEmailTemplate(templateKey, placeholders = {}) {
    try {
        const content = await getContentByKey(templateKey);
        if (!content) return null;
        
        let processedContent = content;
        Object.keys(placeholders).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedContent = processedContent.replace(regex, placeholders[key]);
        });
        
        return {
            subject: placeholders.subject || 'Email from Elite Buzzer League',
            html: processedContent,
            text: stripHtml(processedContent)
        };
    } catch (error) {
        console.error(`[CONTENT] Error getting email template ${templateKey}:`, error);
        return null;
    }
}

/**
 * Konwertuje HTML na tekst
 */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Czyści cache treści
 */
export function clearContentCache() {
    CONTENT_CACHE.clear();
    FILE_CACHE.clear();
    
    try {
        localStorage.removeItem('ebl_content_config');
        localStorage.removeItem('ebl_content_config_updated');
    } catch (e) {
        console.warn("[CONTENT] Could not clear localStorage cache:", e);
    }
    
    console.log("[CONTENT] Cache cleared");
}

/**
 * Inicjalizuje manager treści
 */
export async function initContentManager(supabase, options = {}) {
    console.log("[CONTENT] Initializing content manager...");
    
    // Zapisz instancję Supabase
    _supabaseInstance = supabase;
    
    // Załaduj konfigurację
    const config = await loadContentConfig(supabase);
    
    // Preload ważnych treści
    if (options.preload) {
        const preloadKeys = options.preloadKeys || ['terms_of_service', 'privacy_policy'];
        console.log(`[CONTENT] Preloading ${preloadKeys.length} content items...`);
        
        for (const key of preloadKeys) {
            try {
                await getContentByKey(key, supabase, config);
            } catch (error) {
                console.warn(`[CONTENT] Failed to preload ${key}:`, error);
            }
        }
    }
    
    return {
        config,
        getContent: (key) => getContentByKey(key),
        showTerms: (opts = {}) => showTerms(supabase, opts),
        showPrivacy: (opts = {}) => showPrivacy(supabase, opts),
        getEmailTemplate: (templateKey, placeholders) => getEmailTemplate(templateKey, placeholders),
        clearCache: clearContentCache,
        showContentModal
    };
}

// Dodajemy funkcje do window dla łatwego dostępu z HTML
window.showTerms = () => showTerms();
window.showPrivacy = () => showPrivacy();

// Wczesna inicjalizacja - dodajemy placeholderowe funkcje jeśli nie ma content managera
if (!window.showTerms) {
    window.showTerms = () => {
        console.log('[CONTENT] Content manager not initialized yet');
        showContentModal(
            'Terms of Service',
            '<p>Content manager is still loading. Please try again in a moment.</p>'
        );
    };
}

if (!window.showPrivacy) {
    window.showPrivacy = () => {
        console.log('[CONTENT] Content manager not initialized yet');
        showContentModal(
            'Privacy Policy',
            '<p>Content manager is still loading. Please try again in a moment.</p>'
        );
    };
}
