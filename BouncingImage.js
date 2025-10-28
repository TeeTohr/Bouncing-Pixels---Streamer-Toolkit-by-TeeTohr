const container = document.getElementById('bpix-container');

// Supprimer le logo original du HTML s'il existe
const originalLogo = document.getElementById('bpix-logo');
if (originalLogo && originalLogo.parentNode) {
    originalLogo.parentNode.removeChild(originalLogo);
}

// Variables globales
let speed = 2;
let isActive = true;
let colorChangeMode = 'hue';
let colorIntensity = 2.0;
let isVisible = true;
let hasImageError = false;
let scaleWidth = 150;
let imageNaturalRatio = 1;
let logoCount = 1;
let imageRendering = 'smooth';
let cornerTolerance = 0.10; // Tolérance en secondes pour la détection des coins
let minimumSpeedPercent = 0.30; // Vitesse minimale en % de la vitesse de base (0-1)
let maxSpeedPercent = 3.0; // Vitesse maximale en % de la vitesse de base (0-5, défaut 3.0 = 300%)
let currentImageSrc = 'images/default.png'; // Image source actuelle

let lastCommand = null;
const bounceCooldown = 50; // Réduit pour meilleure réactivité après collisions logo-logo

// Tableau des logos
let logos = [];

// ========================================
// Créer un nouveau logo (version encapsulée)
// ========================================
function createLogo(index) {
    const logoWidth = scaleWidth;
    const logoHeight = scaleWidth / imageNaturalRatio;
    
    // Trouver une position sans overlap
    const position = findNonOverlappingPosition(
        logoWidth, 
        logoHeight, 
        logos, 
        window.innerWidth, 
        window.innerHeight
    );
    
    const logo = {
        id: index,
        element: document.createElement('img'),
        x: position.x,
        y: position.y,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        width: logoWidth,
        height: logoHeight,
        lastHorizontalBounce: 0,
        lastVerticalBounce: 0,
        timeLastHitLeft: 0,
        timeLastHitRight: 0,
        timeLastHitTop: 0,
        timeLastHitBottom: 0,
        currentHue: Math.random() * 360,
        currentBrightness: 0.5 + Math.random(),
        currentSolidColorIndex: Math.floor(Math.random() * solidColors.length),
        lastCollisionWith: {} // Pour le cooldown des collisions
    };
    
    // Garantir une vitesse minimale
    if (Math.abs(logo.dx) < 1) logo.dx = logo.dx < 0 ? -2 : 2;
    if (Math.abs(logo.dy) < 1) logo.dy = logo.dy < 0 ? -2 : 2;
    
    // Configurer l'élément image
    logo.element.src = currentImageSrc; // Utiliser l'image actuelle !
    logo.element.alt = 'Bouncing Logo';
    logo.element.id = `bpix-logo-${index}`;
    logo.element.style.position = 'absolute';
    logo.element.style.width = scaleWidth + 'px';
    logo.element.style.height = 'auto';
    logo.element.style.pointerEvents = 'none';
    logo.element.style.left = logo.x + 'px';
    logo.element.style.top = logo.y + 'px';
    logo.element.style.transition = 'none';
    logo.element.style.opacity = (hasImageError || !isVisible) ? '0' : '1';
    logo.element.style.zIndex = '500';
    
    applyImageRenderingToElement(logo.element, imageRendering);
    
    logo.element.addEventListener('error', () => {
        sendLog('❌ Erreur chargement image:', logo.element.src);
        hasImageError = true;
        updateAllOpacity();
        try {
            localStorage.setItem('bpix-image-error', Date.now().toString());
        } catch (e) {}
    });
    
    logo.element.addEventListener('load', () => {
        if (index === 0) {
            sendLog('✅ Image chargée:', logo.element.src);
            imageNaturalRatio = logo.element.naturalWidth / logo.element.naturalHeight;
            hasImageError = false;
            updateAllOpacity();
            logos.forEach(l => {
                l.height = scaleWidth / imageNaturalRatio;
                l.width = scaleWidth;
            });
            applyScaleToAll();
            repositionAllLogos();
            // Recalculer les bounding boxes pour la rotation
            recalculateAllBoundingBoxes(logos);
            try {
                localStorage.removeItem('bpix-image-error');
            } catch (e) {}
        }
    });
    
    container.appendChild(logo.element);
    
    // Initialiser la rotation pour ce logo
    initLogoSpin(logo);
    
    return logo;
}

