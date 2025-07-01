// Configuration pour le stockage partagé en ligne
// Utiliser Firebase comme service de stockage partagé

const CONFIG = {
    // Service de stockage partagé (Firebase)
    firebase: {
        apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        authDomain: "location-sharing-app.firebaseapp.com",
        projectId: "location-sharing-app",
        storageBucket: "location-sharing-app.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdefghijklmnop"
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