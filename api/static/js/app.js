// Use empty string so fetches are relative to the current origin by default.
// Override with a full URL if you need a different backend host/port.
const BACKEND_BASE = 'http://127.0.0.1:8000'; // e.g. 'http://127.0.0.1:8000'

let appData = {};
let currentUser = null;
let currentPage = 'dashboard';
let realTimeCounter = 0;

// Guarded DOM queries (may be null if elements are not present in the template)
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loadingScreen = document.getElementById('loading-screen');

// --- NEW: Function to fetch data from the backend ---
async function fetchData() {
    try {
        if (loadingScreen) showLoading(true);

        // Use relative path so frontend and backend served from same origin work
        const url = `${BACKEND_BASE}/api/data`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        appData = await response.json();
        console.log('Data fetched successfully:', appData);

    } catch (error) {
        console.warn("Could not fetch data:", error);
        // keep going — don't block UI init
    } finally {
        if (loadingScreen) showLoading(false);
    }
}

async function checkBackend() {
    try {
        const res = await fetch(`${BACKEND_BASE}/health`, { cache: 'no-store' });
        if (!res.ok) {
            console.warn('Backend /health returned status', res.status);
            return false;
        }
        console.log('Backend reachable: /health OK');
        return true;
    } catch (err) {
        console.error('Backend check failed:', err);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const backendOk = await checkBackend();
    if (!backendOk) {
        // keep concise: user-visible alert + console detail
        alert('Failed to connect to the backend server. Please make sure it is running (127.0.0.1:8000).');
    }
    // always init UI so login can still work for demo credentials
    initializeApp();

    // start fetching app data but don't block UI if it fails
    fetchData().catch(err => console.warn(err));
});

function initializeApp() {
    initializeTheme();
    setupLoginForm();
    setupNavigation();
    setupLogout();
    setupCalculator();
    setupPackaging();
    setupRealTimeUpdates();
    initializeTooltips();
    setupResponsiveNavigation();
    setupThemeToggle();
    initializeMobileFeatures();
    // Show login screen initially
    showScreen('login');
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    if (screenName === 'login' && loginScreen) {
        loginScreen.classList.add('active');
    } else if (screenName === 'main' && mainApp) {
        mainApp.classList.add('active');
    }
}

function showLoading(show = true) {
    if (!loadingScreen) return;
    if (show) {
        loadingScreen.classList.add('show');
        // Add progress bar animation
        const progressBar = loadingScreen.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 100);
        }
    } else {
        loadingScreen.classList.remove('show');
    }
}

// Add user feedback functions
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
    
    // Add animation
    notification.classList.add('animate-slide-in');
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle-fill',
        'danger': 'exclamation-triangle-fill',
        'warning': 'exclamation-circle-fill',
        'info': 'info-circle-fill'
    };
    return icons[type] || 'info-circle-fill';
}

// Theme System
function initializeTheme() {
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('carbontracker-theme') || 'dark';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark');
    body.classList.remove('theme-light', 'theme-dark');
    
    // Apply new theme
    html.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);
    
    // Update Bootstrap theme attribute
    html.setAttribute('data-bs-theme', theme);
    
    // Update CSS custom property for theme
    html.setAttribute('data-color-scheme', theme);
    
    // Save theme preference
    localStorage.setItem('carbontracker-theme', theme);
    
    // Update theme toggle buttons
    updateThemeToggleButtons(theme);
    
    // Update existing charts with new theme colors
    updateChartsForTheme();
    
    // Trigger custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('carbontracker-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function updateThemeToggleButtons(theme) {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');
    themeToggleButtons.forEach(button => {
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
        button.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
}

function setupThemeToggle() {
    // Create theme toggle button if it doesn't exist
    const navbar = document.querySelector('.navbar-nav.me-auto');
    if (navbar && !document.querySelector('.theme-toggle')) {
        const themeToggle = document.createElement('li');
        themeToggle.className = 'nav-item';
        themeToggle.innerHTML = `
            <button class="nav-link theme-toggle btn btn-link border-0 bg-transparent" title="Toggle theme">
                <i class="bi bi-sun-fill"></i>
            </button>
        `;
        navbar.appendChild(themeToggle);
    }
    
    // Add event listeners to all theme toggle buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.theme-toggle')) {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// Responsive Navigation
function setupResponsiveNavigation() {
    // Mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.navbar') && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });
        
        // Close mobile menu when clicking nav links
        const navLinks = navbarCollapse.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) { // Bootstrap lg breakpoint
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }
    
    // Handle responsive behavior for different screen sizes
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
}

function handleResize() {
    const width = window.innerWidth;
    
    // Adjust dashboard layout for mobile
    if (width < 768) {
        adjustMobileLayout();
    } else if (width < 1200) {
        adjustTabletLayout();
    } else {
        adjustDesktopLayout();
    }
    
    // Update chart responsiveness
    updateChartResponsiveness();
}

function adjustMobileLayout() {
    // Stack metric cards vertically on mobile
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) {
        metricsGrid.style.gridTemplateColumns = '1fr';
    }
    
    // Adjust form layouts
    const formGrids = document.querySelectorAll('.form-grid');
    formGrids.forEach(grid => {
        grid.style.gridTemplateColumns = '1fr';
    });
    
    // Make tables scrollable
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.closest('.table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

function adjustTabletLayout() {
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) {
        metricsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
    
    const formGrids = document.querySelectorAll('.form-grid');
    formGrids.forEach(grid => {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    });
}

function adjustDesktopLayout() {
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid) {
        metricsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    
    const formGrids = document.querySelectorAll('.form-grid');
    formGrids.forEach(grid => {
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    });
}

function updateChartResponsiveness() {
    // Update Chart.js charts to be responsive
    if (window.Chart && window.Chart.instances) {
        Object.values(window.Chart.instances).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
}

function getThemeColors() {
    const currentTheme = localStorage.getItem('carbontracker-theme') || 'dark';
    
    if (currentTheme === 'dark') {
        return {
            primary: '#32B4CD',       // Teal-300
            primaryTransparent: 'rgba(50, 184, 205, 0.1)',
            warning: '#E6816D',       // Orange-400
            warningTransparent: 'rgba(230, 129, 109, 0.1)',
            error: '#FF545D',         // Red-400
            errorTransparent: 'rgba(255, 84, 93, 0.1)',
            success: '#32B4CD',       // Teal-300
            successTransparent: 'rgba(50, 184, 205, 0.1)',
            text: '#F5F5F5',          // Gray-200
            textSecondary: 'rgba(167, 169, 169, 0.7)', // Gray-300 with opacity
            border: 'rgba(119, 124, 124, 0.3)',        // Gray-400 with opacity
            background: '#1F2121',    // Charcoal-700
            surface: '#262828',       // Charcoal-800
            chartPalette: [
                '#32B4CD', '#E6816D', '#FF545D', '#A8AD6F', '#626C71', '#C05E3F'
            ]
        };
    } else {
        return {
            primary: '#208D8D',       // Teal-500
            primaryTransparent: 'rgba(33, 128, 141, 0.1)',
            warning: '#A84B2F',       // Orange-500
            warningTransparent: 'rgba(168, 75, 47, 0.1)',
            error: '#C0152F',         // Red-500
            errorTransparent: 'rgba(192, 21, 47, 0.1)',
            success: '#208D8D',       // Teal-500
            successTransparent: 'rgba(33, 128, 141, 0.1)',
            text: '#13343B',          // Slate-900
            textSecondary: 'rgba(98, 108, 113, 1)', // Slate-500
            border: 'rgba(94, 82, 64, 0.2)',        // Brown-600 with opacity
            background: '#FCFCF9',    // Cream-50
            surface: '#FFFEFD',       // Cream-100
            chartPalette: [
                '#208D8D', '#A84B2F', '#C0152F', '#5E5240', '#626C71', '#DB4545'
            ]
        };
    }
}

function updateChartsForTheme() {
    // Destroy existing charts and recreate them with new theme colors
    if (window.Chart && window.Chart.instances) {
        Object.values(window.Chart.instances).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
    
    // Recreate charts with new theme colors
    setTimeout(() => {
        if (currentPage === 'dashboard') {
            createTrendChart();
            createIndustryChart();
        } else if (currentPage === 'analytics') {
            createAnalyticsChart();
            createForecastChart();
        }
    }, 100);
}

// Mobile-specific interactions
function initializeMobileInteractions() {
    // Add swipe support for navigation
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', function(e) {
        if (!startX || !startY) return;
        
        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        
        let diffX = startX - endX;
        let diffY = startY - endY;
        
        // Only handle horizontal swipes
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - next page
                navigateToNextPage();
            } else {
                // Swipe right - previous page
                navigateToPreviousPage();
            }
        }
        
        startX = 0;
        startY = 0;
    });
}

