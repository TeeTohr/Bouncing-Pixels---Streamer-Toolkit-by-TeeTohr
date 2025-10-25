// ========================================
// Image Spin System
// Gestion de la rotation des logos
// ========================================

// Paramètres de rotation
let spinEnabled = false;
let spinSpeedMin = 0.5;
let spinSpeedMax = 0.5;
let spinChangeSpeedOnBounce = false;
let spinDirection = 'clockwise'; // 'clockwise', 'counter-clockwise', 'random-on-bounce', 'opposite-on-bounce'
let spinMultipleLogosBehavior = 'unique'; // 'same', 'unique'
let spinCollisionDetection = 'optimized'; // 'precise', 'optimized'

// Précalcul des bounding boxes pour la méthode optimisée
// Tableau de 24 valeurs (tous les 15°) pour width et height
const PRECALC_ANGLE_STEP = 15;
const PRECALC_ANGLE_COUNT = 24;
let boundingBoxCache = new Map(); // Map<logoId, {widths: [], heights: []}>

// Rotation globale pour le mode "same rotation"
let globalSpinSpeed = 0.5;
let globalSpinDirection = 1; // 1 = clockwise, -1 = counter-clockwise
let globalRotationAngle = 0; // Angle global partagé par tous les logos en mode "same"

// ========================================
// Initialisation des paramètres de rotation pour un logo
// ========================================
function initLogoSpin(logo) {
    // Angle initial
    logo.rotation = 0;
    
    // Vitesse et direction
    if (spinMultipleLogosBehavior === 'same') {
        logo.spinSpeed = globalSpinSpeed;
        logo.spinDirectionMultiplier = globalSpinDirection;
    } else {
        logo.spinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
        logo.spinDirectionMultiplier = getRandomSpinDirection();
    }
    
    // Précalculer la bounding box si nécessaire
    if (spinEnabled && spinCollisionDetection === 'optimized') {
        precalculateBoundingBox(logo);
    }
}

// ========================================
// Obtenir une direction aléatoire selon le paramètre spinDirection
// ========================================
function getRandomSpinDirection() {
    switch(spinDirection) {
        case 'clockwise':
            return 1;
        case 'counter-clockwise':
            return -1;
        case 'random-on-bounce':
        case 'opposite-on-bounce':
            // Pour ces modes, la direction initiale est aléatoire
            return Math.random() < 0.5 ? 1 : -1;
        default:
            return 1;
    }
}

// ========================================
// Précalculer la bounding box pour un logo (méthode optimisée)
// ========================================
function precalculateBoundingBox(logo) {
    const widths = [];
    const heights = [];
    
    const originalWidth = logo.width;
    const originalHeight = logo.height;
    
    // Précalculer pour chaque angle (0°, 15°, 30°, ..., 345°)
    for (let i = 0; i < PRECALC_ANGLE_COUNT; i++) {
        const angleDeg = i * PRECALC_ANGLE_STEP;
        const angleRad = angleDeg * Math.PI / 180;
        
        const cosA = Math.abs(Math.cos(angleRad));
        const sinA = Math.abs(Math.sin(angleRad));
        
        const boundingWidth = originalWidth * cosA + originalHeight * sinA;
        const boundingHeight = originalWidth * sinA + originalHeight * cosA;
        
        widths.push(boundingWidth);
        heights.push(boundingHeight);
    }
    
    boundingBoxCache.set(logo.id, { widths, heights });
}

// ========================================
// Obtenir la bounding box actuelle d'un logo selon son angle
// ========================================
function getLogoBoundingBox(logo) {
    if (!spinEnabled) {
        return { width: logo.width, height: logo.height };
    }
    
    if (spinCollisionDetection === 'precise') {
        // Méthode précise : calcul exact à chaque frame
        return calculatePreciseBoundingBox(logo);
    } else {
        // Méthode optimisée : interpolation entre valeurs précalculées
        return getOptimizedBoundingBox(logo);
    }
}

// ========================================
// Calcul précis de la bounding box (méthode coûteuse)
// ========================================
function calculatePreciseBoundingBox(logo) {
    const angleRad = (logo.rotation % 360) * Math.PI / 180;
    const cosA = Math.abs(Math.cos(angleRad));
    const sinA = Math.abs(Math.sin(angleRad));
    
    const boundingWidth = logo.width * cosA + logo.height * sinA;
    const boundingHeight = logo.width * sinA + logo.height * cosA;
    
    return { width: boundingWidth, height: boundingHeight };
}