// Repositionner tous les logos
function repositionAllLogos() {
    logos.forEach(logo => {
        const marginX = 10;
        const marginY = 10;
        const maxX = window.innerWidth - logo.width - marginX;
        const maxY = window.innerHeight - logo.height - marginY;
        
        if (logo.x < marginX) logo.x = marginX;
        if (logo.y < marginY) logo.y = marginY;
        if (logo.x > maxX) logo.x = Math.max(marginX, maxX);
        if (logo.y > maxY) logo.y = Math.max(marginY, maxY);
        
        logo.element.style.left = logo.x + 'px';
        logo.element.style.top = logo.y + 'px';
    });
}

// Activer les transitions
function enableTransitions() {
    logos.forEach(logo => {
        logo.element.style.transition = 'opacity 0.3s ease';
    });
}

// Supprimer un logo
function removeLogo(logo) {
    if (logo.element && logo.element.parentNode) {
        logo.element.parentNode.removeChild(logo.element);
    }
}

// Mettre à jour le nombre de logos
function updateLogoCount(newCount) {
    const oldCount = logos.length;
    
    if (newCount > oldCount) {
        for (let i = oldCount; i < newCount; i++) {
            const logo = createLogo(i);
            logos.push(logo);
            changeLogoColor(logo);
        }
    } else if (newCount < oldCount) {
        for (let i = oldCount - 1; i >= newCount; i--) {
            removeLogo(logos[i]);
            logos.pop();
        }
    }
    
    logoCount = newCount;
    sendLog('Nombre de logos mis à jour:', logoCount);
}

// Mettre à jour l'opacity
function updateAllOpacity() {
    const opacity = (hasImageError || !isVisible) ? '0' : '1';
    logos.forEach(logo => {
        logo.element.style.opacity = opacity;
    });
}

// Appliquer le scale
function applyScaleToAll() {
    logos.forEach(logo => {
        logo.element.style.width = scaleWidth + 'px';
        logo.element.style.height = 'auto';
        logo.width = scaleWidth;
        logo.height = scaleWidth / imageNaturalRatio;
        
        if (logo.x > window.innerWidth - logo.width) logo.x = window.innerWidth - logo.width;
        if (logo.y > window.innerHeight - logo.height) logo.y = window.innerHeight - logo.height;
        if (logo.x < 0) logo.x = 0;
        if (logo.y < 0) logo.y = 0;
    });
    sendLog('Scale appliqué à tous:', { width: scaleWidth, height: scaleWidth / imageNaturalRatio });
}

// Appliquer le rendering à tous les logos
function applyImageRenderingToAll() {
    logos.forEach(logo => {
        applyImageRenderingToElement(logo.element, imageRendering);
    });
    sendLog('Image rendering appliqué:', imageRendering);
}

// Changer la couleur d'un logo
function changeLogoColor(logo) {
    if (colorChangeMode === 'none') return;
    
    const otherLogos = logos.filter(l => l.id !== logo.id);
    
    switch(colorChangeMode) {
        case 'hue':
            const hue = getNewHueForLogo(logo, otherLogos);
            logo.currentHue = hue;
            logo.element.style.filter = `hue-rotate(${hue}deg) saturate(${colorIntensity})`;
            break;
            
        case 'simple':
            const hue2 = getNewHueForLogo(logo, otherLogos);
            logo.currentHue = hue2;
            logo.element.style.filter = `sepia(100%) hue-rotate(${hue2}deg) saturate(${colorIntensity}) brightness(1.2)`;
            break;
            
        case 'grey':
            const brightness = getNewBrightnessForLogo(logo, otherLogos);
            logo.currentBrightness = brightness;
            logo.element.style.filter = `grayscale(100%) brightness(${brightness})`;
            break;
            
        case 'solid-bright':
            const colorIndexBright = getNewSolidColorIndexForLogo(logo, otherLogos, logoCount);
            logo.currentSolidColorIndex = colorIndexBright;
            logo.element.style.filter = solidColors[colorIndexBright].filter;
            break;
            
        case 'solid-dark':
            const colorIndexDark = getNewSolidColorIndexForLogo(logo, otherLogos, logoCount);
            logo.currentSolidColorIndex = colorIndexDark;
            logo.element.style.filter = solidColors[colorIndexDark].filterDark;
            break;
    }
}