function navigateToNextPage() {
    const pages = ['dashboard', 'calculator', 'packaging', 'credits', 'analytics'];
    const currentIndex = pages.indexOf(currentPage);
    const nextIndex = (currentIndex + 1) % pages.length;
    showPage(pages[nextIndex]);
}

function navigateToPreviousPage() {
    const pages = ['dashboard', 'calculator', 'packaging', 'credits', 'analytics'];
    const currentIndex = pages.indexOf(currentPage);
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    showPage(pages[prevIndex]);
}

// Add mobile interactions to initialization
function initializeMobileFeatures() {
    if ('ontouchstart' in window) {
        initializeMobileInteractions();
        
        // Add pull-to-refresh functionality
        let startY = 0;
        let pullDistance = 0;
        const pullThreshold = 100;
        
        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (startY && window.scrollY === 0) {
                pullDistance = e.touches[0].clientY - startY;
                if (pullDistance > 0) {
                    // Visual feedback for pull-to-refresh
                    document.body.style.transform = `translateY(${Math.min(pullDistance / 3, 50)}px)`;
                }
            }
        });
        
        document.addEventListener('touchend', function(e) {
            if (pullDistance > pullThreshold) {
                // Trigger refresh
                location.reload();
            }
            document.body.style.transform = '';
            startY = 0;
            pullDistance = 0;
        });
    }
}

// Login System
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.warn('login-form not found in DOM');
        return;
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const roleEl = document.getElementById('role');

        const email = emailEl ? emailEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value.trim() : '';
        let role = roleEl ? roleEl.value : '';

        // If you want server-side authentication, POST to /login here.
        // This demo uses client-side demo credentials for offline testing.
        const validCredentials = {
            'admin@carbontracker.com': { password: 'admin123', role: 'admin', name: 'John Admin', company: 'CarbonTracker Pro' },
            'sarah@steelcorp.com': { password: 'company123', role: 'company', name: 'Sarah Manager', company: 'Steel Corp Ltd' },
            'mike@consulting.com': { password: 'viewer123', role: 'viewer', name: 'Mike Analyst', company: 'Green Consulting' }
        };

        // Auto-select role if not chosen but email matches
        if (!role && validCredentials[email]) {
            role = validCredentials[email].role;
            if (roleEl) roleEl.value = role;
        }

        if (validCredentials[email] && validCredentials[email].password === password && validCredentials[email].role === role) {
            currentUser = {
                email: email,
                name: validCredentials[email].name,
                role: role,
                company: validCredentials[email].company
            };

            showLoading(true);
            setTimeout(() => {
                showLoading(false);
                showMainApp();
                showNotification(`Welcome back, ${currentUser.name}!`, 'success');
            }, 500);
        } else {
            showNotification('Invalid credentials. Please check the demo credentials and ensure role selection matches your account type.', 'danger');
        }
    });
}

function showMainApp() {
    showScreen('main');
    updateUserInterface();
    showPage('dashboard');
    initializeDashboard();
}

function updateUserInterface() {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && currentUser) userNameEl.textContent = currentUser.name || currentUser.email || '';

    // Show/hide admin-only elements
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (currentUser?.role === 'admin') {
            element.classList.add('show');
        } else {
            element.classList.remove('show');
        }
    });
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks) return;

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;

            // Check admin access
            if (this.classList.contains('admin-only') && currentUser?.role !== 'admin') {
                return;
            }

            showPage(page);
        });
    });
}

function showPage(pageName) {
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

    // Show/hide pages with animation
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Add fade-in animation to new content
        const cards = targetPage.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fade-in');
        });
    }

    currentPage = pageName;

    // Initialize page-specific content
    switch(pageName) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'calculator':
            // Ensure industry options are populated when calculator page is shown
            populateIndustryOptions();
            break;
        case 'credits':
            initializeCreditsPage();
            break;
        case 'analytics':
            initializeAnalytics();
            break;
        case 'admin':
            initializeAdminPanel();
            break;
    }
}

// Dashboard Functions
function initializeDashboard() {
    updateDashboardMetrics();
    populateIndustryBreakdown();
    createTrendChart();
    createIndustryChart();
    startRealTimeAnimation();
}

function updateDashboardMetrics() {
    const totalEmissions = appData.monthly_data[appData.monthly_data.length - 1].emissions;
    const creditsNeeded = totalEmissions;
    const creditsOwned = appData.monthly_data[appData.monthly_data.length - 1].credits_owned;
    
    document.getElementById('total-emissions').textContent = totalEmissions.toLocaleString();
    document.getElementById('credits-needed').textContent = creditsNeeded.toLocaleString();
    document.getElementById('credits-owned').textContent = creditsOwned.toLocaleString();
    
    // Update metric changes with animation
    animateMetricValues();
}

function animateMetricValues() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach(metric => {
        const targetValueText = metric.textContent.replace(/,/g, '');
        if (isNaN(parseInt(targetValueText))) return; // Skip non-numeric values like price

        const targetValue = parseInt(targetValueText);
        let currentValue = 0;
        const increment = targetValue / 50;
        
        const animation = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(animation);
            }
            metric.textContent = Math.floor(currentValue).toLocaleString();
        }, 30);
    });
}

function populateIndustryBreakdown() {
    const container = document.getElementById('industry-breakdown');
    container.innerHTML = '';
    
    appData.industries.forEach((industry, index) => {
        const item = document.createElement('div');
        item.className = 'industry-item';
        item.innerHTML = `
            <div class="industry-name">${industry.name}</div>
            <div class="industry-emissions">${industry.current_emissions}</div>
            <div class="industry-factor">${industry.emission_factor} ${industry.unit}</div>
        `;
        container.appendChild(item);
        
        // Add entrance animation with delay
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'all 0.5s ease-out';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100);
        }, index * 100);
    });
}

