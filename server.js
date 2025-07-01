const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.openstreetmap.org"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://votre-domaine.com'] 
        : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite à 100 requêtes par fenêtre
    message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Base de données simple (en production, utilisez MongoDB ou PostgreSQL)
let sharedLocations = new Map();
let userSessions = new Map();

// Fonction utilitaire pour générer des IDs uniques
function generateShareId() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Fonction pour nettoyer les positions expirées
function cleanupExpiredLocations() {
    const now = new Date();
    for (const [shareId, location] of sharedLocations.entries()) {
        if (new Date(location.expiresAt) < now) {
            sharedLocations.delete(shareId);
            console.log(`Position expirée supprimée: ${shareId}`);
        }
    }
}

// Nettoyer les positions expirées toutes les heures
setInterval(cleanupExpiredLocations, 60 * 60 * 1000);

// Routes API

// GET /api/health - Vérification de l'état du serveur
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        locationsCount: sharedLocations.size
    });
});

// GET /api/location/:shareId - Récupérer une position partagée
app.get('/api/location/:shareId', (req, res) => {
    const { shareId } = req.params;
    
    if (!shareId || !shareId.startsWith('share_')) {
        return res.status(400).json({ 
            error: 'ID de partage invalide',
            code: 'INVALID_SHARE_ID'
        });
    }
    
    const location = sharedLocations.get(shareId);
    
    if (!location) {
        return res.status(404).json({ 
            error: 'Position non trouvée',
            code: 'LOCATION_NOT_FOUND'
        });
    }
    
    // Vérifier l'expiration
    if (new Date() > new Date(location.expiresAt)) {
        sharedLocations.delete(shareId);
        return res.status(410).json({ 
            error: 'Position expirée',
            code: 'LOCATION_EXPIRED'
        });
    }
    
    // Retourner les données sans informations sensibles
    res.json({
        shareId: location.shareId,
        user: {
            name: location.user.name,
            phone: location.user.phone || null,
            latitude: location.user.latitude,
            longitude: location.user.longitude,
            accuracy: location.user.accuracy
        },
        createdAt: location.createdAt,
        expiresAt: location.expiresAt,
        isExpired: false
    });
});

// POST /api/location - Partager une nouvelle position
app.post('/api/location', (req, res) => {
    const { user, shareDuration } = req.body;
    
    // Validation des données
    if (!user || !user.name || typeof user.latitude !== 'number' || typeof user.longitude !== 'number') {
        return res.status(400).json({ 
            error: 'Données manquantes ou invalides',
            code: 'INVALID_DATA',
            required: ['user.name', 'user.latitude', 'user.longitude']
        });
    }
    
    // Validation des coordonnées
    if (user.latitude < -90 || user.latitude > 90) {
        return res.status(400).json({ 
            error: 'Latitude invalide (doit être entre -90 et 90)',
            code: 'INVALID_LATITUDE'
        });
    }
    
    if (user.longitude < -180 || user.longitude > 180) {
        return res.status(400).json({ 
            error: 'Longitude invalide (doit être entre -180 et 180)',
            code: 'INVALID_LONGITUDE'
        });
    }
    
    // Validation de la durée
    const duration = parseInt(shareDuration) || 24;
    if (duration < 1 || duration > 168) {
        return res.status(400).json({ 
            error: 'Durée de partage invalide (1-168 heures)',
            code: 'INVALID_DURATION'
        });
    }
    
    const shareId = generateShareId();
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    
    const locationData = {
        shareId,
        user: {
            name: user.name.trim(),
            phone: user.phone ? user.phone.trim() : null,
            latitude: user.latitude,
            longitude: user.longitude,
            accuracy: user.accuracy || null
        },
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    sharedLocations.set(shareId, locationData);
    
    // Générer l'URL de partage
    const shareUrl = `${req.protocol}://${req.get('host')}/?share=${shareId}`;
    
    res.status(201).json({
        shareId,
        shareUrl,
        expiresAt,
        message: 'Position partagée avec succès'
    });
});

// PUT /api/location/:shareId - Mettre à jour une position
app.put('/api/location/:shareId', (req, res) => {
    const { shareId } = req.params;
    const { user } = req.body;
    
    const location = sharedLocations.get(shareId);
    
    if (!location) {
        return res.status(404).json({ 
            error: 'Position non trouvée',
            code: 'LOCATION_NOT_FOUND'
        });
    }
    
    if (new Date() > new Date(location.expiresAt)) {
        sharedLocations.delete(shareId);
        return res.status(410).json({ 
            error: 'Position expirée',
            code: 'LOCATION_EXPIRED'
        });
    }
    
    // Mettre à jour les données
    if (user) {
        if (user.latitude !== undefined) location.user.latitude = user.latitude;
        if (user.longitude !== undefined) location.user.longitude = user.longitude;
        if (user.accuracy !== undefined) location.user.accuracy = user.accuracy;
        if (user.name) location.user.name = user.name.trim();
        if (user.phone !== undefined) location.user.phone = user.phone ? user.phone.trim() : null;
    }
    
    location.updatedAt = new Date();
    
    res.json({
        shareId,
        message: 'Position mise à jour avec succès',
        updatedAt: location.updatedAt
    });
});

// DELETE /api/location/:shareId - Supprimer une position
app.delete('/api/location/:shareId', (req, res) => {
    const { shareId } = req.params;
    
    const deleted = sharedLocations.delete(shareId);
    
    if (deleted) {
        res.json({ 
            message: 'Position supprimée avec succès',
            shareId
        });
    } else {
        res.status(404).json({ 
            error: 'Position non trouvée',
            code: 'LOCATION_NOT_FOUND'
        });
    }
});

// GET /api/locations - Lister toutes les positions (pour debug, à supprimer en production)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/locations', (req, res) => {
        const locations = Array.from(sharedLocations.values()).map(location => ({
            shareId: location.shareId,
            userName: location.user.name,
            createdAt: location.createdAt,
            expiresAt: location.expiresAt,
            isExpired: new Date() > new Date(location.expiresAt)
        }));
        
        res.json({
            count: locations.length,
            locations
        });
    });
}