// ========================================
// Obtenir la bounding box optimisée par interpolation
// ========================================
function getOptimizedBoundingBox(logo) {
    const cache = boundingBoxCache.get(logo.id);
    if (!cache) {
        // Fallback si pas de cache (ne devrait pas arriver)
        return { width: logo.width, height: logo.height };
    }
    
    // Normaliser l'angle entre 0 et 360
    const normalizedAngle = ((logo.rotation % 360) + 360) % 360;
    
    // Trouver les deux angles précalculés encadrants
    const index = normalizedAngle / PRECALC_ANGLE_STEP;
    const lowerIndex = Math.floor(index) % PRECALC_ANGLE_COUNT;
    const upperIndex = (lowerIndex + 1) % PRECALC_ANGLE_COUNT;
    
    // Facteur d'interpolation
    const t = index - Math.floor(index);
    
    // Interpolation linéaire
    const width = cache.widths[lowerIndex] * (1 - t) + cache.widths[upperIndex] * t;
    const height = cache.heights[lowerIndex] * (1 - t) + cache.heights[upperIndex] * t;
    
    return { width, height };
}

// ========================================
// Mettre à jour la rotation d'un logo
// ========================================
function updateLogoSpin(logo, deltaTime) {
    if (!spinEnabled) {
        // Si la rotation est désactivée, s'assurer que l'angle est à 0
        if (logo.rotation !== 0) {
            logo.rotation = 0;
            applyRotationToElement(logo);
        }
        return;
    }
    
    if (spinMultipleLogosBehavior === 'same') {
        // Mode "same" : utiliser l'angle global (synchronisé pour tous)
        logo.rotation = globalRotationAngle;
    } else {
        // Mode "unique" : chaque logo calcule sa propre rotation
        const degreesPerSecond = logo.spinSpeed * 360;
        const rotationDelta = degreesPerSecond * logo.spinDirectionMultiplier * deltaTime;
        
        logo.rotation += rotationDelta;
        logo.rotation = logo.rotation % 360;
    }
    
    // Appliquer la rotation à l'élément HTML
    applyRotationToElement(logo);
}

// ========================================
// Mettre à jour la rotation globale (appelé une seule fois par frame)
// ========================================
function updateGlobalRotation(deltaTime) {
    if (!spinEnabled || spinMultipleLogosBehavior !== 'same') {
        return;
    }
    
    const degreesPerSecond = globalSpinSpeed * 360;
    const rotationDelta = degreesPerSecond * globalSpinDirection * deltaTime;
    
    globalRotationAngle += rotationDelta;
    globalRotationAngle = globalRotationAngle % 360;
}

// ========================================
// Appliquer la rotation CSS à l'élément
// ========================================
function applyRotationToElement(logo) {
    if (!logo.element) return;
    
    if (spinEnabled && logo.rotation !== 0) {
        logo.element.style.transform = `rotate(${logo.rotation}deg)`;
    } else {
        logo.element.style.transform = 'none';
    }
}

// ========================================
// Changer la rotation d'un logo au bounce
// ========================================
function changeLogoSpinOnBounce(logo, allLogos) {
    if (!spinEnabled) return;
    
    if (spinMultipleLogosBehavior === 'same') {
        // Mode "same" : on ne change pas ici, c'est géré par changeGlobalSpinOnBounce
        return;
    }
    
    // Mode "unique" : chaque logo change individuellement
    
    // Changer la vitesse si activé
    if (spinChangeSpeedOnBounce) {
        logo.spinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
    }
    
    // Changer la direction selon le mode
    switch(spinDirection) {
        case 'random-on-bounce':
            logo.spinDirectionMultiplier = Math.random() < 0.5 ? 1 : -1;
            break;
        case 'opposite-on-bounce':
            logo.spinDirectionMultiplier = -logo.spinDirectionMultiplier;
            break;
        // Pour clockwise et counter-clockwise, on ne change pas la direction
    }
}

// ========================================
// Changer la rotation globale (mode "same rotation")
// ========================================
function changeGlobalSpinOnBounce(allLogos) {
    if (!spinEnabled) return;
    if (spinMultipleLogosBehavior !== 'same') return;
    
    // Changer la vitesse si activé
    if (spinChangeSpeedOnBounce) {
        globalSpinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
        // Appliquer la nouvelle vitesse à tous les logos
        allLogos.forEach(logo => {
            logo.spinSpeed = globalSpinSpeed;
        });
    }
    
    // Changer la direction selon le mode
    switch(spinDirection) {
        case 'random-on-bounce':
            globalSpinDirection = Math.random() < 0.5 ? 1 : -1;
            break;
        case 'opposite-on-bounce':
            globalSpinDirection = -globalSpinDirection;
            break;
        // Pour clockwise et counter-clockwise, on ne change pas la direction
    }
    
    // Appliquer la nouvelle direction à tous les logos
    allLogos.forEach(logo => {
        logo.spinDirectionMultiplier = globalSpinDirection;
    });
}