// Real-time Updates
function setupRealTimeUpdates() {
    setInterval(() => {
        if (currentPage === 'dashboard') {
            updateRealTimeMetrics();
        }
    }, 5000);
}

function updateRealTimeMetrics() {
    // Simulate small fluctuations in real-time data
    const fluctuation = (Math.random() - 0.5) * 10;
    const baseEmissions = 2600;
    const newEmissions = Math.max(0, Math.floor(baseEmissions + fluctuation));
    
    document.getElementById('total-emissions').textContent = newEmissions.toLocaleString();
    
    // Update metric change indicators with animation
    const changeElements = document.querySelectorAll('.metric-change');
    changeElements.forEach(element => {
        element.style.opacity = '0.5';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 300);
    });
}

function startRealTimeAnimation() {
    const liveCounter = document.getElementById('live-counter');
    
    setInterval(() => {
        realTimeCounter += Math.random() * 5 + 2;
        liveCounter.textContent = Math.floor(realTimeCounter);
    }, 1000);
}

// Calculator Functions
function populateIndustryOptions() {
    const industrySelect = document.getElementById('industry');
    if (!industrySelect) {
        console.warn('Industry select element not found');
        return;
    }

    // Clear existing options first
    industrySelect.innerHTML = '';

    // Default fallback industries with proper data
    const fallbackIndustries = [
        { name: 'Steel Production', value: 'steel', factor: 1.9, unit: 'tonne CO2e/tonne' },
        { name: 'Cement Manufacturing', value: 'cement', factor: 0.9, unit: 'tonne CO2e/tonne' },
        { name: 'Textile Industry', value: 'textile', factor: 0.5, unit: 'tonne CO2e/tonne' },
        { name: 'Chemical Processing', value: 'chemical', factor: 1.2, unit: 'tonne CO2e/tonne' },
        { name: 'Food & Beverage', value: 'food', factor: 0.3, unit: 'tonne CO2e/tonne' },
        { name: 'Automotive', value: 'automotive', factor: 2.1, unit: 'tonne CO2e/tonne' },
        { name: 'Electronics', value: 'electronics', factor: 1.5, unit: 'tonne CO2e/tonne' },
        { name: 'Paper & Pulp', value: 'paper', factor: 0.8, unit: 'tonne CO2e/tonne' },
        { name: 'Mining', value: 'mining', factor: 2.3, unit: 'tonne CO2e/tonne' },
        { name: 'Other Industry', value: 'other', factor: 0.7, unit: 'tonne CO2e/tonne' }
    ];

    // Use backend data if available, otherwise use fallback
    const industriesToUse = Array.isArray(appData.industries) && appData.industries.length > 0 
        ? appData.industries.map(industry => ({
            name: industry.name || industry.label || 'Unknown',
            value: (industry.value || industry.name || '').toString().toLowerCase().replace(/\s+/g, ''),
            factor: Number(industry.emission_factor || industry.factor) || 0,
            unit: industry.unit || 'tonne CO2e/tonne'
        }))
        : fallbackIndustries;

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select industry';
    industrySelect.appendChild(defaultOption);

    // Add industry options
    industriesToUse.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry.value;
        option.textContent = industry.name;
        option.dataset.factor = industry.factor.toString();
        option.dataset.unit = industry.unit;
        industrySelect.appendChild(option);
    });

    console.log(`Populated ${industriesToUse.length} industry options`);
}

function setupCalculator() {
    const calculatorForm = document.getElementById('emission-form');
    const aiPredictBtn = document.getElementById('ai-predict-btn');
    
    // Populate industry options when calculator is set up
    populateIndustryOptions();
    
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function (e) {
            e.preventDefault();
            calculateEmissions();
        });
    }
    
    if (aiPredictBtn) {
        aiPredictBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAIPrediction();
        });
    }
}

async function showAIPrediction() {
    const industrySelect = document.getElementById('industry');
    const productionInput = document.getElementById('production');
    const timePeriodSelect = document.getElementById('time-period');
    const energySourceSelect = document.getElementById('energy-source');
    const resultsContainer = document.getElementById('calculation-results');

    if (!resultsContainer) return;

    const industry = industrySelect ? industrySelect.value : '';
    const production = productionInput ? parseFloat(productionInput.value || '0') : 0;
    const tp = timePeriodSelect ? timePeriodSelect.value : 'monthly';
    const years = tp === 'yearly' ? 1 : (tp === 'monthly' ? (1/12) : 1);
    const energy_source = energySourceSelect ? energySourceSelect.value : 'mixed';

    // Validation
    if (!industry) {
        alert('Please select an industry first');
        return;
    }
    if (production <= 0) {
        alert('Please enter a valid production amount');
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = `
        <div class="ai-loading">
            <div class="loading-spinner"></div>
            <h4>AI Analysis in Progress...</h4>
            <p>Analyzing emission patterns and generating predictions</p>
        </div>
    `;
    resultsContainer.classList.add('show');

    try {
        // Call AI prediction API
        const response = await fetch('/api/ai-predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                industry,
                production,
                years,
                energy_source
            })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`API ${response.status}: ${txt}`);
        }

        const data = await response.json();

        // Simulate AI thinking delay
        setTimeout(() => {
            displayAIPredictionResults(data);
        }, 1500);

    } catch (error) {
        console.error('AI Prediction failed:', error);
        resultsContainer.innerHTML = `
            <div class="error-state">
                <h4>AI Prediction Failed</h4>
                <p>${error.message || 'Unable to generate predictions'}</p>
                <button onclick="showAIPrediction()" class="btn btn--secondary">Try Again</button>
            </div>
        `;
    }
}

