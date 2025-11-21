// Tailwind custom config (optional: can stay in index.html if needed)
tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: '#2563eb', 
                accent: '#fbbf24',
                success: '#22c55e',
                danger: '#ef4444',
                warning: '#f59e0b',
            }
        }
    }
};

// --- MOCK DATA & STATE ---
const state = {
    currentPage: 'login', 
    user: null,
    currentLocation: "Borella Junction",
    searchQuery: "",
    selectedBus: null
};

// Mock Bus Data
const mockBuses = [
    {
        id: '154',
        routeNo: '154',
        start: 'Kiribathgoda',
        end: 'Angulana',
        direction: 'Angulana',
        currentLocation: 'Near ODEL, Alexandra Place',
        nextStop: 'Town Hall',
        destStop: 'NIBM Vijayarama',
        eta: '8 mins',
        crowdLevel: 'Crowded', 
        seats: 4,
        peopleCount: 42,
        stops: [
            { name: 'Borella Junction', status: 'passed', time: '10:00 AM' },
            { name: 'Town Hall', status: 'upcoming', time: '10:12 AM' },
            { name: 'Torrington', status: 'upcoming', time: '10:20 AM' },
            { name: 'Thimbirigasyaya', status: 'upcoming', time: '10:28 AM' },
            { name: 'NIBM Vijayarama', status: 'destination', time: '10:45 AM' }
        ],
        lat: 6.9147, 
        lng: 79.8696
    },
    {
        id: '177',
        routeNo: '177',
        start: 'Kaduwela',
        end: 'Kollupitiya',
        direction: 'Kollupitiya',
        eta: '25 mins',
        crowdLevel: 'Very Crowded',
        stops: [],
        lat: 6.9000,
        lng: 79.8500
    }
];

// DOM Elements
const appContent = document.getElementById('app-content');

// --- NAVIGATION & ACTIONS ---
function navigateTo(page, data = null) {
    state.currentPage = page;
    if(data) state.selectedBus = data;
    render();
}

function login() {
    state.user = { name: "Kasun", email: "kasun@example.com" };
    navigateTo('home');
}

function performSearch(query) {
    state.searchQuery = query;
    navigateTo('search_results');
}

// --- RENDER FUNCTIONS ---
function render() { appContent.innerHTML = ''; switch(state.currentPage) {
    case 'login': renderLogin(); break;
    case 'home': renderHome(); break;
    case 'search_results': renderSearchResults(); break;
    case 'bus_detail': renderBusDetail(); break;
}}

function renderLogin() { /* your login HTML */ }
function renderHome() { /* your home/search HTML */ }
function renderSearchResults() { /* your search results HTML */ }
function renderBusDetail() { /* your bus detail HTML + map init */ }

// Map initialization
function initMap() { /* Leaflet map code */ }

// Start App
render();
