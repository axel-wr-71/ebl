// js/content-manager.js

// Domyślne ścieżki (fallback)
const DEFAULT_CONTENT_PATHS = {
    terms: '/content/terms.html',
    privacy: '/content/privacy.html',
    email_confirm: '/content/emails/confirm_account.html',
    email_welcome: '/content/emails/welcome.html',
    email_password_reset: '/content/emails/password_reset.html',
    help_faq: '/content/help/faq.html',
    about_us: '/content/pages/about.html'
};

// Cache dla załadowanych treści
const CONTENT_CACHE = new Map();
const FILE_CACHE = new Map();

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
                    contentConfig[item.content_key] = {
                        path: item.file_path,
                        title: item.title,
                        description: item.description,
                        type: item.content_type,
                        language: item.language_code
                    };
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
        return null;
    }
    
    // Sprawdź cache
    if (useCache && FILE_CACHE.has(filePath)) {
        console.log(`[CONTENT] Using cached content for: ${filePath}`);
        return FILE_CACHE.get(filePath);
    }
    
    try {
        console.log(`[CONTENT] Loading content from: ${filePath}`);
        
        const response = await fetch(filePath);
        
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
        
        // Fallback: spróbuj załadować z alternatywnej lokalizacji
        if (filePath.startsWith('/')) {
            const altPath = `.${filePath}`; // Spróbuj z kropką
            try {
                const altResponse = await fetch(altPath);
                if (altResponse.ok) {
                    const altContent = await altResponse.text();
                    FILE_CACHE.set(filePath, altContent);
                    console.log(`[CONTENT] Loaded from alternative path: ${altPath}`);
                    return altContent;
                }
            } catch (altError) {
                console.warn(`[CONTENT] Alternative path also failed: ${altPath}`);
            }
        }
        
        return null;
    }
}

/**
 * Pobiera treść na podstawie klucza
 */
export async function getContentByKey(contentKey, supabase = null, config = null) {
    if (CONTENT_CACHE.has(contentKey)) {
        return CONTENT_CACHE.get(contentKey);
    }
    
    let contentConfig = config;
    
    // Jeśli nie podano konfiguracji, spróbuj załadować
    if (!contentConfig && supabase) {
        contentConfig = await loadContentConfig(supabase);
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
    
    const contentInfo = contentConfig[contentKey];
    if (!contentInfo) {
        console.warn(`[CONTENT] No config found for key: ${contentKey}`);
        return null;
    }
    
    const filePath = typeof contentInfo === 'string' ? contentInfo : contentInfo.path;
    const content = await fetchContent(filePath);
    
    if (content) {
        CONTENT_CACHE.set(contentKey, {
            html: content,
            metadata: typeof contentInfo === 'object' ? contentInfo : { path: filePath }
        });
    }
    
    return content ? { html: content, metadata: contentInfo } : null;
}

/**
 * Pokazuje modal z treścią (dla regulaminu, polityki prywatności, itp.)
 */
export function showContentModal(title, content, options = {}) {
    const modalId = options.modalId || 'content-modal';
    
    // Sprawdź czy już istnieje modal
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        // Stwórz modal
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: ${options.maxWidth || '800px'};">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-form" style="max-height: 70vh; overflow-y: auto; padding: 0;">
                    <div id="content-modal-body" class="content-modal-body">
                        ${content || 'Loading content...'}
                    </div>
                </div>
                ${options.showAcceptButton ? `
                    <div class="form-footer">
                        <button id="accept-content-btn" class="btn-submit" style="margin-top: 20px;">
                            ${options.acceptButtonText || 'I Accept'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        document.body.appendChild(modal);
        
        // Dodaj event listener do zamknięcia
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => hideContentModal(modalId));
        }
        
        // Kliknięcie poza modalem
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideContentModal(modalId);
        });
        
        // Przycisk akceptacji
        const acceptBtn = modal.querySelector('#accept-content-btn');
        if (acceptBtn && options.onAccept) {
            acceptBtn.addEventListener('click', () => {
                options.onAccept();
                hideContentModal(modalId);
            });
        }
    } else {
        // Aktualizuj istniejący modal
        modal.querySelector('.modal-header h2').textContent = title;
        const body = modal.querySelector('#content-modal-body');
        if (body) body.innerHTML = content;
    }
    
    // Pokaż modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Autozamknięcie po czasie (jeśli ustawione)
    if (options.autoClose) {
        setTimeout(() => hideContentModal(modalId), options.autoClose);
    }
    
    return modalId;
}

/**
 * Ukrywa modal z treścią
 */
export function hideContentModal(modalId = 'content-modal') {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Pokazuje regulamin
 */
export async function showTerms(supabase, options = {}) {
    const content = await getContentByKey('terms_of_service', supabase);
    showContentModal(
        'Terms of Service',
        content?.html || '<p>Terms of Service content is not available at the moment.</p>',
        {
            ...options,
            modalId: 'terms-modal',
            showAcceptButton: options.showAcceptButton || false,
            maxWidth: '700px'
        }
    );
}

/**
 * Pokazuje politykę prywatności
 */
export async function showPrivacy(supabase, options = {}) {
    const content = await getContentByKey('privacy_policy', supabase);
    showContentModal(
        'Privacy Policy',
        content?.html || '<p>Privacy Policy content is not available at the moment.</p>',
        {
            ...options,
            modalId: 'privacy-modal',
            showAcceptButton: options.showAcceptButton || false,
            maxWidth: '700px'
        }
    );
}

/**
 * Pobiera treść emaila
 */
export async function getEmailTemplate(templateKey, supabase, placeholders = {}) {
    const content = await getContentByKey(templateKey, supabase);
    
    if (!content?.html) {
        console.warn(`[CONTENT] Email template ${templateKey} not found`);
        return null;
    }
    
    let emailContent = content.html;
    
    // Zamień placeholder-y
    Object.keys(placeholders).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        emailContent = emailContent.replace(regex, placeholders[key]);
    });
    
    return {
        subject: placeholders.subject || content.metadata?.title || 'Email from Elite Buzzer League',
        html: emailContent,
        text: stripHtml(emailContent),
        metadata: content.metadata
    };
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
    
    // Załaduj konfigurację
    const config = await loadContentConfig(supabase);
    
    // Preload ważnych treści
    if (options.preload) {
        const preloadKeys = options.preloadKeys || ['terms_of_service', 'privacy_policy'];
        console.log(`[CONTENT] Preloading ${preloadKeys.length} content items...`);
        
        for (const key of preloadKeys) {
            await getContentByKey(key, supabase, config);
        }
    }
    
    return {
        config,
        getContent: (key) => getContentByKey(key, supabase, config),
        showTerms: (options) => showTerms(supabase, options),
        showPrivacy: (options) => showPrivacy(supabase, options),
        getEmailTemplate: (templateKey, placeholders) => getEmailTemplate(templateKey, supabase, placeholders),
        clearCache: clearContentCache
    };
}