function displayAIPredictionResults(data) {
    const resultsContainer = document.getElementById('calculation-results');
    if (!resultsContainer) return;

    const confidencePercent = (data.confidence * 100).toFixed(1);
    const trendIcon = {
        'increasing': '',
        'decreasing': '',
        'stable': ''
    }[data.trend] || '';

    resultsContainer.innerHTML = `
        <div class="ai-results">
            <div class="ai-header">
                <h4> AI Emission Prediction</h4>
                <span class="confidence-badge">Confidence: ${confidencePercent}%</span>
            </div>
            
            <div class="prediction-grid">
                <div class="prediction-card">
                    <span class="prediction-label">Current Emissions</span>
                    <span class="prediction-value">${data.current_emissions.toFixed(2)} tonnes CO₂e</span>
                </div>
                
                <div class="prediction-card highlight">
                    <span class="prediction-label">Next Month Forecast</span>
                    <span class="prediction-value">${data.next_month_emission} tonnes CO₂e</span>
                </div>
                
                <div class="prediction-card">
                    <span class="prediction-label">Trend ${trendIcon}</span>
                    <span class="prediction-value trend-${data.trend}">${data.trend.toUpperCase()}</span>
                </div>
            </div>

            <div class="recommendations">
                <h5> AI Recommendations</h5>
                <ul class="recommendations-list">
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Carbon Credits Page
function initializeCreditsPage() {
    populateCreditTypes();
    updateCreditPrices();
}

function populateCreditTypes() {
    const container = document.getElementById('credit-types-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.carbon_credits.types.forEach(type => {
        const item = document.createElement('div');
        item.className = 'credit-type';
        item.innerHTML = `
            <div class="credit-info">
                <h4>${type.name}</h4>
                <div class="credit-availability">${type.available.toLocaleString()} credits available</div>
            </div>
            <div class="credit-price">
                <div class="price">$${type.price}</div>
                <div class="unit">per tonne CO2e</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateCreditPrices() {
    // Simulate real-time price updates
    setInterval(() => {
        if (currentPage === 'credits') {
            const priceElements = document.querySelectorAll('.price-value, .current-price .price-value');
            priceElements.forEach(element => {
                const currentPrice = parseFloat(element.textContent.replace('$', ''));
                const fluctuation = (Math.random() - 0.5) * 0.1;
                const newPrice = Math.max(0, currentPrice + fluctuation);
                element.textContent = '$' + newPrice.toFixed(2);
            });
        }
    }, 10000);
}

// Analytics Functions
function initializeAnalytics() {
    createAnalyticsChart();
    createForecastChart();
    populateRecommendations();
}

function createTrendChart() {
    const ctx = document.getElementById('main-chart') || document.getElementById('trend-chart');
    if (!ctx) return;
    
    // Get theme-aware colors
    const colors = getThemeColors();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: appData.monthly_data.map(d => d.month),
            datasets: [
                {
                    label: 'Emissions (tonnes CO2e)',
                    data: appData.monthly_data.map(d => d.emissions),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryTransparent,
                    tension: 0.4
                },
                {
                    label: 'Credits Owned',
                    data: appData.monthly_data.map(d => d.credits_owned),
                    borderColor: colors.warning,
                    backgroundColor: colors.warningTransparent,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                }
            }
        }
    });
}

function createIndustryChart() {
    const ctx = document.getElementById('industry-chart');
    if (!ctx) return;
    
    // Get theme-aware colors
    const colors = getThemeColors();
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: appData.industries.slice(0, 6).map(i => i.name),
            datasets: [{
                data: appData.industries.slice(0, 6).map(i => i.current_emissions),
                backgroundColor: colors.chartPalette
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text
                    }
                }
            }
        }
    });
}

function createAnalyticsChart() {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    
    // Get theme-aware colors
    const colors = getThemeColors();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: appData.monthly_data.map(d => d.month),
            datasets: [
                {
                    label: 'Emissions Trend',
                    data: appData.monthly_data.map(d => d.emissions),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryTransparent,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Target Reduction',
                    data: appData.monthly_data.map((d, i) => d.emissions * (1 - (i * 0.02))), // 2% reduction per month
                    borderColor: colors.success,
                    backgroundColor: colors.successTransparent,
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                }
            }
        }
    });
}

function createForecastChart() {
    const ctx = document.getElementById('forecast-chart');
    if (!ctx) return;
    
    // Get theme-aware colors
    const colors = getThemeColors();
    
    // Generate forecast data
    const forecastMonths = ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];
    const lastEmission = appData.monthly_data[appData.monthly_data.length - 1].emissions;
    const forecastData = forecastMonths.map((_, i) => lastEmission * (1 - (i * 0.03))); // 3% reduction forecast
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: forecastMonths,
            datasets: [{
                label: 'Predicted Emissions',
                data: forecastData,
                backgroundColor: colors.primaryTransparent,
                borderColor: colors.primary,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textSecondary
                    },
                    grid: {
                        color: colors.border
                    }
                }
            }
        }
    });
}

function populateRecommendations() {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.ai_predictions.recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.textContent = rec;
        container.appendChild(item);
    });
}

// Admin Panel Functions
function initializeAdminPanel() {
    if (currentUser?.role !== 'admin') return;
    
    populateUserList();
}

function populateUserList() {
    const container = document.getElementById('user-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = `
            <div class="user-info">
                <h4>${user.name}</h4>
                <div style="font-size: 12px; color: var(--color-text-secondary);">${user.email}</div>
                <div style="font-size: 12px; color: var(--color-text-secondary);">${user.company}</div>
            </div>
            <div class="user-role ${user.role}">${user.role}</div>
        `;
        container.appendChild(item);
    });
}

// Logout Function
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    logoutBtn.addEventListener('click', function() {
        currentUser = null;
        currentPage = 'dashboard';
        realTimeCounter = 0;
        
        // Clear forms
        document.querySelectorAll('form').forEach(form => form.reset());
        
        // Hide calculation results
        const resultsContainer = document.getElementById('calculation-results');
        if (resultsContainer) {
            resultsContainer.classList.remove('show');
        }
        
        showScreen('login');
    });
}

// Utility Functions
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

// Animation Helpers
function animateElement(element, animation) {
    element.style.animation = animation;
    element.addEventListener('animationend', () => {
        element.style.animation = '';
    }, { once: true });
}

// Real-time Data Simulation
function simulateRealTimeData() {
    setInterval(() => {
        // Update various metrics with small random changes
        const elements = document.querySelectorAll('[data-realtime]');
        elements.forEach(element => {
            const currentValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, ''));
            const change = (Math.random() - 0.5) * 0.02; // ±1% change
            const newValue = currentValue * (1 + change);
            
            if (element.dataset.format === 'currency') {
                element.textContent = formatCurrency(newValue);
            } else {
                element.textContent = formatNumber(Math.round(newValue));
            }
        });
    }, 15000);
}

// Initialize real-time simulation
setTimeout(() => {
    simulateRealTimeData();
}, 5000);

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.altKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                showPage('dashboard');
                break;
            case '2':
                e.preventDefault();
                showPage('calculator');
                break;
            case '3':
                e.preventDefault();
                showPage('credits');
                break;
            case '4':
                e.preventDefault();
                showPage('analytics');
                break;
            case '5':
                if (currentUser?.role === 'admin') {
                    e.preventDefault();
                    showPage('admin');
                }
                break;
        }
    }
});

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add loading states to buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn')) {
        const button = e.target;
        
        button.style.opacity = '0.7';
        button.style.pointerEvents = 'none';
        
        setTimeout(() => {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }, 500);
    }
});

// Initialize tooltips for better UX
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    if (!tooltipElements || tooltipElements.length === 0) return;

    tooltipElements.forEach(element => {
        let tooltip = null;

        const show = () => {
            if (tooltip) return;
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.dataset.tooltip || '';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(17,24,39,0.95);
                color: #fff;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 120ms ease-in-out;
            `;
            document.body.appendChild(tooltip);

            // position after appended so offsetWidth/Height are available
            const rect = element.getBoundingClientRect();
            const left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
            const top = window.scrollY + rect.top - tooltip.offsetHeight - 8;
            tooltip.style.left = `${Math.max(8, left)}px`;
            tooltip.style.top = `${Math.max(8, top)}px`;

            // fade in
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
            });
        };

        const hide = () => {
            if (!tooltip) return;
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
                tooltip = null;
            }, 120);
        };

        element.addEventListener('mouseenter', show);
        element.addEventListener('focus', show);
        element.addEventListener('mouseleave', hide);
        element.addEventListener('blur', hide);
    });
}

