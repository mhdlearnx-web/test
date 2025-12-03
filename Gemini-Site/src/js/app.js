// State
let state = {
    activeCategory: 'all',
    searchQuery: '',
    theme: localStorage.getItem('theme') || 'dark',
    currentSlide: 0
};

// DOM Elements
const appContent = document.getElementById('app-content');
const promoRibbon = document.getElementById('promo-ribbon');
const navLogo = document.getElementById('nav-logo');
const navRestaurantName = document.getElementById('nav-restaurant-name');
const footerRestaurantName = document.getElementById('footer-restaurant-name');
const yearSpan = document.getElementById('year');
const themeToggle = document.querySelector('.theme-toggle');

// Initialization
function init() {
    setupTheme();
    renderLayout();
    setupEventListeners();
    startSlider();
    renderPromoRibbon();
    lucide.createIcons();
}

function renderPromoRibbon() {
    const promoRibbon = document.getElementById('promo-ribbon');
    if (promoRibbon) {
        promoRibbon.textContent = "🎉 Special Offer: Flat 20% OFF on all Main Course items today! 🕒 Lunch Hours: 12 PM - 3 PM";
        promoRibbon.classList.remove('hidden');
    }
}

// Theme Setup
function setupTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.setAttribute('data-lucide', state.theme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
}

// Render Layout
function renderLayout() {
    // Set Restaurant Info
    navRestaurantName.textContent = restaurantInfo.name;
    footerRestaurantName.textContent = restaurantInfo.name;
    yearSpan.textContent = new Date().getFullYear();

    // Render Home Page by default
    renderHome();
}

// Render Home Page
function renderHome() {
    appContent.innerHTML = `
        <div class="container">
            ${getHeroSliderHTML()}
            ${getCategoryFilterHTML()}
            ${getSearchBarHTML()}
            <div id="menu-grid" class="menu-grid">
                ${getMenuGridHTML()}
            </div>
        </div>
        <!-- Item Details Modal -->
        <div class="modal-overlay" id="modal-overlay"></div>
        <div class="item-modal" id="item-modal">
            <div class="modal-header">
                <h3 style="margin: 0;">Item Details</h3>
                <button class="modal-close" id="modal-close">×</button>
            </div>
            <div class="modal-body" id="modal-body"></div>
        </div>
    `;

    // Re-attach listeners for dynamic content
    attachHomeListeners();
    lucide.createIcons();
}

