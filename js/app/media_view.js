/* media_view.css */
/* Podstawowe style dla obu trybów */
.media-view, .admin-media-view, .player-media-view {
    min-height: 100vh;
    padding: 20px;
}

/* ===== STYLE DLA ADMINÓW ===== */
.admin-media-view {
    background: #f8fafc;
}

.admin-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    position: relative;
    overflow: hidden;
}

.admin-header::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30%, -30%);
}

.admin-badge {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #1e3a8a;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9em;
    margin-bottom: 15px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
    100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
}

.admin-media-view .media-section {
    background: white;
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.admin-media-view .filter-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f1f5f9;
    border-radius: 10px;
}

.search-input {
    flex: 1;
    padding: 10px 15px;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1em;
    transition: all 0.3s;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select {
    padding: 10px 15px;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    background: white;
    font-size: 1em;
    min-width: 180px;
}

.category-card.admin {
    display: flex;
    align-items: center;
    padding: 25px;
    background: white;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s;
    gap: 25px;
    margin-bottom: 20px;
}

.category-card.admin:hover {
    border-color: #3b82f6;
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.category-card.admin .category-icon {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    color: white;
    flex-shrink: 0;
}

.category-stats {
    display: flex;
    gap: 15px;
    margin-top: 10px;
    font-size: 0.9em;
    color: #64748b;
}

.category-stats .stat {
    display: flex;
    align-items: center;
    gap: 5px;
}

.category-actions {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
}

.importance-select {
    padding: 5px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: white;
    font-size: 0.9em;
    min-width: 120px;
}

.generator-settings {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    margin: 25px 0;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 15px;
}

.setting-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.setting-item label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    margin-bottom: 5px;
    cursor: pointer;
}

.setting-item small {
    color: #64748b;
    font-size: 0.85em;
}

.system-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
}

.management-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}

.management-card {
    text-align: center;
    padding: 25px 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s;
}

.management-card:hover {
    border-color: #3b82f6;
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.management-card i {
    font-size: 2.5em;
    color: #3b82f6;
    margin-bottom: 15px;
}

.management-card h4 {
    margin: 10px 0;
    color: #1e293b;
}

.management-card p {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 15px;
}

/* ===== STYLE DLA GRACZY ===== */
.player-media-view {
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.media-hero {
    position: relative;
    height: 400px;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 40px;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)),
                url('https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80');
    background-size: cover;
    background-position: center;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8));
    mix-blend-mode: overlay;
}

.hero-content {
    position: relative;
    z-index: 2;
    padding: 60px 40px;
    color: white;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.hero-title {
    font-size: 3.5em;
    font-weight: 800;
    margin-bottom: 20px;
    line-height: 1.2;
}

.hero-title .highlight {
    background: linear-gradient(90deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
}

.hero-subtitle {
    font-size: 1.3em;
    opacity: 0.9;
    margin-bottom: 40px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.hero-stats {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
}

.stat-bubble {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px 30px;
    border-radius: 15px;
    text-align: center;
    min-width: 140px;
    transition: transform 0.3s;
}

.stat-bubble:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.25);
}

.stat-bubble i {
    font-size: 2em;
    display: block;
    margin-bottom: 10px;
    color: #93c5fd;
}

.stat-bubble span {
    display: block;
    font-size: 2em;
    font-weight: 700;
    margin-bottom: 5px;
}

.stat-bubble small {
    font-size: 0.9em;
    opacity: 0.8;
}

/* Featured Section */
.featured-section {
    margin-bottom: 50px;
    position: relative;
}

.featured-section .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.featured-section h2 {
    font-size: 1.8em;
    color: #1e293b;
}

.featured-section h2 i {
    color: #f59e0b;
    margin-right: 10px;
}

.carousel-nav {
    display: flex;
    gap: 10px;
}

.carousel-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #e5e7eb;
    background: white;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.carousel-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    transform: scale(1.1);
}

.featured-carousel {
    position: relative;
    height: 400px;
    border-radius: 20px;
    overflow: hidden;
}

.carousel-track {
    display: flex;
    height: 100%;
    transition: transform 0.5s ease;
}

.carousel-slide {
    min-width: 100%;
    height: 100%;
    position: relative;
    opacity: 0;
    transition: opacity 0.5s ease;
}

.carousel-slide.active {
    opacity: 1;
}

.slide-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    transform: scale(1.1);
    transition: transform 5s ease;
}

.carousel-slide.active .slide-background {
    transform: scale(1);
}