// API Request Function
async function apiRequest(path, method='GET', body=null, requireAuth=false) {
  const headers = {"Content-Type":"application/json"};
  if (requireAuth) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token');
    headers['Authorization'] = 'Bearer ' + token;
  }
  const res = await fetch(`/api${path}`, {
    method, headers, body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json();
}

// login handler
async function submitLogin(email, password) {
  try {
    const data = await apiRequest('/login', 'POST', { email, password });
    localStorage.setItem('access_token', data.access_token);
    // then load protected data
    const me = await apiRequest('/me', 'GET', null, true);
    console.log('me', me);
  } catch (err) {
    console.error('login failed', err);
    alert('Login failed: ' + err.message);
  }
}

// CO2 Emission factors and energy multipliers
const EMISSION_FACTORS = {
    steel: 1.9,
    cement: 0.9,
    textile: 0.5,
    chemical: 1.2,
    food: 0.3,
    automotive: 2.1,
    electronics: 1.5,
    paper: 0.8,
    mining: 2.3,
    other: 0.7
};

const ENERGY_MULTIPLIERS = {
    coal: 1.0,
    oil: 0.8,
    'natural-gas': 0.6,
    renewable: 0.1,
    nuclear: 0.05,
    mixed: 1.1
};

// Credit award system based on emission levels
const CREDIT_AWARD_TIERS = [
    { maxEmission: 1, credits: 50, bonus: 0.2, tier: "Eco Champion", color: "#10b981" },
    { maxEmission: 5, credits: 30, bonus: 0.15, tier: "Green Leader", color: "#059669" },
    { maxEmission: 15, credits: 20, bonus: 0.1, tier: "Sustainable", color: "#f59e0b" },
    { maxEmission: 50, credits: 10, bonus: 0.05, tier: "Improving", color: "#f97316" },
    { maxEmission: 100, credits: 5, bonus: 0, tier: "High Impact", color: "#ef4444" },
    { maxEmission: Infinity, credits: 0, bonus: 0, tier: "Critical", color: "#dc2626" }
];

async function calculateEmissions() {
    console.log('Starting emission calculation...');
    
    // Get form elements
    const industrySelect = document.getElementById('industry');
    const productionInput = document.getElementById('production');
    const timePeriodSelect = document.getElementById('time-period');
    const energySourceSelect = document.getElementById('energy-source');
    const resultsContainer = document.getElementById('calculation-results');

    // Extract values
    const industry = industrySelect?.value?.toLowerCase() || '';
    const production = parseFloat(productionInput?.value || '0');
    const timePeriod = timePeriodSelect?.value || 'monthly';
    const energySource = energySourceSelect?.value?.toLowerCase() || 'mixed';

    console.log('Form values:', { industry, production, timePeriod, energySource });

    // Validation
    if (!industry) {
        showError('Please select an industry from the dropdown');
        industrySelect?.focus();
        return;
    }

    if (!production || production <= 0) {
        showError('Please enter a valid production amount (greater than 0)');
        productionInput?.focus();
        return;
    }

    // Show loading state
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="calculation-loading">
                <div class="loading-spinner"></div>
                <h4>Calculating CO₂ Emissions...</h4>
                <p>Analyzing production data and energy usage</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    }

    // Simulate calculation delay for better UX
    setTimeout(() => {
        performEmissionCalculation(industry, production, timePeriod, energySource);
    }, 800);
}

function performEmissionCalculation(industry, production, timePeriod, energySource) {
    console.log('Performing calculation with:', { industry, production, timePeriod, energySource });

    // Get emission factor for industry
    const emissionFactor = EMISSION_FACTORS[industry] || EMISSION_FACTORS.other;
    
    // Get energy multiplier
    const energyMultiplier = ENERGY_MULTIPLIERS[energySource] || ENERGY_MULTIPLIERS.mixed;
    
    // Calculate time multiplier
    const timeMultiplier = timePeriod === 'yearly' ? 1 : (1/12); // Monthly = 1/12 of year
    
    // Calculate base emissions (tonnes CO2e)
    const baseEmissions = production * emissionFactor * timeMultiplier;
    const totalEmissions = baseEmissions * energyMultiplier;
    
    // Calculate credits needed (1 credit per tonne CO2e, rounded up)
    const creditsNeeded = Math.ceil(totalEmissions);
    
    // Calculate credit cost (market price per credit)
    const creditPrice = 6.97; // USD per credit
    const totalCreditCost = creditsNeeded * creditPrice;
    
    // Determine credit award tier
    const awardTier = CREDIT_AWARD_TIERS.find(tier => totalEmissions <= tier.maxEmission) || CREDIT_AWARD_TIERS[CREDIT_AWARD_TIERS.length - 1];
    
    // Calculate bonus credits for sustainable energy
    const energyBonus = calculateEnergyBonus(energySource, creditsNeeded);
    
    // Calculate efficiency bonus
    const efficiencyBonus = calculateEfficiencyBonus(totalEmissions, production, timePeriod);
    
    // Total awarded credits
    const totalAwardedCredits = awardTier.credits + energyBonus.amount + efficiencyBonus.amount;
    const awardedCreditValue = totalAwardedCredits * creditPrice;
    
    // Net cost (credits needed minus awarded credits)
    const netCreditsNeeded = Math.max(0, creditsNeeded - totalAwardedCredits);
    const netCost = netCreditsNeeded * creditPrice;
    const savings = totalCreditCost - netCost;

    // Create comprehensive results object
    const results = {
        industry,
        production,
        timePeriod,
        energySource,
        calculations: {
            emissionFactor,
            energyMultiplier,
            timeMultiplier,
            baseEmissions: Math.round(baseEmissions * 100) / 100,
            totalEmissions: Math.round(totalEmissions * 100) / 100
        },
        credits: {
            needed: creditsNeeded,
            cost: Math.round(totalCreditCost * 100) / 100,
            price: creditPrice
        },
        awards: {
            tier: awardTier,
            energyBonus,
            efficiencyBonus,
            totalAwarded: totalAwardedCredits,
            value: Math.round(awardedCreditValue * 100) / 100
        },
        netResults: {
            creditsNeeded: netCreditsNeeded,
            cost: Math.round(netCost * 100) / 100,
            savings: Math.round(savings * 100) / 100
        }
    };

    console.log('Calculation results:', results);
    displayCalculationResults(results);
}

function calculateEnergyBonus(energySource, baseCredits) {
    const energyBonuses = {
        renewable: { multiplier: 0.25, reason: " Clean Energy Champion" },
        nuclear: { multiplier: 0.2, reason: " Low-Carbon Energy" },
        'natural-gas': { multiplier: 0.1, reason: "Cleaner Fossil Fuel" },
        mixed: { multiplier: 0.05, reason: "Energy Diversity" },
        oil: { multiplier: 0.02, reason: "Standard Practice" },
        coal: { multiplier: 0, reason: "High Carbon Source" }
    };

    const bonus = energyBonuses[energySource] || energyBonuses.coal;
    const amount = Math.floor(baseCredits * bonus.multiplier);

    return {
        amount,
        reason: bonus.reason,
        multiplier: bonus.multiplier
    };
}