// HTML Generators
function getHeroSliderHTML() {
    return `
        <div class="hero-slider">
            ${heroSlides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image}')">
                    <div class="slide-content">
                        <span class="slide-badge">${slide.badge}</span>
                        <h2 class="slide-title">${slide.title}</h2>
                        <p>${slide.subtitle}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getCategoryFilterHTML() {
    return `
        <div class="category-filter">
            ${categories.map(cat => `
                <button class="category-chip ${state.activeCategory === cat.id ? 'active' : ''}" 
                        data-id="${cat.id}">
                    <img src="${cat.image}" alt="${cat.name}" class="category-img">
                    <span>${cat.name}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function getSearchBarHTML() {
    return `
        <div class="search-bar-container">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="search-input" placeholder="Search for dishes, ingredients..." value="${state.searchQuery}">
        </div>
    `;
}

function getMenuGridHTML() {
    // Filter by search query first
    const searchFilteredItems = menuItems.filter(item => {
        return item.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    });

    if (searchFilteredItems.length === 0) {
        return `
            <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                <i data-lucide="utensils-crossed" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Try changing your search.</p>
            </div>
        `;
    }

    let htmlContent = '';

    // Determine which categories to show
    const categoriesToShow = state.activeCategory === 'all'
        ? categories
        : categories.filter(c => c.id === state.activeCategory);

    // Iterate categories and build sections
    categoriesToShow.forEach(category => {
        const categoryItems = searchFilteredItems.filter(item => item.category === category.id);

        if (categoryItems.length > 0) {
            // Add Category Section
            htmlContent += `
                <div class="category-section">
                    <h3 class="category-title">${category.name}</h3>
                    <div class="items-carousel">
                        ${categoryItems.map(item => `
                            <div class="menu-item-card ${!item.available ? 'out-of-stock' : ''}" data-item-id="${item.id}">
                                ${!item.available ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                                <div class="card-image-container">
                                    <img src="${item.image}" alt="${item.title}" class="card-image" loading="lazy">
                                    <span class="card-rating">
                                        <i data-lucide="star" class="star-icon"></i> ${item.rating}
                                    </span>
                                </div>
                                <div class="card-content">
                                    <div class="card-header">
                                        <h3 class="item-title">${item.title}</h3>
                                        <span class="item-price">$${item.price}</span>
                                    </div>
                                    <div class="card-meta">
                                        <span class="item-category">${category.name}</span>
                                    </div>
                                    <p class="item-desc">${item.description}</p>
                                    <div class="item-tags">
                                        ${item.offer ? `<span class="tag offer">${item.offer}</span>` : ''}
                                        ${item.isVegetarian ? '<span class="tag" style="color: green; border: 1px solid green;">Veg</span>' : ''}
                                        ${item.isSpicy ? '<span class="tag" style="color: red; border: 1px solid red;">Spicy</span>' : ''}
                                        ${!item.available ? '<span class="tag" style="background: #333; color: white;">Out of Stock</span>' : ''}
                                    </div>
                                    ${item.variants.length > 0 ? `
                                        <div class="item-variants" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                            ${item.variants.map(v => `<span class="tag">${v}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (htmlContent === '') {
        return `
            <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                <i data-lucide="utensils-crossed" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <h3>No items found in this category</h3>
            </div>
        `;
    }

    return htmlContent;
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;

            // Update active state
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

            // Simple routing
            if (page === 'home') {
                renderHome();
            } else {
                renderPage(page);
            }
        });
    });
}

function attachHomeListeners() {
    // Category Filter
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            state.activeCategory = btn.dataset.id;
            updateHomeView();
        });
    });

    // Search
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            updateMenuGrid();
        });
    }

    // Item Card Click
    document.querySelectorAll('.menu-item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const itemId = parseInt(card.dataset.itemId);
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                showItemModal(item);
            }
        });
    });

    // Modal Close
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideItemModal);
    }

    if (modalClose) {
        modalClose.addEventListener('click', hideItemModal);
    }
}

function updateHomeView() {
    // Update chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        if (chip.dataset.id === state.activeCategory) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    updateMenuGrid();
}

function updateMenuGrid() {
    const grid = document.getElementById('menu-grid');
    if (grid) {
        grid.innerHTML = getMenuGridHTML();
        lucide.createIcons();
        attachItemCardListeners();
    }
}

function attachItemCardListeners() {
    document.querySelectorAll('.menu-item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const itemId = parseInt(card.dataset.itemId);
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                showItemModal(item);
            }
        });
    });
}

// Slider Logic
function startSlider() {
    setInterval(() => {
        const slides = document.querySelectorAll('.slide');
        if (slides.length === 0) return;

        slides[state.currentSlide].classList.remove('active');
        state.currentSlide = (state.currentSlide + 1) % slides.length;
        slides[state.currentSlide].classList.add('active');
    }, 5000);
}

// Simple Page Renderer for About, Gallery, Contact
function renderPage(pageName) {
    let content = '';
    switch (pageName) {
        case 'about':
            content = `
                <div class="container" style="padding-top: 2rem;">
                    <h1>About Us</h1>
                    <p style="margin-top: 1rem; color: var(--text-muted);">${restaurantInfo.tagline}</p>
                    <p style="margin-top: 1rem;">Located at ${restaurantInfo.location}, we serve the best food in town.</p>
                </div>
            `;
            break;
        case 'gallery':
            content = `
                <div class="container" style="padding-top: 2rem;">
                    <h1>Gallery</h1>
                    <p style="margin-top: 1rem;">Coming soon...</p>
                </div>
            `;
            break;
        case 'contact':
            content = `
                <div class="container" style="padding-top: 2rem;">
                    <h1>Contact Us</h1>
                    <p style="margin-top: 1rem;"><strong>Phone:</strong> ${restaurantInfo.contact}</p>
                    <p><strong>Address:</strong> ${restaurantInfo.location}</p>
                    <p><strong>Hours:</strong> ${restaurantInfo.hours}</p>
                </div>
            `;
            break;
    }
    appContent.innerHTML = content;
}

// Modal Functions
function showItemModal(item) {
    const modal = document.getElementById('item-modal');
    const overlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');

    const category = categories.find(c => c.id === item.category);

    modalBody.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="modal-image">
        <div class="modal-content-wrapper">
            <div class="modal-meta-row">
                <div class="modal-rating">
                    <i data-lucide="star" style="width: 16px; height: 16px; fill: #FFD700;"></i>
                    ${item.rating}
                </div>
                <span class="modal-category">${category?.name || item.category}</span>
            </div>
            <h2 class="modal-title">${item.title}</h2>
            <div class="modal-price">$${item.price}</div>
            <p class="modal-description">${item.description}</p>
            ${item.variants.length > 0 ? `
                <div class="modal-variants">
                    <h4>Available Variants</h4>
                    <div class="modal-variants-list">
                        ${item.variants.map(v => `<span class="tag">${v}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="modal-tags">
                ${item.offer ? `<span class="tag offer">${item.offer}</span>` : ''}
                ${item.isVegetarian ? '<span class="tag" style="color: green; border: 1px solid green;">Veg</span>' : ''}
                ${item.isSpicy ? '<span class="tag" style="color: red; border: 1px solid red;">Spicy</span>' : ''}
                ${!item.available ? '<span class="tag" style="background: #333; color: white;">Out of Stock</span>' : ''}
            </div>
        </div>
    `;

    lucide.createIcons();
    modal.classList.add('active');
    overlay.classList.add('active');
}

function hideItemModal() {
    const modal = document.getElementById('item-modal');
    const overlay = document.getElementById('modal-overlay');

    modal.classList.remove('active');
    overlay.classList.remove('active');
}

function attachItemCardListeners() {
    document.querySelectorAll('.menu-item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const itemId = parseInt(card.dataset.itemId);
            const item = menuItems.find(i => i.id === itemId);
            if (item && item.available) {
                showItemModal(item);
            }
        });
    });
}

// Run
document.addEventListener('DOMContentLoaded', init);
