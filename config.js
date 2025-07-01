// Configuration pour le stockage partagé en ligne
// Utiliser un service gratuit et simple

const CONFIG = {
    // Service de stockage partagé (JSONBin.io)
    storage: {
        // Bin ID créé automatiquement
        binId: '65a4f8c8-1b0d-4b0a-8f0a-8f0a8f0a8f0a',
        // Clé API (à remplacer par votre vraie clé)
        apiKey: '$2a$10$your-api-key-here',
        baseUrl: 'https://api.jsonbin.io/v3/b'
    },
    
    // Configuration de l'application
    app: {
        name: 'Partage de Localisation',
        version: '1.0.0',
        maxLocations: 100,
        defaultExpiration: 24 * 60 * 60 * 1000 // 24 heures en millisecondes
    }
};

// Exporter la configuration
window.CONFIG = CONFIG; 