function calculateEfficiencyBonus(emissions, production, timePeriod) {
    // Calculate emissions per unit of production
    const emissionIntensity = emissions / production;
    
    let bonus = { amount: 0, reason: "No Efficiency Bonus" };
    
    if (emissionIntensity < 0.3) {
        bonus = { amount: 15, reason: "Ultra-Efficient Production" };
    } else if (emissionIntensity < 0.7) {
        bonus = { amount: 10, reason: "High Efficiency" };
    } else if (emissionIntensity < 1.2) {
        bonus = { amount: 5, reason: "Good Efficiency" };
    }
    
    // Extra bonus for yearly commitments
    if (timePeriod === 'yearly' && bonus.amount > 0) {
        bonus.amount += 5;
        bonus.reason += " + Long-term Commitment";
    }
    
    return bonus;
}

function displayCalculationResults(results) {
    const resultsContainer = document.getElementById('calculation-results');
    if (!resultsContainer) return;

    const { calculations, credits, awards, netResults } = results;
    const savingsColor = netResults.savings > 0 ? '#10b981' : '#ef4444';
    const savingsIcon = netResults.savings > 0 ? '' : '';

    resultsContainer.innerHTML = `
        <div class="emission-results">
            <!-- Header -->
            <div class="results-header">
                <h4>CO₂ Emission Analysis & Credit Report</h4>
                <div class="emission-badge" style="background-color: ${awards.tier.color}20; border-color: ${awards.tier.color}">
                    <span style="color: ${awards.tier.color}">${awards.tier.tier}</span>
                </div>
            </div>

            <!-- Emission Calculations -->
            <div class="calculation-section">
                <h5>Emission Breakdown</h5>
                <div class="calc-grid">
                    <div class="calc-item">
                        <span class="calc-label">Industry Factor:</span>
                        <span class="calc-value">${calculations.emissionFactor} tonnes CO₂e/unit</span>
                    </div>
                    <div class="calc-item">
                        <span class="calc-label">Energy Multiplier:</span>
                        <span class="calc-value">${calculations.energyMultiplier}x (${results.energySource})</span>
                    </div>
                    <div class="calc-item">
                        <span class="calc-label">Time Period:</span>
                        <span class="calc-value">${results.timePeriod} (${calculations.timeMultiplier}x)</span>
                    </div>
                    <div class="calc-item highlight">
                        <span class="calc-label">Total Emissions:</span>
                        <span class="calc-value">${calculations.totalEmissions} tonnes CO₂e</span>
                    </div>
                </div>
            </div>

            <!-- Credit Requirements -->
            <div class="credit-section">
                <h5> Carbon Credit Requirements</h5>
                <div class="credit-summary">
                    <div class="credit-card primary">
                        <span class="credit-title">Credits Needed</span>
                        <span class="credit-amount">${credits.needed}</span>
                        <span class="credit-cost">$${credits.cost}</span>
                    </div>
                    <div class="credit-card success">
                        <span class="credit-title">Credits Awarded</span>
                        <span class="credit-amount">+${awards.totalAwarded}</span>
                        <span class="credit-cost">Worth $${awards.value}</span>
                    </div>
                    <div class="credit-card ${netResults.savings > 0 ? 'positive' : 'negative'}">
                        <span class="credit-title">Net Cost ${savingsIcon}</span>
                        <span class="credit-amount">${netResults.creditsNeeded} credits</span>
                        <span class="credit-cost" style="color: ${savingsColor}">$${netResults.cost}</span>
                    </div>
                </div>
            </div>

            <!-- Award Breakdown -->
            <div class="awards-section">
                <h5> Credit Awards Breakdown</h5>
                <div class="awards-list">
                    <div class="award-item ${awards.tier.credits > 0 ? 'active' : 'inactive'}">
                        <span class="award-icon"></span>
                        <div class="award-details">
                            <strong>${awards.tier.tier} Tier</strong>
                            <small>Base award for emission level</small>
                        </div>
                        <span class="award-credits">+${awards.tier.credits}</span>
                    </div>
                    
                    <div class="award-item ${awards.energyBonus.amount > 0 ? 'active' : 'inactive'}">
                        <span class="award-icon"></span>
                        <div class="award-details">
                            <strong>Energy Bonus</strong>
                            <small>${awards.energyBonus.reason}</small>
                        </div>
                        <span class="award-credits">+${awards.energyBonus.amount}</span>
                    </div>
                    
                    <div class="award-item ${awards.efficiencyBonus.amount > 0 ? 'active' : 'inactive'}">
                        <span class="award-icon"></span>
                        <div class="award-details">
                            <strong>Efficiency Bonus</strong>
                            <small>${awards.efficiencyBonus.reason}</small>
                        </div>
                        <span class="award-credits">+${awards.efficiencyBonus.amount}</span>
                    </div>
                </div>
                
                ${netResults.savings > 0 ? `
                <div class="savings-highlight">
                    <h6> Congratulations!</h6>
                    <p>You've saved <strong>$${netResults.savings}</strong> through sustainable practices and earned <strong>${awards.totalAwarded} credits</strong>!</p>
                </div>
                ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="results-actions">
                <button class="btn btn--primary" onclick="generateDetailedReport()">📋 Detailed Report</button>
                <button class="btn btn--secondary" onclick="calculateEmissions()">🔄 Recalculate</button>
                ${netResults.creditsNeeded > 0 ? '<button class="btn btn--success" onclick="purchaseCredits()">💳 Purchase Credits</button>' : ''}
            </div>
        </div>
    `;

    resultsContainer.classList.add('show');
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(message) {
    const resultsContainer = document.getElementById('calculation-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="error-state">
                <span class="error-icon"></span>
                <h4>Calculation Error</h4>
                <p>${message}</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    }
    alert(message);
}

// Packaging emission factors (kg CO2e per unit)
const PACKAGING_EMISSION_FACTORS = {
    plastic: { solid: 2.5, liquid: 3.2, gas: 1.8 },
    cardboard: { solid: 0.7, liquid: 1.1, gas: 0.9 },
    petrol: { solid: 4.5, liquid: 2.8, gas: 2.1 },
    cotton: { solid: 1.2, liquid: 1.8, gas: 1.0 },
    diesel: { solid: 3.8, liquid: 3.1, gas: 2.3 },
    cng: { solid: 1.9, liquid: 2.2, gas: 1.5 }
};

// Transport emission factors (kg CO2e per kg per km)
const TRANSPORT_FACTORS = {
    truck: 0.12,
    ship: 0.014,
    air: 0.5,
    rail: 0.04
};

const MATERIAL_STATE_COMPATIBILITY = {
    cardboard: ['solid'],           // Only solid
    plastic: ['solid', 'liquid'],   // Solid and liquid only
    cotton: ['solid'],              // Only solid
    petrol: ['liquid', 'gas'],      // No solid option
    diesel: ['liquid', 'gas'],      // No solid option
    cng: ['liquid', 'gas']          // No solid option
};

function setupPackaging() {
    const packagingForm = document.getElementById('packaging-form');
    const materialTypeSelect = document.getElementById('material-type');
    const materialSubtypeSelect = document.getElementById('material-subtype');
    const stateSelect = document.getElementById('product-state');
    const amountInput = document.getElementById('packaging-amount');
    const amountUnitDisplay = document.getElementById('amount-unit');
    
    let packagingMaterials = {}; // Will store fetched materials data
    
    // Fetch packaging materials data
    fetchPackagingMaterials();
    
    // Update subtypes when material type changes
    if (materialTypeSelect && materialSubtypeSelect) {
        materialTypeSelect.addEventListener('change', function() {
            const selectedType = this.value.toLowerCase();
            updateMaterialSubtypes(selectedType);
            updateStateSelectVisibility(selectedType);
        });
    }
    
    // Update unit display when subtype changes
    if (materialSubtypeSelect && amountUnitDisplay) {
        materialSubtypeSelect.addEventListener('change', function() {
            updateUnitDisplay();
        });
    }
    
    // Update unit display when state changes
    if (stateSelect && amountUnitDisplay) {
        stateSelect.addEventListener('change', function() {
            updateUnitDisplay();
        });
    }
    
    function updateUnitDisplay() {
        // Get the material type and subtype
        const materialType = materialTypeSelect.value.toLowerCase();
        const materialSubtype = materialSubtypeSelect.value;
        
        // Default unit based on state
        let unit = 'kg';
        if (stateSelect.value === 'liquid') {
            unit = 'litre';
        } else if (stateSelect.value === 'gas') {
            unit = 'psi';
        }
        
        // Override with specific unit if material has one
        if (packagingMaterials && 
            packagingMaterials[materialType] && 
            packagingMaterials[materialType][materialSubtype] &&
            packagingMaterials[materialType][materialSubtype].unit) {
            unit = packagingMaterials[materialType][materialSubtype].unit;
        }
        
        amountUnitDisplay.textContent = `Enter amount in ${unit}`;
    }
    
    function updateStateSelectVisibility(materialType) {
        // For fuels, transportation, and waste, we don't need state selection
        const stateContainer = stateSelect?.closest('.input-group');
        if (stateContainer) {
            if (materialType === 'fuels' || materialType === 'transportation' || materialType === 'waste') {
                stateContainer.style.display = 'none';
            } else {
                stateContainer.style.display = 'flex';
            }
        }
    }
    
    if (packagingForm) {
        packagingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            calculatePackagingEmissions();
        });
    }

    const optimizeBtn = document.getElementById('packaging-optimize-btn');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            optimizePackaging();
        });
    }
    
    // Fetch packaging materials from API
    async function fetchPackagingMaterials() {
        try {
            const response = await fetch(`${BACKEND_BASE}/api/packaging-materials`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            packagingMaterials = await response.json();
            console.log('Packaging materials loaded:', packagingMaterials);
            
            // If material type is already selected, update subtypes
            if (materialTypeSelect.value) {
                updateMaterialSubtypes(materialTypeSelect.value.toLowerCase());
                updateStateSelectVisibility(materialTypeSelect.value.toLowerCase());
            }
        } catch (error) {
            console.error('Error fetching packaging materials:', error);
            // Use fallback data if fetch fails
            packagingMaterials = getDefaultPackagingMaterials();
        }
    }
    
    // Update material subtypes based on selected type
    function updateMaterialSubtypes(materialType) {
        if (!materialSubtypeSelect) return;
        
        // Clear existing options
        materialSubtypeSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select material subtype';
        materialSubtypeSelect.appendChild(defaultOption);
        
        // If no material type or no data, exit
        if (!materialType || !packagingMaterials || !packagingMaterials[materialType]) {
            return;
        }
        
        // Add subtypes for selected material
        const subtypes = packagingMaterials[materialType];
        for (const [subtype, data] of Object.entries(subtypes)) {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = `${subtype.replace(/_/g, ' ')} - ${data.description.split(' - ')[0]}`;
            option.setAttribute('data-factor', data.emission_factor);
            option.setAttribute('data-recycled', data.recycled_factor);
            option.setAttribute('data-description', data.description);
            if (data.unit) {
                option.setAttribute('data-unit', data.unit);
            }
            materialSubtypeSelect.appendChild(option);
        }
        
        // Update unit display after populating subtypes
        if (materialSubtypeSelect.value) {
            updateUnitDisplay();
        }
    }
    
    // Fallback data if API fails - now includes the new categories
    function getDefaultPackagingMaterials() {
        return {
            "plastics": {
                "PET": {"emission_factor": 3.4, "recycled_factor": 1.5, "description": "Polyethylene Terephthalate - bottles, containers"},
                "HDPE": {"emission_factor": 1.9, "recycled_factor": 0.7, "description": "High-Density Polyethylene - milk jugs, detergent bottles"},
                "LDPE": {"emission_factor": 1.8, "recycled_factor": 0.65, "description": "Low-Density Polyethylene - plastic bags, films"}
            },
            "paper": {
                "Virgin_Cardboard": {"emission_factor": 0.91, "recycled_factor": 0.73, "description": "New corrugated cardboard"},
                "Recycled_Cardboard": {"emission_factor": 0.73, "recycled_factor": 0.55, "description": "Recycled corrugated cardboard"}
            },
            "glass": {
                "Clear_Glass": {"emission_factor": 0.85, "recycled_factor": 0.36, "description": "Clear glass containers"}
            },
            "metals": {
                "Primary_Aluminum": {"emission_factor": 9.12, "recycled_factor": 0.46, "description": "Virgin aluminum cans and foil"}
            },
            "fuels": {
                "Natural_Gas": {"emission_factor": 0.202, "recycled_factor": 0.202, "description": "Natural gas - kg CO₂e per kWh", "unit": "kWh"},
                "Diesel": {"emission_factor": 2.678, "recycled_factor": 2.678, "description": "Diesel fuel - kg CO₂e per liter", "unit": "liter"}
            },
            "transportation": {
                "Passenger_Car_Petrol": {"emission_factor": 0.171, "recycled_factor": 0.171, "description": "Petrol car - kg CO₂e per km", "unit": "km"},
                "Bus": {"emission_factor": 0.089, "recycled_factor": 0.089, "description": "Bus transport - kg CO₂e per km", "unit": "km"}
            },
            "waste": {
                "Landfill": {"emission_factor": 0.525, "recycled_factor": 0.525, "description": "Landfill waste - kg CO₂e per kg", "unit": "kg"},
                "Recycling": {"emission_factor": 0.021, "recycled_factor": 0.021, "description": "Recycled waste - kg CO₂e per kg", "unit": "kg"}
            }
        };
    }
}

// Add or replace the existing calculatePackagingEmissions function
async function calculatePackagingEmissions() {
    console.log('Calculating packaging emissions...');
    
    // Get form elements
    const materialTypeSelect = document.getElementById('material-type');
    const materialSubtypeSelect = document.getElementById('material-subtype');
    const amountInput = document.getElementById('packaging-amount');
    const stateSelect = document.getElementById('product-state');
    const isRecycledSelect = document.getElementById('is-recycled');
    const transportDistanceInput = document.getElementById('transport-distance');
    const transportModeSelect = document.getElementById('transport-mode');
    const resultsContainer = document.getElementById('packaging-results');

    // Extract values
    const materialType = materialTypeSelect?.value || '';
    const materialSubtype = materialSubtypeSelect?.value || '';
    const amount = parseFloat(amountInput?.value || '0');
    const state = stateSelect?.value || 'solid';
    const isRecycled = isRecycledSelect?.value === 'true';
    const transportDistance = parseFloat(transportDistanceInput?.value || '0');
    const transportMode = transportModeSelect?.value || 'truck';

    console.log('Form values:', { materialType, materialSubtype, amount, state, isRecycled, transportDistance, transportMode });

    // Validation
    if (!materialType) {
        showPackagingError('Please select a material type');
        materialTypeSelect?.focus();
        return;
    }

    if (!materialSubtype) {
        showPackagingError('Please select a material subtype');
        materialSubtypeSelect?.focus();
        return;
    }

    if (!amount || amount <= 0) {
        showPackagingError('Please enter a valid amount (greater than 0)');
        amountInput?.focus();
        return;
    }

    // Show loading state
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <h4>Calculating Packaging Emissions...</h4>
                <p>Analyzing ${materialSubtype} ${materialType} impact</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    }

    try {
        // Call API to calculate emissions
        const response = await fetch(`${BACKEND_BASE}/api/calculate-packaging`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                material_type: materialType,
                material_subtype: materialSubtype,
                amount: amount,
                state: state,
                is_recycled: isRecycled,
                transport_distance: transportDistance,
                transport_mode: transportMode
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('Packaging calculation results:', data);
        
        // Display results
        displayPackagingResults(data);
        
    } catch (error) {
        console.error('Error calculating packaging emissions:', error);
        
        // Show error in results container
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <h4>Calculation Error</h4>
                    <p>${error.message || 'Failed to calculate emissions'}</p>
                    <button class="btn btn--secondary" onclick="calculatePackagingEmissions()">Try Again</button>
                </div>
            `;
        }
    }
}