// API pour intégration avec d'autres applications

// POST /api/integration/share - API simplifiée pour intégration
app.post('/api/integration/share', (req, res) => {
    const { name, latitude, longitude, phone, duration = 24 } = req.body;
    
    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ 
            error: 'Paramètres requis: name, latitude, longitude',
            code: 'MISSING_PARAMETERS'
        });
    }
    
    const shareId = generateShareId();
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    
    const locationData = {
        shareId,
        user: {
            name: name.trim(),
            phone: phone ? phone.trim() : null,
            latitude,
            longitude,
            accuracy: null
        },
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    sharedLocations.set(shareId, locationData);
    
    const shareUrl = `${req.protocol}://${req.get('host')}/?share=${shareId}`;
    
    res.json({
        success: true,
        shareId,
        shareUrl,
        expiresAt,
        user: {
            name: locationData.user.name,
            latitude: locationData.user.latitude,
            longitude: locationData.user.longitude
        }
    });
});

// GET /api/integration/location/:shareId - API simplifiée pour récupération
app.get('/api/integration/location/:shareId', (req, res) => {
    const { shareId } = req.params;
    
    const location = sharedLocations.get(shareId);
    
    if (!location) {
        return res.status(404).json({ 
            success: false,
            error: 'Position non trouvée'
        });
    }
    
    if (new Date() > new Date(location.expiresAt)) {
        sharedLocations.delete(shareId);
        return res.status(410).json({ 
            success: false,
            error: 'Position expirée'
        });
    }
    
    res.json({
        success: true,
        user: {
            name: location.user.name,
            phone: location.user.phone,
            latitude: location.user.latitude,
            longitude: location.user.longitude,
            accuracy: location.user.accuracy
        },
        createdAt: location.createdAt,
        expiresAt: location.expiresAt
    });
});

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route pour servir l'application principale
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'location-sharing-app.html'));
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    
    res.status(500).json({
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        code: 'ROUTE_NOT_FOUND',
        path: req.originalUrl
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur de partage de localisation démarré sur le port ${PORT}`);
    console.log(`📱 Application accessible sur: http://localhost:${PORT}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗺️ API disponible sur: http://localhost:${PORT}/api`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Debug: http://localhost:${PORT}/api/locations`);
    }
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

module.exports = app; 