// ========================================
// Appliquer la vitesse minimale
// ========================================
function applyMinimumSpeed(logo) {
    if (minimumSpeedPercent <= 0) return; // Désactivé si 0%
    
    const minSpeed = speed * minimumSpeedPercent;
    const currentSpeed = Math.sqrt(logo.dx * logo.dx + logo.dy * logo.dy);
    
    if (currentSpeed < minSpeed && currentSpeed > 0.01) {
        // Accélération progressive (0.5% par frame)
        const accelerationFactor = 1.005;
        logo.dx *= accelerationFactor;
        logo.dy *= accelerationFactor;
    }
}

// ========================================
// Appliquer la vitesse maximale
// ========================================
function applyMaxSpeed(logo) {
    if (maxSpeedPercent <= 0) return; // Désactivé si 0%
    
    const maxSpeed = speed * maxSpeedPercent;
    const currentSpeed = Math.sqrt(logo.dx * logo.dx + logo.dy * logo.dy);
    
    if (currentSpeed > maxSpeed) {
        // Réduire la vitesse pour ne pas dépasser le maximum
        const ratio = maxSpeed / currentSpeed;
        logo.dx *= ratio;
        logo.dy *= ratio;
    }
}

// Réinitialiser les couleurs
function resetAllColors() {
    logos.forEach(logo => {
        logo.element.style.filter = 'none';
    });
}

// Changer l'image
function changeImage(imageName) {
    const newSrc = `images/${imageName}`;
    currentImageSrc = newSrc; // Sauvegarder la source actuelle
    
    logos.forEach(logo => {
        logo.element.src = newSrc;
    });
    sendLog('Image changée:', newSrc);
}

// Animation principale
let lastFrameTime = Date.now();