// Add or replace the existing displayPackagingResults function
function displayPackagingResults(results) {
    const resultsContainer = document.getElementById('packaging-results');
    if (!resultsContainer) return;

    // Determine efficiency grade based on emissions
    let grade, description, color;
    const emissionsPerKg = results.total_emissions / results.amount;
    
    if (emissionsPerKg < 0.5) {
        grade = 'A+'; description = 'Excellent Efficiency'; color = '#10b981';
    } else if (emissionsPerKg < 1) {
        grade = 'A'; description = 'Very Good Efficiency'; color = '#059669';
    } else if (emissionsPerKg < 2) {
        grade = 'B'; description = 'Good Efficiency'; color = '#f59e0b';
    } else if (emissionsPerKg < 3) {
        grade = 'C'; description = 'Fair Efficiency'; color = '#f97316';
    } else if (emissionsPerKg < 4) {
        grade = 'D'; description = 'Poor Efficiency'; color = '#ef4444';
    } else {
        grade = 'F'; description = 'Very Poor Efficiency'; color = '#dc2626';
    }

    resultsContainer.innerHTML = `
        <div class="results-card">
            <div class="results-header">
                <h4>Packaging Emission Results</h4>
                <div class="efficiency-badge" style="background-color: ${color}20; border-color: ${color}">
                    <span style="color: ${color}">${grade}</span>
                    <small>${description}</small>
                </div>
            </div>
            
            <div class="result-grid">
                <div class="result-item">
                    <span class="result-label">Material:</span>
                    <span class="result-value">${results.material_subtype} (${results.is_recycled ? 'Recycled' : 'Virgin'})</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Amount:</span>
                    <span class="result-value">${results.amount} ${results.state === 'liquid' ? 'litres' : results.state === 'gas' ? 'psi' : 'kg'}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Material Emissions:</span>
                    <span class="result-value">${results.material_emissions} kg CO₂e</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Transport Emissions:</span>
                    <span class="result-value">${results.transport.emissions} kg CO₂e</span>
                </div>
                <div class="result-item highlight">
                    <span class="result-label">Total Emissions:</span>
                    <span class="result-value">${results.total_emissions} kg CO₂e</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Credits Needed:</span>
                    <span class="result-value">${results.credits_needed} credits</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Estimated Cost:</span>
                    <span class="result-value">$${results.credit_cost}</span>
                </div>
            </div>

            <div class="recommendations">
                <h5>💡 Optimization Recommendations</h5>
                <ul class="recommendations-list">
                    ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    resultsContainer.classList.add('show');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// For error display
function showPackagingError(message) {
    const resultsContainer = document.getElementById('packaging-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="error-state">
                <h4>Calculation Error</h4>
                <p>${message}</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    } else {
        alert(message);
    }
}

// Add optimize packaging function
function optimizePackaging() {
    // Get form elements
    const materialTypeSelect = document.getElementById('material-type');
    const materialSubtypeSelect = document.getElementById('material-subtype');
    const amountInput = document.getElementById('packaging-amount');
    const resultsContainer = document.getElementById('packaging-results');

    // Extract values
    const materialType = materialTypeSelect?.value || '';
    const materialSubtype = materialSubtypeSelect?.value || '';
    const amount = parseFloat(amountInput?.value || '0');

    // Validation
    if (!materialType || !materialSubtype || !amount || amount <= 0) {
        showPackagingError('Please select material type, subtype and enter a valid amount first');
        return;
    }

    // Show AI loading
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <h4>🤖 AI Optimization in Progress...</h4>
                <p>Analyzing packaging alternatives and generating sustainability recommendations</p>
            </div>
        `;
        resultsContainer.classList.add('show');
    }

    // Simulate AI prediction with a delay
    setTimeout(() => {
        displayPackagingOptimization(materialType, materialSubtype, amount);
    }, 1800);
}

