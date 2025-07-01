// Service de stockage en ligne pour partager les données entre machines
// Utiliser un service simple et gratuit

class OnlineStorage {
    constructor() {
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.binId = '65a4f8c8-1b0d-4b0a-8f0a-8f0a8f0a8f0a'; // À remplacer par votre vrai bin ID
        this.apiKey = '$2a$10$your-api-key-here'; // À remplacer par votre vraie clé API
    }

    // Sauvegarder une position en ligne
    async saveLocation(locationData) {
        try {
            // Pour l'instant, utiliser localStorage comme fallback
            // En production, décommentez le code ci-dessous pour utiliser JSONBin.io
            
            /*
            const url = `${this.baseUrl}/${this.binId}`;
            
            // Charger les données existantes
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            let allLocations = [];
            if (response.ok) {
                const data = await response.json();
                allLocations = data.record.locations || [];
            }
            
            // Ajouter la nouvelle position
            allLocations.push(locationData);
            
            // Limiter à 100 positions maximum
            if (allLocations.length > 100) {
                allLocations = allLocations.slice(-100);
            }
            
            // Sauvegarder les données mises à jour
            const updateResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    locations: allLocations,
                    lastUpdated: new Date().toISOString()
                })
            });
            
            if (updateResponse.ok) {
                console.log('✅ Position sauvegardée en ligne');
                return true;
            } else {
                throw new Error('Erreur sauvegarde en ligne');
            }
            */
            
            // Fallback: utiliser localStorage
            const sharedKey = 'shared_locations_global_v1';
            let allLocations = JSON.parse(localStorage.getItem(sharedKey) || '[]');
            allLocations.push(locationData);
            
            if (allLocations.length > 100) {
                allLocations = allLocations.slice(-100);
            }
            
            localStorage.setItem(sharedKey, JSON.stringify(allLocations));
            console.log('✅ Position sauvegardée localement (fallback)');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            return false;
        }
    }

    // Charger toutes les positions depuis le stockage en ligne
    async loadLocations() {
        try {
            // Pour l'instant, utiliser localStorage comme fallback
            // En production, décommentez le code ci-dessous pour utiliser JSONBin.io
            
            /*
            const url = `${this.baseUrl}/${this.binId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const allLocations = data.record.locations || [];
                
                // Nettoyer les positions expirées
                const now = new Date();
                const activeLocations = allLocations.filter(location => {
                    return new Date(location.expiresAt) > now;
                });
                
                return activeLocations;
            } else {
                throw new Error('Erreur chargement en ligne');
            }
            */
            
            // Fallback: utiliser localStorage
            const sharedKey = 'shared_locations_global_v1';
            const allLocations = JSON.parse(localStorage.getItem(sharedKey) || '[]');
            
            // Nettoyer les positions expirées
            const now = new Date();
            const activeLocations = allLocations.filter(location => {
                return new Date(location.expiresAt) > now;
            });
            
            return activeLocations;
            
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
            return [];
        }
    }
}

// Créer une instance globale
window.onlineStorage = new OnlineStorage(); 