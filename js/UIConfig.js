// js/UIConfig.js

export const UIConfig = {
    // ==========================================
    // 🌍 GLOBAUX & FONDATIONS VISUELLES
    // ==========================================


    TYPOGRAPHY: {
        FAMILY: "'GameFont', sans-serif",
        SIZE_SM: 40, // Petit texte UI
        SIZE_MD: 60, // Texte de combat standard
        SIZE_LG: 80  // Annonces à l'écran
    },

    // ==========================================
    // 🧩 COMPOSANTS COMMUNS (Ex: Boutons)
    // ==========================================
    BUTTONS: {
        DEFAULTS: { width: 400, height: 64, cornerRadius: 15 },
        THEMES: {
            primary: { normal: '#3498db', hover: '#2980b9', click: '#1f618d', border: '#21618c', text: '#ffffff' },
            start: { normal: '#2ecc71', hover: '#27ae60', click: '#1d8348', border: '#196f3d', text: '#ffffff' },
            restart: { normal: '#e74c3c', hover: '#c0392b', click: '#943126', border: '#78281f', text: '#ffffff' }
        }
    },

    // ==========================================
    // 🎬 ANIMATIONS GLOBALES
    // ==========================================
    ANIMATIONS: {
        BTN_HOVER_RISE: 5,
        BTN_INNER_SHIFT: 3,
        CLICK_PAUSE_MS: 250,
        CLICK_FILL_DURATION_MS: 1000,
        OPEN_DURATION_MS: 800,
        TITLE_BREATH_SPEED: 0.002,
        TITLE_BREATH_AMPLITUDE: 10,
        BTN_BREATH_SPEED: 0.0015,
        BTN_BREATH_AMPLITUDE: 8,
        EXHAUST_PARTICLE_COUNT: 5,
        EXHAUST_BASE_SIZE: 15,
        EXHAUST_MAX_DROP: 60,
        TEXT_PULSE_SPEED: 0.005,
    },

    // ==========================================
    // 📺 ÉCRANS SPÉCIFIQUES
    // ==========================================
    SCREENS: {
        // --- ÉCRAN DE CHARGEMENT ---
        LOAD: {
            DURATION_MS: 1500,     // Durée du faux chargement
            TRANSITION_MS: 500,    // Durée du fondu vers le menu

            TEXT: {
                LOADING: 'LOADING SYSTEM...',
                READY: 'LOADING FINISHED',
                PROMPT: 'TAP TO START'
            },

            COLORS: {
                TEXT: '#ffffff',
                BAR_BG: '#333333',
                BAR_FILL: '#2ecc71',
                BAR_BORDER: '#ffffff'
            },

            LAYOUT: {
                BAR_WIDTH: 400,
                BAR_HEIGHT: 30,
                BAR_BORDER_WIDTH: 4,
                LOADING_TEXT_OFFSET_Y: -60,
                BAR_OFFSET_Y: 20,
                READY_TEXT_OFFSET_Y: -40,
                PROMPT_TEXT_OFFSET_Y: 60
            }
        },

        // --- ÉCRAN TITRE / MENU ---
        START: {
            TITLE_Y_PERCENTAGE: 0.10,
            PLAYER_Y_OFFSET_PERCENTAGE: 0.10,
            TITLE_PLAYER_SIZE: 450,
            PLAY_BTN_Y_PERCENTAGE: 0.75,
            PLAY_BTN_SCALE: 2,
            TRANSITION_MS: 1500,

            // Nouveaux éléments extraits :
            TEXT: {
                PLAY_BTN: 'PLAY'
            },
            COLORS: {
                FALLBACK_BG: '#111111' // Remplacera le '#111' en dur
            },
            LAYOUT: {
                TITLE_MAX_WIDTH_PCT: 0.8, // Le titre prend max 80% de l'écran
                SQUAT_AMPLITUDE: 60,      // L'effet de recul avant décollage
                TRAIL_SPEED_MULT: 3       // Multiplicateur de traînée pendant le décollage
            }
        },

        // --- IN-GAME (HUD, Feedbacks & Transitions) ---
        IN_GAME: {
            BONUS_VISUALS: {
                FONT_SIZE_GATE: 50,
                FONT_SIZE_DROP: 50,
                OUTLINE_WIDTH: 3,
                OUTLINE_COLOR: '#000000',
                SHADOW_COLOR: 'rgba(0, 0, 0, 0.8)',
                SHADOW_BLUR: 4,
                SHADOW_OFFSET_Y: 2,
                COLORS: {
                    PRIMARY: '#e67e22',
                    SECONDARY: '#3498db',
                    HULL: '#2ecc71',
                    DEFAULT: '#ffffff'
                },
                getColor: function (type) {
                    if (type.startsWith('PRIMARY')) return this.COLORS.PRIMARY;
                    if (type.startsWith('SECONDARY')) return this.COLORS.SECONDARY;
                    if (type.startsWith('HULL')) return this.COLORS.HULL;
                    return this.COLORS.DEFAULT;
                },
                getLabel: function (type, value) {
                    switch (type) {
                        case 'HULL_REPAIR': return `+${value} HP`;
                        case 'PRIMARY_DAMAGE': return `+${value} DMG`;
                        case 'PRIMARY_FIRE_RATE': return `-${value}ms CD`;
                        case 'PRIMARY_BULLET_SPEED': return `+${value} VEL`;
                        case 'SECONDARY_DAMAGE': return `+${value} DMG`;
                        case 'SECONDARY_COUNT': return `+${value} PROJ`;
                        case 'SECONDARY_COOLDOWN': return `-${Math.round(value * 100)}% CD`;
                        default: return `UPGRADE`;
                    }
                }
            },

            TIMING: {
                FADE_IN_DURATION: 600,        // Duration of the black fade at start
                FADE_IN_COLOR: '#000000',
                TUTORIAL_DELAY: 600,          // Wait time before showing the tutorial
                SPEED_LINES_DURATION: 2500,   // Duration of speed lines after upgrade
                GAMEOVER_SLOWMO_DURATION: 2000, // How long the death slow-mo lasts
                GAMEOVER_TIME_SCALE: 0.25     // Slow-mo factor (25% speed)
            }
        },

        // --- ÉCRAN DE FIN DE PARTIE ---
        GAMEOVER: {
            REPLAY_BTN_Y_PERCENTAGE: 0.60,
            BUTTON_APPEAR_DELAY_MS: 2000,
            FADE_MS: 1500,
            BOUNCE_MS: 1750,
            BTN_SLIDE_MS: 1500,

            // NOUVEAU : Centralisation des textes, couleurs et dimensions
            TEXT: {
                TITLE: 'GAME OVER',
                REPLAY: 'REPLAY',
                MENU: 'MAIN MENU'
            },
            COLORS: {
                TITLE: '#e74c3c',
                TITLE_SHADOW: 'rgba(241, 196, 15, 0.5)',
                OVERLAY: 'rgba(0, 0, 0, 0.75)' // Remplacera le calcul `rgba(0,0,0, 0.75 * fade)`
            },
            LAYOUT: {
                BTN_WIDTH_MULT: 1.4,
                BTN_MAX_WIDTH_PCT: 0.8,
                BTN_HEIGHT_MULT: 1.5,
                BTN_MARGIN_Y_PCT: 0.05,
                TITLE_Y_PCT: 0.25,        // Position Y cible du titre
                TITLE_START_Y: -200,      // Position de départ du rebond
                TITLE_FONT_SIZE: 150,     // Taille de la police du titre
                TITLE_SHADOW_BLUR: 20,    // Intensité de l'ombre
                BTN_START_Y_OFFSET: 50    // Distance de glissement des boutons
            },
            TRANSITIONS: {
                TYPE: 'IRIS',
                DURATION_MS: 1000,
                STAGGER_DELAY: 0.15       // Délai entre l'apparition des boutons
            }
        },

        // --- ÉCRAN D'AMÉLIORATION (SUPER UPGRADE) ---
        UPGRADE: {
            TEXT: {
                TITLE: 'EVOLUTION READY'
            },
            COLORS: {
                OVERLAY_BG: 'rgba(0, 0, 0, 0.85)',
                // On met les couleurs de rareté dans un tableau (0: Basic, 1: Rare, 2: Legendary, 3: Default)
                TIERS: ['#3498db', '#9b59b6', '#f1c40f', '#ffffff'],
                CARD_BG_NORMAL: '#1a252f',
                CARD_BG_HOVER: '#2c3e50',
                TEXT_TITLE: '#ffffff',
                TEXT_DESC: '#bdc3c7',
                FADE_OUT: '#000000'
            },
            LAYOUT: {
                CARD_WIDTH_PCT: 0.28,
                CARD_HEIGHT_PCT: 0.60,
                CARD_SPACING_PCT: 0.04,
                CARD_RADIUS: 15,
                BORDER_NORMAL: 3,
                BORDER_HOVER: 6,
                SHADOW_BLUR: 20,
                TITLE_Y_PCT: 0.15,        // Position du titre principal
                SPRITE_SIZE_PCT: 0.6,     // Taille du sprite dans la carte
                SPRITE_Y_PCT: 0.15,       // Position Y du sprite
                CARD_TITLE_Y_PCT: 0.6,    // Position Y du nom de l'amélioration
                CARD_DESC_Y_PCT: 0.75     // Position Y de la description
            },
            TIMING: {
                ANIMATION_MS: 600,        // Durée des particules avant fermeture
                CLICK_DELAY_MS: 500,      // Anti-spam à l'ouverture
                FADE_OUT_MS: 400          // Transition de fermeture
            },
            PARTICLES: {
                COUNT: 40,
                BASE_SIZE: 20,
                GRAVITY: 0.15
            }
        },

        // --- ÉCRAN TUTORIEL ---
        TUTORIAL: {
            TEXT: {
                BTN_NEXT: 'NEXT',
                BTN_PLAY: 'PLAY NOW',
                TITLE_SCREEN_1: 'WEAPON SYSTEMS',
                TITLE_SCREEN_2: 'UPGRADE PORTALS',
                PRIMARY_TITLE: 'PRIMARY WEAPON',
                PRIMARY_DESC: 'Direct physical damage.',
                SECONDARY_TITLE: 'SECONDARY WEAPON',
                SECONDARY_DESC: 'Homing explosive ordinance.',
                GATE_PRIMARY_DESC: 'Orange upgrades the primary weapon...',
                GATE_SECONDARY_DESC: '...and Blue upgrades the secondary !'
            },
            COLORS: {
                OVERLAY: 'rgba(0, 0, 0, 0.9)',
                TEXT_MAIN: '#ffffff',
                TEXT_DESC: '#aaaaaa',
                BOX_BG: '#0a0a0a',
                BOX_BORDER: '#444444',
                GATE_PRIMARY: '#ff9900',   // Orange
                GATE_SECONDARY: '#00ccff'  // Blue
            },
            LAYOUT: {
                BTN_Y_PCT: 0.85,
                BTN_WIDTH_MULT: 1.4,
                BTN_MAX_WIDTH_PCT: 0.8,
                BTN_HEIGHT_MULT: 1.5,

                // Dimensions des boîtes de simulation
                BOX_WIDTH: 300,
                BOX_HEIGHT: 800,
                BOX_SPACING: 20,          // Écart par rapport au centre
                BOX_BORDER_WIDTH: 4,

                // Positions relatives
                TITLE_Y_PCT: 0.10,        // Y du grand titre
                TITLE_SCREEN_2_Y_PCT: 0.15,
                DESC_OFFSET_Y_1: 60,      // Décalage du titre sous la boîte
                DESC_OFFSET_Y_2: 110,     // Décalage de la description sous la boîte
                GATE_DESC_OFFSET_Y: 120   // Décalage du texte sous les portes
            }
        },
    }
};