function animate() {
    if (!isActive) {
        requestAnimationFrame(animate);
        return;
    }

    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / 1000; // En secondes, utilisé uniquement pour la rotation
    lastFrameTime = now;
    
    // Mettre à jour la rotation globale (une seule fois par frame pour le mode "same")
    updateGlobalRotation(deltaTime);
    
    // Vérifier et résoudre les collisions logo-logo AVANT les collisions mur
    checkAndResolveCollisions(logos);
    
    logos.forEach(logo => {
        // Mettre à jour la rotation
        updateLogoSpin(logo, deltaTime);
        
        // Obtenir la bounding box actuelle (ajustée selon la rotation)
        const bbox = getLogoBoundingBox(logo);
        
        // Calculer les offsets pour centrer la bounding box sur la position du logo
        const offsetX = (bbox.width - logo.width) / 2;
        const offsetY = (bbox.height - logo.height) / 2;
        
        // Déplacement (sans deltaTime pour garder le comportement original)
        logo.x += logo.dx * speed;
        logo.y += logo.dy * speed;
        
        // Appliquer la vitesse minimale
        applyMinimumSpeed(logo);
        
        // Appliquer la vitesse maximale
        applyMaxSpeed(logo);

        let bouncedHorizontal = false;
        let bouncedVertical = false;

        // Rebond horizontal (avec bounding box ajustée et vérification de direction)
        if (logo.x - offsetX <= 0 || logo.x + logo.width + offsetX >= window.innerWidth) {
            if (now - logo.lastHorizontalBounce >= bounceCooldown) {
                // Vérifier la direction du mouvement pour éviter les rebonds multiples
                const isMovingLeft = logo.dx < 0;
                const isMovingRight = logo.dx > 0;
                const isTouchingLeft = logo.x - offsetX <= 0;
                const isTouchingRight = logo.x + logo.width + offsetX >= window.innerWidth;
                
                // Rebondir seulement si on se déplace vers le mur qu'on touche
                if ((isTouchingLeft && isMovingLeft) || (isTouchingRight && isMovingRight)) {
                    logo.dx = -logo.dx;
                    logo.x = logo.x - offsetX <= 0 ? offsetX : window.innerWidth - logo.width - offsetX;
                    logo.lastHorizontalBounce = now;
                    bouncedHorizontal = true;
                    
                    // Mémoriser quel bord horizontal a été touché
                    if (logo.x - offsetX <= 0) {
                        logo.timeLastHitLeft = now;
                    } else {
                        logo.timeLastHitRight = now;
                    }
                    
                    changeLogoColor(logo);
                    changeLogoSpinOnBounce(logo, logos);
                }
            }
        }

        // Rebond vertical (avec bounding box ajustée et vérification de direction)
        if (logo.y - offsetY <= 0 || logo.y + logo.height + offsetY >= window.innerHeight) {
            if (now - logo.lastVerticalBounce >= bounceCooldown) {
                // Vérifier la direction du mouvement pour éviter les rebonds multiples
                const isMovingUp = logo.dy < 0;
                const isMovingDown = logo.dy > 0;
                const isTouchingTop = logo.y - offsetY <= 0;
                const isTouchingBottom = logo.y + logo.height + offsetY >= window.innerHeight;
                
                // Rebondir seulement si on se déplace vers le mur qu'on touche
                if ((isTouchingTop && isMovingUp) || (isTouchingBottom && isMovingDown)) {
                    logo.dy = -logo.dy;
                    logo.y = logo.y - offsetY <= 0 ? offsetY : window.innerHeight - logo.height - offsetY;
                    logo.lastVerticalBounce = now;
                    bouncedVertical = true;
                    
                    // Mémoriser quel bord vertical a été touché
                    if (logo.y - offsetY <= 0) {
                        logo.timeLastHitTop = now;
                    } else {
                        logo.timeLastHitBottom = now;
                    }
                    
                    changeLogoColor(logo);
                    changeLogoSpinOnBounce(logo, logos);
                }
            }
        }
        
        // Changer la rotation globale si nécessaire (mode "same rotation")
        if ((bouncedHorizontal || bouncedVertical) && spinMultipleLogosBehavior === 'same') {
            changeGlobalSpinOnBounce(logos);
        }

        // Détection des coins si un rebond vient de se produire
        if (bouncedHorizontal || bouncedVertical) {
            const toleranceMs = cornerTolerance * 1000;
            
            // Trouver les deux bords les plus récents
            const edges = [
                { name: 'left', time: logo.timeLastHitLeft, type: 'horizontal' },
                { name: 'right', time: logo.timeLastHitRight, type: 'horizontal' },
                { name: 'top', time: logo.timeLastHitTop, type: 'vertical' },
                { name: 'bottom', time: logo.timeLastHitBottom, type: 'vertical' }
            ];
            
            // Trier par timestamp décroissant (plus récent en premier)
            edges.sort((a, b) => b.time - a.time);
            
            const mostRecent = edges[0];
            const secondMostRecent = edges[1];
            
            // Vérifier que les deux sont valides (> 0)
            if (mostRecent.time > 0 && secondMostRecent.time > 0) {
                // Vérifier qu'ils sont adjacents (un horizontal + un vertical)
                const areAdjacent = mostRecent.type !== secondMostRecent.type;
                
                // Vérifier la tolérance
                const timeDiff = Math.abs(mostRecent.time - secondMostRecent.time);
                
                if (areAdjacent && timeDiff <= toleranceMs) {
                    // Déterminer le coin à partir des deux bords
                    const horizontal = mostRecent.type === 'horizontal' ? mostRecent.name : secondMostRecent.name;
                    const vertical = mostRecent.type === 'vertical' ? mostRecent.name : secondMostRecent.name;
                    
                    const detectedCorner = `${vertical}-${horizontal}`;
                    
                    sendLog('🎯 COIN DÉTECTÉ!', {
                        logoId: logo.id,
                        corner: detectedCorner,
                        timeDiff: timeDiff,
                        toleranceMs: toleranceMs,
                        mostRecent: mostRecent.name,
                        secondMostRecent: secondMostRecent.name
                    });
                    
                    if (canCreateCornerEffect(logo.id, detectedCorner, now)) {
                        createCornerEffect(detectedCorner, container, imageRendering);
                    }
                }
            }
        }

        logo.element.style.left = logo.x + 'px';
        logo.element.style.top = logo.y + 'px';
    });

    requestAnimationFrame(animate);
}

