// js/UIConfig.js

// ==========================================
// 1. CONSTANTES LOCALES
// ==========================================
const FONT_FAMILY = "'GameFont', sans-serif";
const BASE_SM = 40; // Petit texte UI (Stats, icônes)
const BASE_MD = 60; // Texte standard
const BASE_LG = 80; // Gros titres (Pause, Game Over)

// ==========================================
// 2. CONFIGURATION EXPORTÉE
// ==========================================
export const UIConfig = {
    // ==========================================
    // 🌍 GLOBAUX & FONDATIONS VISUELLES
    // ==========================================

    TYPOGRAPHY: {
        FAMILY: FONT_FAMILY,
        SIZE_SM: BASE_SM, 
        SIZE_MD: BASE_MD, 
        SIZE_LG: BASE_LG  
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
            DURATION_MS: 1500,     
            TRANSITION_MS: 500,    

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

            TEXT: {
                PLAY_BTN: 'PLAY'
            },
            COLORS: {
                FALLBACK_BG: '#111111'
            },
            LAYOUT: {
                TITLE_MAX_WIDTH_PCT: 0.8,
                SQUAT_AMPLITUDE: 60,
                TRAIL_SPEED_MULT: 3
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

                LABELS: {
                    'PRIMARY_DAMAGE': [
                        'GUN DAMAGE I',
                        'GUN DAMAGE II',
                        'GUN DAMAGE III'
                    ],
                    'PRIMARY_FIRE_RATE': [
                        'GUN SPEED I',
                        'GUN SPEED II',
                        'GUN SPEED III'
                    ],
                    'PRIMARY_BULLET_SPEED': [
                        'VELOCITY I',
                        'VELOCITY II',
                        'VELOCITY III'
                    ],
                    'SECONDARY_DAMAGE': [
                        'MISSILE DAMAGE I',
                        'MISSILE DAMAGE II',
                        'MISSILE DAMAGE III'
                    ],
                    'SECONDARY_COUNT': [
                        'MISSILE COUNT +1',
                        'MISSILE COUNT +2',
                        'MISSILE COUNT +3'
                    ],
                    'SECONDARY_COOLDOWN': [
                        'MISSILE RELOAD I',
                        'MISSILE RELOAD II',
                        'MISSILE RELOAD III'
                    ],
                    'HULL_REPAIR': [
                        'HULL REPAIR I',
                        'HULL REPAIR II',
                        'HULL REPAIR III'
                    ]
                },

                getColor: function (type) {
                    if (type.startsWith('PRIMARY')) return this.COLORS.PRIMARY;
                    if (type.startsWith('SECONDARY')) return this.COLORS.SECONDARY;
                    if (type.startsWith('HULL')) return this.COLORS.HULL;
                    return this.COLORS.DEFAULT;
                },

                getLabel: function (type, tierIndex = 0) {
                    if (this.LABELS[type] && this.LABELS[type][tierIndex]) {
                        return this.LABELS[type][tierIndex];
                    }
                    return 'UNKNOWN\nUPGRADE';
                }
            },

            TIMING: {
                FADE_IN_DURATION: 600,
                FADE_IN_COLOR: '#000000',
                TUTORIAL_DELAY: 600,
                SPEED_LINES_DURATION: 2500,
                GAMEOVER_SLOWMO_DURATION: 2000,
                GAMEOVER_TIME_SCALE: 0.25
            }
        },

        // --- ÉCRAN DE FIN DE PARTIE ---
        GAMEOVER: {
            REPLAY_BTN_Y_PERCENTAGE: 0.60,
            BUTTON_APPEAR_DELAY_MS: 2000,
            FADE_MS: 1500,
            BOUNCE_MS: 1750,
            BTN_SLIDE_MS: 1500,

            TEXT: {
                TITLE: 'GAME OVER',
                REPLAY: 'REPLAY',
                MENU: 'MAIN MENU'
            },
            COLORS: {
                TITLE: '#e74c3c',
                TITLE_SHADOW: 'rgba(241, 196, 15, 0.5)',
                OVERLAY: 'rgba(0, 0, 0, 0.75)'
            },
            LAYOUT: {
                BTN_WIDTH_MULT: 1.4,
                BTN_MAX_WIDTH_PCT: 0.8,
                BTN_HEIGHT_MULT: 1.5,
                BTN_MARGIN_Y_PCT: 0.05,
                TITLE_Y_PCT: 0.25,
                TITLE_START_Y: -200,
                TITLE_FONT_SIZE: 150,
                TITLE_SHADOW_BLUR: 20,
                BTN_START_Y_OFFSET: 50
            },
            TRANSITIONS: {
                TYPE: 'IRIS',
                DURATION_MS: 1000,
                STAGGER_DELAY: 0.15
            }
        },

        // --- ÉCRAN D'AMÉLIORATION (SUPER UPGRADE) ---
        UPGRADE: {
            TEXT: {
                TITLE: 'EVOLUTION READY'
            },
            COLORS: {
                OVERLAY_BG: 'rgba(0, 0, 0, 0.85)',
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
                TITLE_Y_PCT: 0.15,
                SPRITE_SIZE_PCT: 0.6,
                SPRITE_Y_PCT: 0.15,
                CARD_TITLE_Y_PCT: 0.6,
                CARD_DESC_Y_PCT: 0.75
            },
            TIMING: {
                ANIMATION_MS: 600,
                CLICK_DELAY_MS: 500,
                FADE_OUT_MS: 400
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
                PRIMARY_TITLE: 'GUN',
                PRIMARY_DESC: 'Direct physical \ndamage.',
                SECONDARY_TITLE: 'MISSILES',
                SECONDARY_DESC: 'Homing explosive\nordinance.',
                GATE_PRIMARY_DESC: 'Orange upgrades the \nprimary weapon...',
                GATE_SECONDARY_DESC: '...and Blue upgrades \nthe secondary !'
            },
            STYLES: {
                MAIN_TITLE: { weight: 'bold', fontSize: 40, color: '#ffffff' },
                SIM_TITLE: { weight: 'bold', fontSize: 44, color: '#ffffff' },
                SIM_DESC: { weight: 'normal', fontSize: 32, color: '#aaaaaa', lineHeight: 38 },
                GATE_DESC_PRIMARY: { weight: 'bold', fontSize: 24, color: '#ff9900' },
                GATE_DESC_SECONDARY: { weight: 'bold', fontSize: 24, color: '#00ccff' }
            },
            COLORS: {
                OVERLAY: 'rgba(0, 0, 0, 0.9)',
                BOX_BG: '#0a0a0a',
                BOX_BORDER: '#444444',
                GATE_PRIMARY: '#ff9900',
                GATE_SECONDARY: '#00ccff'
            },
            LAYOUT: {
                BTN_Y_PCT: 0.85,
                BTN_WIDTH_MULT: 1.4,
                BTN_MAX_WIDTH_PCT: 0.8,
                BTN_HEIGHT_MULT: 1.5,
                BOX_WIDTH: 300,
                BOX_HEIGHT: 800,
                BOX_SPACING: 40,
                BOX_BORDER_WIDTH: 4,
                TITLE_Y_PCT: 0.10,
                TITLE_SCREEN_2_Y_PCT: 0.15,
                DESC_OFFSET_Y_1: 60,
                DESC_OFFSET_Y_2: 110,
                GATE_DESC_OFFSET_Y: 120,
                GATE_SPACING_Y: 350
            }
        },

        // --- ÉCRAN DE PARAMÈTRES / PAUSE ---
        SETTINGS: {
            TEXT: {
                TITLE: 'SYSTEM PAUSED',
                RESUME: 'RESUME',
                MENU: 'ABORT MISSION',
                MUSIC: 'MUSIC : ',
                SFX: 'SFX : '
            },
            STYLES: {
                // Utilisation de nos constantes locales !
                TITLE: { weight: 'bold', fontSize: BASE_LG, color: '#ffffff' },
                STAT_ICON: { weight: 'normal', fontSize: BASE_SM, color: '#ffffff' },
                STAT_VALUE: { weight: 'bold', fontSize: BASE_SM - 5, color: '#2ecc71' },
                STAT_LABEL: { weight: 'normal', fontSize: BASE_SM - 15, color: '#aaaaaa' }
            },
            COLORS: {
                OVERLAY: 'rgba(0, 0, 0, 0.85)',
                PANEL_BG: 'rgba(10, 15, 20, 0.95)', 
                PANEL_BORDER: '#3498db'
            },
            LAYOUT: {
                PANEL_WIDTH_PCT: 0.85,
                PANEL_HEIGHT: 180,
                PANEL_OFFSET_Y: 500, 
                PANEL_RADIUS: 15,
                
                TITLE_Y_PCT: 0.20,
                BTN_RESUME_Y_PCT: 0.30,
                BTN_MUSIC_Y_PCT: 0.50,
                BTN_SFX_Y_PCT: 0.60,
                BTN_MENU_Y_PCT: 0.40,

                GEAR_BTN_SIZE: 60,
                GEAR_BTN_MARGIN: 20 
            }
        } // Fin de SETTINGS
        
    }, // <-- FIN DU BLOC SCREENS 

    // ============================================================================
    // MOTEUR DE RENDU DE TEXTE UNIVERSEL
    // ============================================================================
    /**
     * Dessine un texte (multiligne ou non) en appliquant automatiquement un style.
     * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas
     * @param {string} text - Le texte à afficher (accepte les '\n')
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {Object} style - Objet de configuration visuelle
     */
    drawText: function (ctx, text, x, y, style = {}) {
        if (text === undefined || text === null) return;

        const fontSize = style.fontSize || this.TYPOGRAPHY.SIZE_MD;
        const fontFamily = style.fontFamily || this.TYPOGRAPHY.FAMILY;
        const weight = style.weight || 'normal';
        const lineHeight = style.lineHeight || (fontSize * 1.2);

        ctx.save();

        ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = style.color || '#ffffff';
        ctx.textAlign = style.align || 'center';
        ctx.textBaseline = style.baseline || 'middle';

        // Gestion du multiligne native !
        const lines = text.toString().split('\n');
        lines.forEach((line, index) => {
            ctx.fillText(line, x, y + (index * lineHeight));
        });

        ctx.restore();
    }
};