// ========================================
// Mettre à jour les paramètres de rotation
// ========================================
function updateSpinSettings(settings, allLogos = []) {
    let needsRecalc = false;
    let needsReset = false;
    
    if (settings.spinEnabled !== undefined) {
        const wasEnabled = spinEnabled;
        spinEnabled = settings.spinEnabled;
        
        if (!spinEnabled && wasEnabled) {
            // Rotation désactivée : remettre tous les logos droits
            allLogos.forEach(logo => {
                logo.rotation = 0;
                applyRotationToElement(logo);
            });
        } else if (spinEnabled && !wasEnabled) {
            // Rotation activée : initialiser les rotations
            needsRecalc = true;
        }
    }
    
    if (settings.spinSpeedMin !== undefined) {
        spinSpeedMin = settings.spinSpeedMin;
        needsReset = true;
    }
    
    if (settings.spinSpeedMax !== undefined) {
        spinSpeedMax = settings.spinSpeedMax;
        needsReset = true;
    }
    
    if (settings.spinChangeSpeedOnBounce !== undefined) {
        spinChangeSpeedOnBounce = settings.spinChangeSpeedOnBounce;
    }
    
    if (settings.spinDirection !== undefined) {
        spinDirection = settings.spinDirection;
        needsReset = true;
    }
    
    if (settings.spinMultipleLogosBehavior !== undefined) {
        const oldBehavior = spinMultipleLogosBehavior;
        spinMultipleLogosBehavior = settings.spinMultipleLogosBehavior;
        
        if (oldBehavior !== spinMultipleLogosBehavior) {
            needsReset = true;
            // Réinitialiser l'angle global si on passe en mode "same"
            if (spinMultipleLogosBehavior === 'same') {
                globalRotationAngle = 0;
            }
        }
    }
    
    if (settings.spinCollisionDetection !== undefined) {
        const oldDetection = spinCollisionDetection;
        spinCollisionDetection = settings.spinCollisionDetection;
        
        if (oldDetection !== spinCollisionDetection && spinCollisionDetection === 'optimized') {
            needsRecalc = true;
        }
    }
    
    // Recalculer les bounding boxes si nécessaire
    if (needsRecalc && spinEnabled && spinCollisionDetection === 'optimized') {
        allLogos.forEach(logo => precalculateBoundingBox(logo));
    }
    
    // Réinitialiser les rotations si nécessaire
    if (needsReset && spinEnabled) {
        if (spinMultipleLogosBehavior === 'same') {
            globalSpinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
            globalSpinDirection = getRandomSpinDirection();
            allLogos.forEach(logo => {
                logo.spinSpeed = globalSpinSpeed;
                logo.spinDirectionMultiplier = globalSpinDirection;
            });
        } else {
            allLogos.forEach(logo => {
                logo.spinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
                logo.spinDirectionMultiplier = getRandomSpinDirection();
            });
        }
    }
}

// ========================================
// Recalculer les bounding boxes pour tous les logos
// (appelé lors d'un changement de scale)
// ========================================
function recalculateAllBoundingBoxes(allLogos) {
    if (!spinEnabled || spinCollisionDetection !== 'optimized') return;
    
    allLogos.forEach(logo => {
        precalculateBoundingBox(logo);
    });
}

// ========================================
// Charger les paramètres sauvegardés
// ========================================
function loadSpinSettings() {
    const savedSpinEnabled = localStorage.getItem('bpix-spinEnabled');
    if (savedSpinEnabled !== null) spinEnabled = savedSpinEnabled === 'true';
    
    const savedSpinSpeedMin = localStorage.getItem('bpix-spinSpeedMin');
    if (savedSpinSpeedMin) spinSpeedMin = parseFloat(savedSpinSpeedMin);
    
    const savedSpinSpeedMax = localStorage.getItem('bpix-spinSpeedMax');
    if (savedSpinSpeedMax) spinSpeedMax = parseFloat(savedSpinSpeedMax);
    
    const savedSpinChangeSpeedOnBounce = localStorage.getItem('bpix-spinChangeSpeedOnBounce');
    if (savedSpinChangeSpeedOnBounce !== null) spinChangeSpeedOnBounce = savedSpinChangeSpeedOnBounce === 'true';
    
    const savedSpinDirection = localStorage.getItem('bpix-spinDirection');
    if (savedSpinDirection) spinDirection = savedSpinDirection;
    
    const savedSpinMultipleLogosBehavior = localStorage.getItem('bpix-spinMultipleLogosBehavior');
    if (savedSpinMultipleLogosBehavior) spinMultipleLogosBehavior = savedSpinMultipleLogosBehavior;
    
    const savedSpinCollisionDetection = localStorage.getItem('bpix-spinCollisionDetection');
    if (savedSpinCollisionDetection) spinCollisionDetection = savedSpinCollisionDetection;
    
    // Initialiser la rotation globale si nécessaire
    if (spinMultipleLogosBehavior === 'same') {
        globalSpinSpeed = spinSpeedMin + Math.random() * (spinSpeedMax - spinSpeedMin);
        globalSpinDirection = getRandomSpinDirection();
        globalRotationAngle = 0;
    }
}
