import { supabaseClient } from '../auth.js';

export async function renderMediaView(team, players) {
    const container = document.getElementById('m-media');
    if (!container) return;

    container.innerHTML = `
        <div class="media-view">
            <div class="media-header">
                <h1><i class="fas fa-newspaper"></i> Media & Public Relations</h1>
                <p class="subtitle">Zarządzaj personelem medialnym i generuj newsy klubowe</p>
            </div>

            <!-- Sekcja Personelu Medialnego -->
            <div class="media-section">
                <h2><i class="fas fa-user-tie"></i> Twój Personel Medialny</h2>
                <div class="media-staff-container" id="media-staff-list">
                    <div class="loading-spinner">Ładowanie personelu...</div>
                </div>
            </div>

            <!-- Generator Newsów -->
            <div class="media-section">
                <div class="section-header">
                    <h2><i class="fas fa-bullhorn"></i> Generator Newsów Klubowych</h2>
                    <div class="section-actions">
                        <button class="btn btn-primary" id="generate-all-news">
                            <i class="fas fa-magic"></i> Wygeneruj wszystkie newsy
                        </button>
                    </div>
                </div>

                <div class="news-generator-categories">
                    <div class="category-card" data-category="match_result">
                        <div class="category-icon">
                            <i class="fas fa-basketball-ball"></i>
                        </div>
                        <div class="category-info">
                            <h3>Wyniki spotkań</h3>
                            <p>Relacje z ostatnich meczów ligowych i pucharowych</p>
                        </div>
                        <button class="btn btn-sm btn-outline generate-category-btn">
                            Generuj
                        </button>
                    </div>

                    <div class="category-card" data-category="transfer">
                        <div class="category-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="category-info">
                            <h3>Transfery</h3>
                            <p>Informacje o transferach w całej lidze</p>
                        </div>
                        <button class="btn btn-sm btn-outline generate-category-btn">
                            Generuj
                        </button>
                    </div>

                    <div class="category-card" data-category="staff_purchase">
                        <div class="category-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="category-info">
                            <h3>Zakup personelu</h3>
                            <p>Zmiany w sztabach szkoleniowych klubów</p>
                        </div>
                        <button class="btn btn-sm btn-outline generate-category-btn">
                            Generuj
                        </button>
                    </div>

                    <div class="category-card" data-category="promotion_relegation">
                        <div class="category-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="category-info">
                            <h3>Awanse & Spadki</h3>
                            <p>Analiza walki o utrzymanie i awans</p>
                        </div>
                        <button class="btn btn-sm btn-outline generate-category-btn">
                            Generuj
                        </button>
                    </div>

                    <div class="category-card" data-category="fan_satisfaction">
                        <div class="category-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="category-info">
                            <h3>Zadowolenie kibiców</h3>
                            <p>Nastroje na trybunach w całej lidze</p>
                        </div>
                        <button class="btn btn-sm btn-outline generate-category-btn">
                            Generuj
                        </button>
                    </div>
                </div>

                <div class="generator-progress" id="generator-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">Generowanie newsów...</div>
                </div>

                <div class="generator-options">
                    <h3>Opcje generowania</h3>
                    <div class="options-grid">
                        <label class="option-checkbox">
                            <input type="checkbox" id="option-all-teams" checked>
                            <span>Dla wszystkich klubów w lidze</span>
                        </label>
                        <label class="option-checkbox">
                            <input type="checkbox" id="option-skip-existing" checked>
                            <span>Pomiń już istniejące newsy</span>
                        </label>
                        <label class="option-checkbox">
                            <input type="checkbox" id="option-high-importance">
                            <span>Tylko ważne newsy (znaczenie ≥3)</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Ostatnie wygenerowane newsy -->
            <div class="media-section">
                <div class="section-header">
                    <h2><i class="fas fa-history"></i> Ostatnio wygenerowane newsy</h2>
                    <button class="btn btn-sm btn-outline" id="refresh-news">
                        <i class="fas fa-sync"></i> Odśwież
                    </button>
                </div>
                <div class="recent-news-container" id="recent-news">
                    <div class="loading-spinner">Ładowanie newsów...</div>
                </div>
            </div>

            <!-- Statystyki mediów -->
            <div class="media-section">
                <h2><i class="fas fa-chart-bar"></i> Statystyki medialne</h2>
                <div class="media-stats-grid" id="media-stats">
                    <div class="loading-spinner">Ładowanie statystyk...</div>
                </div>
            </div>
        </div>
    `;

    // Inicjalizacja
    await loadMediaStaff(team.id);
    await loadRecentNews(team.id);
    await loadMediaStats(team.id);
    setupEventListeners(team);
}

