// js/GameConfig.js

export const GameConfig = {

    CANVAS: {
        WIDTH: 1080,  // Logique d'affichage (ratio 9:16)
        HEIGHT: 1920
    },

    // ==========================================
    // MOTEUR & ÉTATS DU JEU
    // ==========================================
    STATES: {
        START: 0,       // Menu initial
        PLAYING: 1,     // Boucle de jeu active
        GAMEOVER: 2     // Écran de fin de partie
    },

    SCROLL_SPEED: 0.3,  // Vitesse de défilement vers le bas (px/ms)

    // ==========================================
    // SYSTÈME DE GRILLE & POSITIONNEMENT
    // ==========================================
    MARGIN_X: 108,      // Marge de zone sûre horizontale (10%)

    ENEMY_LANES: [216, 432, 648, 864], // Coordonnées X pour 4 colonnes d'ennemis
    GATE_LANES: [324, 756],            // Coordonnées X pour les portes (centrées entre les lignes d'ennemis)

    // ==========================================
    // CONFIGURATION DU JOUEUR (Logique Pure)
    // ==========================================
    PLAYER_BASE_HP: 100,         // Points de vie initiaux
    PLAYER_BASE_DMG: 10,         // Config legacy (remplacée par les stats d'armes)

    // ==========================================
    // ÉQUILIBRAGE & PROGRESSION (Formules HP)
    // ==========================================

    /**
     * Calcule les HP des ennemis normaux selon l'index de progression (x).
     * Formule: 10 + 0.2x^2 + 0.03x^3
     */
    calculateEnemyHp: function (x) {
        const index = Math.max(1, x);
        return Math.floor(10 + (0.2 * Math.pow(index, 2)) + (0.03 * Math.pow(index, 3)));
    },

    /**
     * Calcule les HP des Boss / Miniboss selon l'index de progression et le type.
     */
    calculateBossHp: function (x, encounterType = 'BOSS') {
        const index = Math.max(1, x);

        if (encounterType === 'TUTORIAL') return 50;     // HP fixes pour le tuto
        if (encounterType === 'FINAL') return 50000;      // HP fixes pour la rencontre finale

        if (encounterType === 'MINIBOSS') {
            // HP réduits par un facteur de 10 (Formule: x^2 + 10x)
            return Math.floor(Math.pow(index, 2) + (10 * index));
        }

        return Math.floor(3.3 * Math.pow(index, 2));       // 33x^2 (Boss standards)
    },

    // ==========================================
    // CONFIGURATIONS DES BOSS
    // ==========================================
    BOSS_DEFINITIONS: {
        'miniboss': {
            assetKey: 'miniboss', 
            scale: 2.0            // Multiplicateur appliqué au BASE_WIDTH
        },
        'boss': {
            assetKey: 'boss',
            scale: 3.0            // Rend à 900px
        },
        'final_boss': {
            assetKey: 'finalboss',
            scale: 4.0            // Rend à 1200px (débordement d'écran intentionnel)
        }
    },

    /**
     * Fonction utilitaire pour associer les données de rencontre à la bonne config de boss.
     */
    getBossDef: function (encounterData) {
        if (encounterData.id === 'final_boss') return this.BOSS_DEFINITIONS['final_boss'];
        if (encounterData.type === 'MINIBOSS') return this.BOSS_DEFINITIONS['miniboss'];
        return this.BOSS_DEFINITIONS['boss']; // Remplacement par défaut
    },
};