.slide-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4));
}

.slide-content {
    position: relative;
    z-index: 2;
    color: white;
    padding: 60px;
    max-width: 600px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.slide-category {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.9em;
    font-weight: 500;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
}

.slide-title {
    font-size: 2.5em;
    font-weight: 700;
    margin-bottom: 20px;
    line-height: 1.2;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-excerpt {
    font-size: 1.1em;
    opacity: 0.9;
    margin-bottom: 30px;
    line-height: 1.6;
}

.slide-meta {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95em;
    opacity: 0.9;
}

.meta-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.read-more-btn {
    align-self: flex-start;
    padding: 12px 25px;
    border-radius: 25px;
    font-weight: 600;
    transition: all 0.3s;
}

.read-more-btn:hover {
    background: white;
    color: #1e293b;
    transform: translateX(10px);
}

.carousel-dots {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}

.carousel-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cbd5e1;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
}

.carousel-dot.active {
    background: #3b82f6;
    transform: scale(1.2);
}

/* Content Grid */
.media-content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
    margin-bottom: 50px;
}

.content-card, .sidebar-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 25px;
}

.card-header {
    padding: 20px 25px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3, .card-header h4 {
    margin: 0;
    color: #1e293b;
}

.filter-tabs {
    display: flex;
    gap: 10px;
}

.filter-tab {
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 20px;
    color: #64748b;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.3s;
}

.filter-tab.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.news-feed {
    padding: 20px;
}

.news-feed-item {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.3s;
}

.news-feed-item:hover {
    background: #f8fafc;
}

.news-item-header {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.news-item-category {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    flex-shrink: 0;
}

.news-item-category.match_result { background: #dbeafe; color: #1d4ed8; }
.news-item-category.transfer { background: #f0f9ff; color: #0369a1; }
.news-item-category.staff_purchase { background: #fef3c7; color: #92400e; }
.news-item-category.promotion_relegation { background: #dcfce7; color: #166534; }
.news-item-category.fan_satisfaction { background: #ffe4e6; color: #be123c; }

.news-item-title {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1e293b;
}

.news-item-meta {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    font-size: 0.85em;
    color: #64748b;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.meta-logo-sm {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
}

.importance-1 { color: #94a3b8; }
.importance-2 { color: #64748b; }
.importance-3 { color: #3b82f6; }
.importance-4 { color: #f59e0b; }
.importance-5 { color: #ef4444; }

.news-item-excerpt {
    color: #475569;
    line-height: 1.6;
    margin-bottom: 15px;
}

.news-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.btn-text {
    background: none;
    border: none;
    color: #3b82f6;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
}

.btn-text:hover {
    background: #eff6ff;
}

.news-stats {
    display: flex;
    gap: 15px;
    color: #94a3b8;
    font-size: 0.9em;
}

.news-stats span {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Sidebar Cards */
.sidebar-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 25px;
}

.sidebar-card .card-header {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.standings-list {
    padding: 20px;
}

.standing-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
}

.standing-row:last-child {
    border-bottom: none;
}

.standing-position {
    width: 30px;
    font-weight: 600;
    color: #475569;
}

.standing-team {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.team-logo-xs {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.team-name {
    font-size: 0.95em;
    font-weight: 500;
    color: #1e293b;
}

.standing-stats {
    display: flex;
    gap: 15px;
    align-items: center;
}

.standing-stats .stat {
    font-weight: 600;
    color: #1e293b;
}

.stat-diff {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.85em;
    font-weight: 600;
}

.stat-diff.positive {
    background: #dcfce7;
    color: #166534;
}

.stat-diff.negative {
    background: #fee2e2;
    color: #991b1b;
}

.top-players {
    padding: 20px;
}

.top-player {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
}

.top-player:last-child {
    border-bottom: none;
}

.player-avatar {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.2em;
    flex-shrink: 0;
}

.player-info {
    flex: 1;
}

.player-name {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
}

.player-details {
    display: flex;
    gap: 10px;
    font-size: 0.85em;
    color: #64748b;
    margin-bottom: 5px;
}

.player-team {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.85em;
    color: #94a3b8;
}

.social-feed {
    padding: 20px;
}

.social-post {
    padding: 15px;
    background: #f8fafc;
    border-radius: 10px;
    margin-bottom: 15px;
}

.social-post:last-child {
    margin-bottom: 0;
}

.post-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 0.9em;
}

.post-header i {
    font-size: 1.2em;
}

.post-header span {
    font-weight: 600;
    color: #1e293b;
}

.post-header small {
    margin-left: auto;
    color: #94a3b8;
}

.social-post p {
    color: #475569;
    line-height: 1.5;
    margin-bottom: 10px;
}

.post-stats {
    display: flex;
    gap: 15px;
    color: #94a3b8;
    font-size: 0.85em;
}

.social-image {
    margin-top: 10px;
}

.image-placeholder {
    width: 100%;
    height: 150px;
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2em;
}

.see-all-link {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    transition: gap 0.3s;
}

.see-all-link:hover {
    gap: 10px;
}

/* Multimedia Section */
.multimedia-section {
    margin-bottom: 50px;
}

.multimedia-section .section-header {
    margin-bottom: 25px;
}

.multimedia-section h2 {
    font-size: 1.8em;
    color: #1e293b;
}

.multimedia-section h2 i {
    color: #8b5cf6;
    margin-right: 10px;
}

.multimedia-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
}

.video-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s;
}

.video-card:hover {
    transform: translateY(-5px);
}

.video-thumbnail {
    position: relative;
    height: 180px;
    overflow: hidden;
}

.thumbnail-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.video-card:hover .thumbnail-img {
    transform: scale(1.05);
}

.play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 1.5em;
    cursor: pointer;
    transition: all 0.3s;
}

.play-button:hover {
    background: white;
    transform: translate(-50%, -50%) scale(1.1);
}

.video-info {
    padding: 20px;
}

.video-info h4 {
    margin: 0 0 10px 0;
    color: #1e293b;
    font-size: 1.1em;
}

.video-info p {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 15px;
    line-height: 1.5;
}

.video-meta {
    display: flex;
    gap: 15px;
    color: #94a3b8;
    font-size: 0.85em;
}

.gallery-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 20px;
    display: flex;
    gap: 20px;
    align-items: center;
}

.gallery-preview {
    flex: 1;
    position: relative;
    height: 150px;
}

.gallery-item {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.5s;
}

.gallery-item.active {
    opacity: 1;
}

.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.gallery-info {
    flex: 1;
}

.gallery-info h4 {
    margin: 0 0 10px 0;
    color: #1e293b;
}

.gallery-info p {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 15px;
}

.gallery-nav {
    display: flex;
    align-items: center;
    gap: 15px;
}

.gallery-nav button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: white;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.gallery-nav button:hover {
    border-color: #3b82f6;
    color: #3b82f6;
}

.gallery-counter {
    font-weight: 600;
    color: #475569;
}

/* Newsletter Section */
.newsletter-section {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    color: white;
    margin-bottom: 50px;
}

.newsletter-content {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.newsletter-icon {
    font-size: 4em;
    color: rgba(255, 255, 255, 0.2);
}

.newsletter-text h3 {
    font-size: 2em;
    margin-bottom: 10px;
}

.newsletter-text p {
    font-size: 1.1em;
    opacity: 0.9;
    margin-bottom: 20px;
}

.newsletter-form {
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 400px;
}

.newsletter-input {
    flex: 1;
    padding: 15px 20px;
    border: none;
    border-radius: 25px;
    font-size: 1em;
    background: rgba(255, 255, 255, 0.9);
}

.newsletter-input:focus {
    outline: none;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.newsletter-btn {
    padding: 15px 30px;
    border-radius: 25px;
    border: none;
    background: #fbbf24;
    color: #1e3a8a;
    font-weight: 600;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s;
}

.newsletter-btn:hover {
    background: #f59e0b;
    transform: translateY(-2px);
}

/* Responsywność */
@media (max-width: 1024px) {
    .media-content-grid {
        grid-template-columns: 1fr;
    }
    
    .hero-title {
        font-size: 2.8em;
    }
}

@media (max-width: 768px) {
    .admin-media-view .filter-bar {
        flex-direction: column;
    }
    
    .category-card.admin {
        flex-direction: column;
        text-align: center;
    }
    
    .category-actions {
        margin-left: 0;
        align-items: center;
    }
    
    .hero-stats {
        flex-direction: column;
        align-items: center;
    }
    
    .featured-carousel {
        height: 300px;
    }
    
    .slide-content {
        padding: 30px;
    }
    
    .slide-title {
        font-size: 1.8em;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2em;
    }
    
    .featured-carousel {
        height: 250px;
    }
    
    .multimedia-grid {
        grid-template-columns: 1fr;
    }
    
    .newsletter-form {
        flex-direction: column;
    }
}