// Vérifier les commandes
function checkCommands() {
    try {
        const commandStr = localStorage.getItem('bpix-command');
        if (commandStr) {
            const command = JSON.parse(commandStr);
            
            if (lastCommand !== command.timestamp) {
                lastCommand = command.timestamp;
                const { action, value } = command;
                sendLog('Commande reçue:', { action, value });
                processCommand(action, value);
            }
        }
    } catch (e) {
        console.error('Erreur lecture commande:', e);
    }
}

// Traiter les commandes
function processCommand(action, value) {
    switch(action) {
        case 'start':
            isActive = true;
            try {
                localStorage.setItem('bpix-isPlaying', 'true');
            } catch (e) {}
            break;
        case 'stop':
            isActive = false;
            try {
                localStorage.setItem('bpix-isPlaying', 'false');
            } catch (e) {}
            break;
        case 'reset':
            // Repositionner tous les logos sans overlap
            const resetLogos = [];
            logos.forEach((logo, index) => {
                const position = findNonOverlappingPosition(
                    logo.width,
                    logo.height,
                    resetLogos,
                    window.innerWidth,
                    window.innerHeight
                );
                
                logo.x = position.x;
                logo.y = position.y;
                logo.dx = (Math.random() - 0.5) * 4;
                logo.dy = (Math.random() - 0.5) * 4;
                if (Math.abs(logo.dx) < 1) logo.dx = logo.dx < 0 ? -2 : 2;
                if (Math.abs(logo.dy) < 1) logo.dy = logo.dy < 0 ? -2 : 2;
                logo.lastCollisionWith = {}; // Reset collision cooldowns
                changeLogoColor(logo);
                
                resetLogos.push(logo);
            });
            isActive = true;
            try {
                localStorage.setItem('bpix-isPlaying', 'true');
            } catch (e) {}
            break;
        case 'speed':
            speed = parseFloat(value);
            break;
        case 'toggleVisibility':
            isVisible = value;
            updateAllOpacity();
            try {
                localStorage.setItem('bpix-isVisible', value.toString());
            } catch (e) {}
            break;
        case 'colorMode':
            colorChangeMode = value;
            resetAllColors();
            break;
        case 'colorIntensity':
            colorIntensity = parseFloat(value);
            break;
        case 'changeImage':
            changeImage(value);
            break;
        case 'scale':
            scaleWidth = parseInt(value);
            applyScaleToAll();
            logos.forEach(logo => {
                if (logo.x > window.innerWidth - logo.width) logo.x = window.innerWidth - logo.width;
                if (logo.y > window.innerHeight - logo.height) logo.y = window.innerHeight - logo.height;
            });
            // Recalculer les bounding boxes pour la rotation
            recalculateAllBoundingBoxes(logos);
            break;
        case 'logoCount':
            updateLogoCount(parseInt(value));
            break;
        case 'imageRendering':
            imageRendering = value;
            applyImageRenderingToAll();
            break;
        case 'cornerTolerance':
            cornerTolerance = parseFloat(value);
            sendLog('Corner tolerance changé:', value + 's');
            break;
        case 'cornerEffect':
            updateCornerEffectSettings({ cornerEffect: value });
            sendLog('Corner effect changé:', value);
            break;
        case 'cornerDuration':
            updateCornerEffectSettings({ cornerDuration: parseFloat(value) });
            break;
        case 'cornerFadeOut':
            updateCornerEffectSettings({ cornerFadeOut: parseFloat(value) });
            break;
        case 'cornerAnimBehavior':
            updateCornerEffectSettings({ cornerAnimBehavior: value });
            break;
        case 'cornerScale':
            updateCornerEffectSettings({ cornerScale: parseFloat(value) });
            break;
        case 'cornerZIndex':
            updateCornerEffectSettings({ cornerZIndex: value });
            break;
        case 'testCornerEffect':
            if (value) {
                sendLog('🎬 Test effet au coin:', value);
                createCornerEffect(value, container, imageRendering);
            }
            break;
        case 'spinEnabled':
            updateSpinSettings({ spinEnabled: value === 'true' || value === true }, logos);
            break;
        case 'spinSpeedMin':
            updateSpinSettings({ spinSpeedMin: parseFloat(value) }, logos);
            break;
        case 'spinSpeedMax':
            updateSpinSettings({ spinSpeedMax: parseFloat(value) }, logos);
            break;
        case 'spinChangeSpeedOnBounce':
            updateSpinSettings({ spinChangeSpeedOnBounce: value === 'true' || value === true }, logos);
            break;
        case 'spinDirection':
            updateSpinSettings({ spinDirection: value }, logos);
            break;
        case 'spinMultipleLogosBehavior':
            updateSpinSettings({ spinMultipleLogosBehavior: value }, logos);
            break;
        case 'spinCollisionDetection':
            updateSpinSettings({ spinCollisionDetection: value }, logos);
            break;
        case 'collisionEnabled':
            updateCollisionSettings({ collisionEnabled: value === 'true' || value === true }, logos);
            break;
        case 'collisionMode':
            updateCollisionSettings({ collisionMode: value }, logos);
            break;
        case 'antiStuckForce':
            updateCollisionSettings({ antiStuckForce: parseFloat(value) }, logos);
            break;
        case 'minimumSeparationSpeed':
            updateCollisionSettings({ minimumSeparationSpeed: parseFloat(value) }, logos);
            break;
        case 'minimumSpeedPercent':
            minimumSpeedPercent = parseFloat(value);
            break;
        case 'maxSpeedPercent':
            maxSpeedPercent = parseFloat(value);
            break;
    }
}

