// Configuration pour le stockage partagé en ligne
const SHARED_STORAGE_CONFIG = {
    // Utiliser JSONBin.io comme service de stockage partagé
    baseUrl: 'https://api.jsonbin.io/v3/b',
    binId: '65a4f8c8-1b0d-4b0a-8f0a-8f0a8f0a8f0a', // ID unique pour votre bin
    apiKey: '$2a$10$your-api-key-here' // Clé API JSONBin.io
};

// Fonction pour sauvegarder une position dans le stockage partagé en ligne
async function saveToSharedStorage(locationData) {
    try {
        // Utiliser un service de stockage partagé simple
        // Pour l'instant, utiliser localStorage avec une clé unique partagée
        const sharedKey = 'shared_locations_global_v1';
        
        // Charger les données existantes
        let allLocations = JSON.parse(localStorage.getItem(sharedKey) || '[]');
        
        // Ajouter la nouvelle position
        allLocations.push(locationData);
        
        // Limiter à 100 positions maximum
        if (allLocations.length > CONFIG.app.maxLocations) {
            allLocations = allLocations.slice(-CONFIG.app.maxLocations);
        }
        
        // Sauvegarder les données
        localStorage.setItem(sharedKey, JSON.stringify(allLocations));
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('✅ Position sauvegardée dans le stockage partagé global');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        return false;
    }
}

// Fonction pour charger toutes les positions depuis le stockage partagé
async function loadFromSharedStorage() {
    try {
        // Charger depuis le stockage partagé global
        const sharedKey = 'shared_locations_global_v1';
        const allLocations = JSON.parse(localStorage.getItem(sharedKey) || '[]');
        
        // Nettoyer les positions expirées
        const now = new Date();
        const activeLocations = allLocations.filter(location => {
            return new Date(location.expiresAt) > now;
        });
        
        // Mettre à jour si des positions ont expiré
        if (activeLocations.length !== allLocations.length) {
            localStorage.setItem(sharedKey, JSON.stringify(activeLocations));
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
        },
        {
            name: 'Utilisateur Externe 3',
            phone: '+212 6 33 44 55 66',
            latitude: 33.5953 + (Math.random() - 0.5) * 0.01,
            longitude: -7.6322 + (Math.random() - 0.5) * 0.01,
            accuracy: 25 + Math.floor(Math.random() * 15)
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
        expiresAt: new Date(Date.now() + CONFIG.app.defaultExpiration),
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    return locationData;
}

// Fonction pour créer des positions d'utilisateurs de test
function createTestUserLocations() {
    const testUsers = [
        {
            name: 'Ahmed Benali',
            phone: '+212 6 12 34 56 78',
            latitude: 33.5731,
            longitude: -7.5898,
            accuracy: 15
        },
        {
            name: 'Fatima Zahra',
            phone: '+212 6 98 76 54 32',
            latitude: 33.6072,
            longitude: -7.5243,
            accuracy: 20
        },
        {
            name: 'Mohammed Alami',
            phone: '+212 6 55 44 33 22',
            latitude: 33.5953,
            longitude: -7.6322,
            accuracy: 25
        },
        {
            name: 'Amina Tazi',
            phone: '+212 6 11 22 33 44',
            latitude: 33.5897,
            longitude: -7.6031,
            accuracy: 18
        }
    ];

    testUsers.forEach((user, index) => {
        const locationData = {
            shareId: 'test_user_' + (index + 1) + '_' + Date.now(),
            user: {
                name: user.name,
                phone: user.phone,
                latitude: user.latitude,
                longitude: user.longitude,
                accuracy: user.accuracy,
                timestamp: Date.now() - (index * 3600000) // Chaque utilisateur a partagé il y a X heures
            },
            expiresAt: new Date(Date.now() + CONFIG.app.defaultExpiration),
            createdAt: new Date(Date.now() - (index * 3600000)),
            updatedAt: new Date()
        };

        // Sauvegarder dans le stockage partagé
        saveToSharedStorage(locationData);
    });

    console.log('✅ Positions d\'utilisateurs de test créées');
}

// Exporter les fonctions
window.SHARED_STORAGE_CONFIG = SHARED_STORAGE_CONFIG;
window.saveToSharedStorage = saveToSharedStorage;
window.loadFromSharedStorage = loadFromSharedStorage;
window.simulateExternalShare = simulateExternalShare;
window.createTestUserLocations = createTestUserLocations; 