function displayPackagingOptimization(materialType, materialSubtype, amount) {
    const resultsContainer = document.getElementById('packaging-results');
    if (!resultsContainer) return;

    // Calculate simulated optimization results
    const alternatives = [
        {name: materialType === 'plastics' ? 'Bioplastics' : 'Recycled_Cardboard', saving: Math.round(amount * 0.8 * 10) / 10},
        {name: materialType === 'plastics' ? 'HDPE' : 'Virgin_Cardboard', saving: Math.round(amount * 0.5 * 10) / 10},
        {name: 'Redesigned packaging', saving: Math.round(amount * 1.2 * 10) / 10}
    ];

    resultsContainer.innerHTML = `
        <div class="results-card">
            <div class="results-header">
                <h4>🤖 AI Packaging Optimization</h4>
                <span class="confidence-badge" style="background: rgba(31,184,205,0.2); color: #1fb8cd; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem;">
                    Confidence: ${(Math.random() * 10 + 85).toFixed(1)}%
                </span>
            </div>
            
            <div class="result-item highlight" style="margin-bottom: 1rem;">
                <span class="result-label">Current Material:</span>
                <span class="result-value">${materialSubtype} (${materialType})</span>
            </div>
            
            <h5 style="margin-top: 1rem; color: #1fb8cd;">Alternative Materials</h5>
            <div class="alternatives-grid" style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                ${alternatives.map(alt => `
                    <div class="result-item">
                        <span class="result-label">${alt.name}:</span>
                        <span class="result-value" style="color: #10b981;">Save ${alt.saving} kg CO₂e</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="recommendations">
                <h5>🌱 Sustainability Recommendations</h5>
                <ul class="recommendations-list">
                    <li>Switch to ${materialType === 'plastics' ? 'Bioplastics' : 'Recycled_Cardboard'} for optimal sustainability</li>
                    <li>Reduce packaging weight by 15% through design optimization</li>
                    <li>Source materials from local suppliers to minimize transport emissions</li>
                    <li>Implement take-back program for packaging reuse</li>
                </ul>
            </div>
        </div>
    `;

    resultsContainer.classList.add('show');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