// Charger les commandes initiales
function loadInitialCommands() {
    const savedIsPlaying = localStorage.getItem('bpix-isPlaying');
    if (savedIsPlaying !== null) {
        isActive = savedIsPlaying === 'true';
        sendLog('État lecture chargé:', isActive);
    }
    
    const savedIsVisible = localStorage.getItem('bpix-isVisible');
    if (savedIsVisible !== null) {
        isVisible = savedIsVisible === 'true';
        sendLog('État visibilité chargé:', isVisible);
    }
    
    const savedImageFile = localStorage.getItem('bpix-imageFile');
    const savedScale = localStorage.getItem('bpix-scale');
    const savedColorMode = localStorage.getItem('bpix-colorChange');
    const savedSpeed = localStorage.getItem('bpix-speed');
    const savedIntensity = localStorage.getItem('bpix-colorIntensity');
    const savedLogoCount = localStorage.getItem('bpix-logoCount');
    const savedImageRendering = localStorage.getItem('bpix-imageRendering');
    const savedCornerTolerance = localStorage.getItem('bpix-cornerTolerance');
    
    if (savedColorMode) {
        colorChangeMode = savedColorMode;
    }
    
    if (savedIntensity) {
        colorIntensity = parseFloat(savedIntensity);
    }
    
    if (savedImageRendering) {
        imageRendering = savedImageRendering;
    }
    
    if (savedCornerTolerance) {
        cornerTolerance = parseFloat(savedCornerTolerance);
    }
    
    // Charger les paramètres des effets de coin
    loadCornerEffectSettings();
    
    // Charger les paramètres de rotation
    loadSpinSettings();
    
    // Charger les paramètres de collision
    loadCollisionSettings();
    
    if (savedLogoCount) {
        processCommand('logoCount', parseInt(savedLogoCount));
    } else {
        updateLogoCount(1);
    }
    
    logos.forEach(logo => {
        changeLogoColor(logo);
    });
    
    if (savedImageFile) {
        processCommand('changeImage', savedImageFile);
    }
    
    if (savedScale) {
        processCommand('scale', parseInt(savedScale));
    }
    
    if (savedSpeed) {
        processCommand('speed', parseFloat(savedSpeed));
    }
    
    setTimeout(enableTransitions, 100);
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    logos.forEach(logo => {
        if (logo.x > window.innerWidth - logo.width) logo.x = window.innerWidth - logo.width;
        if (logo.y > window.innerHeight - logo.height) logo.y = window.innerHeight - logo.height;
    });
});

// Démarrage
setInterval(checkCommands, 100);
loadInitialCommands();
animate();

sendLog('🎬 Bouncing Pixels initialisé');