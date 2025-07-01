// Configuration pour le stockage partagé
const SHARED_STORAGE_CONFIG = {
    // Utiliser un service de stockage simple et gratuit
    baseUrl: 'https://api.jsonbin.io/v3/b',
    binId: '65a4f8c8-1b0d-4b0a-8f0a-8f0a8f0a8f0a', // À remplacer par votre vrai bin ID
    apiKey: '$2a$10$your-api-key-here' // À remplacer par votre vraie clé API
};

// Fonction pour sauvegarder une position dans le stockage partagé
async function saveToSharedStorage(locationData) {
    try {
        // Pour l'instant, utiliser localStorage comme fallback
        // En production, remplacez par un vrai service en ligne
        const apiKey = 'shared_locations_api_v1';
        let allLocations = JSON.parse(localStorage.getItem(apiKey) || '[]');
        
        // Ajouter la nouvelle position
        allLocations.push(locationData);
        
        // Limiter à 100 positions maximum
        if (allLocations.length > 100) {
            allLocations = allLocations.slice(-100);
        }
        
        // Sauvegarder localement
        localStorage.setItem(apiKey, JSON.stringify(allLocations));
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ Position sauvegardée dans le stockage partagé');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        return false;
    }
}

// Fonction pour charger toutes les positions depuis le stockage partagé
async function loadFromSharedStorage() {
    try {
        // Pour l'instant, utiliser localStorage comme fallback
        const apiKey = 'shared_locations_api_v1';
        const allLocations = JSON.parse(localStorage.getItem(apiKey) || '[]');
        
        // Nettoyer les positions expirées
        const now = new Date();
        const activeLocations = allLocations.filter(location => {
            return new Date(location.expiresAt) > now;
        });
        
        // Mettre à jour si des positions ont expiré
        if (activeLocations.length !== allLocations.length) {
            localStorage.setItem(apiKey, JSON.stringify(activeLocations));
            console.log(`🧹 ${allLocations.length - activeLocations.length} positions expirées supprimées`);
        }
        
        return activeLocations;
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        return [];
    }
}

// Fonction pour simuler un partage depuis une autre machine
function simulateExternalShare() {
    const externalUsers = [
        {
            name: 'Utilisateur Externe 1',
            phone: '+212 6 99 88 77 66',
            latitude: 33.5731 + (Math.random() - 0.5) * 0.01,
            longitude: -7.5898 + (Math.random() - 0.5) * 0.01,
            accuracy: 15 + Math.floor(Math.random() * 20)
        },
        {
            name: 'Utilisateur Externe 2',
            phone: '+212 6 11 22 33 44',
            latitude: 33.6072 + (Math.random() - 0.5) * 0.01,
            longitude: -7.5243 + (Math.random() - 0.5) * 0.01,
            accuracy: 20 + Math.floor(Math.random() * 15)
        }
    ];
    
    const randomUser = externalUsers[Math.floor(Math.random() * externalUsers.length)];
    
    const locationData = {
        shareId: 'external_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        user: {
            name: randomUser.name,
            phone: randomUser.phone,
            latitude: randomUser.latitude,
            longitude: randomUser.longitude,
            accuracy: randomUser.accuracy,
            timestamp: Date.now()
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    return locationData;
}

// Exporter les fonctions
window.SHARED_STORAGE_CONFIG = SHARED_STORAGE_CONFIG;
window.saveToSharedStorage = saveToSharedStorage;
window.loadFromSharedStorage = loadFromSharedStorage;
window.simulateExternalShare = simulateExternalShare; 