/**
 * Ładuje personel medialny
 */
async function loadMediaStaff(teamId) {
    try {
        const { data, error } = await supabaseClient
            .from('staff')
            .select('*')
            .eq('team_id', teamId)
            .eq('role', 'media')
            .order('skill', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('media-staff-list');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash fa-3x"></i>
                    <h3>Brak personelu medialnego</h3>
                    <p>Nie masz jeszcze zatrudnionych pracowników mediów.</p>
                    <button class="btn btn-primary" onclick="switchTab('m-staff')">
                        <i class="fas fa-external-link-alt"></i> Przejdź do zakupu personelu
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(staff => `
            <div class="staff-card">
                <div class="staff-header">
                    <div class="staff-avatar">
                        <i class="fas fa-microphone-alt"></i>
                    </div>
                    <div class="staff-info">
                        <h3>${staff.name}</h3>
                        <div class="staff-role">
                            <span class="role-badge">${getMediaRoleName(staff.specialization)}</span>
                            <span class="skill-level">Poziom: ${staff.skill}/10</span>
                        </div>
                    </div>
                    <div class="staff-salary">
                        <i class="fas fa-coins"></i>
                        ${staff.salary.toLocaleString()} PLN/tydz
                    </div>
                </div>
                
                <div class="staff-stats">
                    <div class="stat-item">
                        <span class="stat-label">Wydajność:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${staff.skill * 10}%"></div>
                        </div>
                        <span class="stat-value">${staff.skill * 10}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Zasięg newsów:</span>
                        <span class="stat-value">+${calculateNewsReach(staff.skill)}%</span>
                    </div>
                </div>

                <div class="staff-actions">
                    <button class="btn btn-sm btn-outline btn-train-staff" data-id="${staff.id}">
                        <i class="fas fa-graduation-cap"></i> Szkolenie
                    </button>
                    <button class="btn btn-sm btn-danger btn-fire-staff" data-id="${staff.id}">
                        <i class="fas fa-user-times"></i> Zwolnij
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Błąd ładowania personelu:', err);
        document.getElementById('media-staff-list').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Błąd ładowania personelu: ${err.message}</p>
            </div>
        `;
    }
}

/**
 * Ładuje ostatnie newsy
 */
async function loadRecentNews(teamId) {
    try {
        const { data, error } = await supabaseClient
            .from('club_news')
            .select(`
                *,
                team:teams(team_name, logo_url)
            `)
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const container = document.getElementById('recent-news');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper fa-2x"></i>
                    <p>Nie wygenerowano jeszcze żadnych newsów.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(news => `
            <div class="news-item" data-category="${news.category}">
                <div class="news-header">
                    <span class="news-category ${news.category}">
                        ${getCategoryIcon(news.category)} ${getCategoryName(news.category)}
                    </span>
                    <span class="news-date">Tydzień ${news.week}, Sezon ${news.season}</span>
                    <span class="news-importance importance-${news.importance}">
                        ${'★'.repeat(news.importance)}${'☆'.repeat(5-news.importance)}
                    </span>
                </div>
                <h4 class="news-title">${news.title}</h4>
                <p class="news-content">${news.content}</p>
                <div class="news-footer">
                    <div class="news-views">
                        <i class="fas fa-eye"></i> ${news.views} wyświetleń
                    </div>
                    <div class="news-team">
                        <img src="${news.team.logo_url || '/default-logo.png'}" 
                             alt="${news.team.team_name}" 
                             class="team-logo-sm">
                        ${news.team.team_name}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Błąd ładowania newsów:', err);
    }
}

/**
 * Ładuje statystyki medialne
 */
async function loadMediaStats(teamId) {
    try {
        const { data: statsData, error: statsError } = await supabaseClient
            .from('club_news')
            .select('category, importance, views')
            .eq('team_id', teamId);

        if (statsError) throw statsError;

        // Oblicz statystyki
        const totalNews = statsData.length;
        const totalViews = statsData.reduce((sum, news) => sum + (news.views || 0), 0);
        const avgImportance = totalNews > 0 
            ? (statsData.reduce((sum, news) => sum + news.importance, 0) / totalNews).toFixed(1)
            : 0;

        const categoryCounts = statsData.reduce((acc, news) => {
            acc[news.category] = (acc[news.category] || 0) + 1;
            return acc;
        }, {});

        const container = document.getElementById('media-stats');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${totalNews}</div>
                    <div class="stat-label">Wszystkich newsów</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${totalViews.toLocaleString()}</div>
                    <div class="stat-label">Łącznych wyświetleń</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${avgImportance}</div>
                    <div class="stat-label">Śr. znaczenie</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${Object.keys(categoryCounts).length}</div>
                    <div class="stat-label">Kategorii</div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Błąd ładowania statystyk:', err);
    }
}

/**
 * Generator newsów
 */
async function generateNewsForCategory(team, category, options = {}) {
    const allTeams = options.allTeams || false;
    const skipExisting = options.skipExisting || false;
    const highImportance = options.highImportance || false;

    try {
        let teamsToProcess = [];
        
        if (allTeams) {
            // Pobierz wszystkie drużyny z ligi użytkownika
            const { data: leagueTeams, error: leagueError } = await supabaseClient
                .from('teams')
                .select('id, team_name, league_id')
                .eq('league_id', team.league_id);

            if (leagueError) throw leagueError;
            teamsToProcess = leagueTeams;
        } else {
            teamsToProcess = [team];
        }

        const currentWeek = window.gameState.currentWeek;
        const currentSeason = new Date().getFullYear();
        const generatedNews = [];

        // Sprawdź czy już istnieją newsy dla tego tygodnia (jeśli opcja włączona)
        let existingNews = [];
        if (skipExisting && teamsToProcess.length > 0) {
            const { data: existing } = await supabaseClient
                .from('club_news')
                .select('team_id, category')
                .eq('week', currentWeek)
                .eq('season', currentSeason)
                .eq('category', category)
                .in('team_id', teamsToProcess.map(t => t.id));

            existingNews = existing || [];
        }

        for (const club of teamsToProcess) {
            // Sprawdź czy news już istnieje
            if (skipExisting && existingNews.some(n => 
                n.team_id === club.id && n.category === category)) {
                continue;
            }

            // Generuj news
            const news = await generateSingleNews(club, category, {
                week: currentWeek,
                season: currentSeason,
                highImportance
            });

            if (news) {
                generatedNews.push(news);
            }
        }

        // Zapisz newsy do bazy
        if (generatedNews.length > 0) {
            const { error } = await supabaseClient
                .from('club_news')
                .insert(generatedNews);

            if (error) throw error;

            // Pokaz sukces
            showNotification(`Wygenerowano ${generatedNews.length} newsów w kategorii ${getCategoryName(category)}`, 'success');
        } else {
            showNotification('Nie wygenerowano nowych newsów (wszystkie już istnieją)', 'info');
        }

        return generatedNews;

    } catch (err) {
        console.error('Błąd generowania newsów:', err);
        showNotification('Błąd generowania newsów: ' + err.message, 'error');
        return [];
    }
}

/**
 * Generuje pojedynczy news
 */
async function generateSingleNews(club, category, options) {
    const templates = getNewsTemplates(category);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Losowe znaczenie (1-5)
    let importance = Math.floor(Math.random() * 5) + 1;
    if (options.highImportance) {
        importance = Math.max(3, importance);
    }

    // Uzupełnij treść danymi klubowymi
    let content = template.content;
    
    // Dodaj dynamiczne dane w zależności od kategorii
    switch (category) {
        case 'match_result':
            content = await populateMatchData(content, club.id);
            break;
        case 'transfer':
            content = await populateTransferData(content, club.id);
            break;
        case 'staff_purchase':
            content = await populateStaffData(content, club.id);
            break;
        case 'promotion_relegation':
            content = await populateLeagueData(content, club.id);
            break;
        case 'fan_satisfaction':
            content = await populateFanData(content, club.id);
            break;
    }

    return {
        team_id: club.id,
        title: template.title.replace('{team}', club.team_name),
        content: content,
        category: category,
        week: options.week,
        season: options.season,
        importance: importance,
        created_by: window.userId // Zakładając że mamy globalny userId
    };
}

/**
 * Ustawia event listeners
 */
function setupEventListeners(team) {
    // Przycisk generowania wszystkich newsów
    document.getElementById('generate-all-news')?.addEventListener('click', async () => {
        const allTeams = document.getElementById('option-all-teams').checked;
        const skipExisting = document.getElementById('option-skip-existing').checked;
        const highImportance = document.getElementById('option-high-importance').checked;

        const categories = [
            'match_result',
            'transfer', 
            'staff_purchase',
            'promotion_relegation',
            'fan_satisfaction'
        ];

        const progressBar = document.getElementById('generator-progress');
        const progressFill = progressBar.querySelector('.progress-fill');
        const progressText = progressBar.querySelector('.progress-text');

        progressBar.style.display = 'block';
        
        let generatedTotal = 0;
        
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            progressFill.style.width = `${((i) / categories.length) * 100}%`;
            progressText.textContent = `Generowanie: ${getCategoryName(category)}...`;
            
            const news = await generateNewsForCategory(team, category, {
                allTeams,
                skipExisting,
                highImportance
            });
            
            generatedTotal += news.length;
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Małe opóźnienie dla UX
        }

        progressFill.style.width = '100%';
        progressText.textContent = `Gotowe! Wygenerowano ${generatedTotal} newsów.`;

        // Odśwież widok
        setTimeout(async () => {
            progressBar.style.display = 'none';
            await loadRecentNews(team.id);
            await loadMediaStats(team.id);
        }, 2000);
    });

    // Przyciski generowania per kategoria
    document.querySelectorAll('.generate-category-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.category-card');
            const category = card.dataset.category;
            
            const allTeams = document.getElementById('option-all-teams').checked;
            const skipExisting = document.getElementById('option-skip-existing').checked;
            const highImportance = document.getElementById('option-high-importance').checked;

            await generateNewsForCategory(team, category, {
                allTeams,
                skipExisting,
                highImportance
            });

            // Odśwież widok
            await loadRecentNews(team.id);
            await loadMediaStats(team.id);
        });
    });

    // Przycisk odświeżania newsów
    document.getElementById('refresh-news')?.addEventListener('click', async () => {
        await loadRecentNews(team.id);
        await loadMediaStats(team.id);
        showNotification('Newsy odświeżone', 'success');
    });
}

/**
 * Pomocnicze funkcje
 */
function getMediaRoleName(specialization) {
    const roles = {
        'journalist': 'Dziennikarz',
        'pr_manager': 'PR Manager',
        'social_media': 'Social Media',
        'photographer': 'Fotograf',
        'analyst': 'Analityk mediów'
    };
    return roles[specialization] || specialization;
}

function getCategoryIcon(category) {
    const icons = {
        'match_result': '🏀',
        'transfer': '🔄',
        'staff_purchase': '👥',
        'promotion_relegation': '📈',
        'fan_satisfaction': '❤️'
    };
    return icons[category] || '📰';
}

function getCategoryName(category) {
    const names = {
        'match_result': 'Wynik spotkania',
        'transfer': 'Transfer',
        'staff_purchase': 'Personel',
        'promotion_relegation': 'Awans/Spadek',
        'fan_satisfaction': 'Kibice'
    };
    return names[category] || category;
}

function calculateNewsReach(skill) {
    return Math.floor(skill * 1.5); // +1.5% na poziom umiejętności
}

/**
 * Szablony newsów
 */
function getNewsTemplates(category) {
    const templates = {
        'match_result': [
            {
                title: '{team} pokonuje rywala!',
                content: 'W emocjonującym meczu {team} odniósł ważne zwycięstwo. Kluczową rolę odegrał {player}, który zdobył {points} punktów.'
            },
            {
                title: 'Porażka {team} w ważnym meczu',
                content: 'Niestety, tym razem {team} musiał uznać wyższość rywala. Kibice mają nadzieję na poprawę w kolejnych spotkaniach.'
            }
        ],
        'transfer': [
            {
                title: 'Bombowy transfer {team}!',
                content: '{team} dokonał spektakularnego transferu. Do klubu dołącza {player}, który ma wzmocnić {position}.'
            },
            {
                title: 'Młodzieżowiec w {team}',
                content: 'Klub postawił na młodość! Do pierwszego zespołu dołącza utalentowany {player}.'
            }
        ],
        'staff_purchase': [
            {
                title: 'Nowy specjalista w {team}',
                content: '{team} zatrudnił nowego {role}. To posunięcie ma poprawić {aspect} w klubie.'
            }
        ],
        'promotion_relegation': [
            {
                title: 'Walka o awans dla {team}',
                content: '{team} jest coraz bliżej celu! Po {round} kolejkach klub zajmuje {position} miejsce.'
            },
            {
                title: '{team} walczy o utrzymanie',
                content: 'Sytuacja {team} jest trudna. Klub musi zebrać się w sobie, by uniknąć spadku.'
            }
        ],
        'fan_satisfaction': [
            {
                title: 'Kibice {team} zadowoleni',
                content: 'Po ostatnich wynikach, kibice {team} są pełni optymizmu. Na trybunach panuje doskonała atmosfera.'
            },
            {
                title: 'Nerwy wśród kibiców {team}',
                content: 'Kibice {team} wyrażają niezadowolenie z ostatnich wyników. Domagają się zmian w zespole.'
            }
        ]
    };

    return templates[category] || [{ title: 'News', content: 'Treść newsa.' }];
}

/**
 * Funkcje do uzupełniania danych
 */
async function populateMatchData(template, teamId) {
    // Pobierz ostatnie mecze drużyny
    try {
        const { data: matches, error } = await supabaseClient
            .from('matches')
            .select('*')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('match_date', { ascending: false })
            .limit(1);

        if (!error && matches && matches.length > 0) {
            const match = matches[0];
            return template
                .replace('{player}', 'kapitan drużyny')
                .replace('{points}', match.home_score || '0');
        }
    } catch (err) {
        console.error('Błąd pobierania meczów:', err);
    }
    
    return template.replace('{player}', 'gracz').replace('{points}', 'kilka');
}

async function populateTransferData(template, teamId) {
    // Można dodać logikę pobierania ostatnich transferów
    return template.replace('{player}', 'nowy zawodnik').replace('{position}', 'atak');
}

async function populateStaffData(template, teamId) {
    return template.replace('{role}', 'specjalista').replace('{aspect}', 'wyniki');
}

async function populateLeagueData(template, teamId) {
    // Pobierz pozycję w lidze
    try {
        const { data: standing, error } = await supabaseClient
            .from('league_standings')
            .select('position')
            .eq('team_id', teamId)
            .eq('season', new Date().getFullYear())
            .single();

        if (!error && standing) {
            return template.replace('{position}', `${standing.position}.`);
        }
    } catch (err) {
        console.error('Błąd pobierania tabeli:', err);
    }
    
    return template.replace('{position}', 'środkowe').replace('{round}', 'kilku');
}

async function populateFanData(template, teamId) {
    // Można dodać logikę obliczania zadowolenia kibiców
    return template;
}

/**
 * Pokazuje powiadomienie
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}
