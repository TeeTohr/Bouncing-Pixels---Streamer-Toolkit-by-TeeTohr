// Variables pour les effets de coin
let cornerEffect = 'none';
let cornerDuration = 1.0;
let cornerFadeOut = 0.3;
let cornerAnimBehavior = 'play-once-fade';
let cornerScale = 1.0;
let cornerZIndex = 'above';

let cornerEffectIdCounter = 0;

// Piles d'effets par coin
let cornerStacks = {
    'top-left': { effects: [], timer: null, fadeTimer: null },
    'top-right': { effects: [], timer: null, fadeTimer: null },
    'bottom-left': { effects: [], timer: null, fadeTimer: null },
    'bottom-right': { effects: [], timer: null, fadeTimer: null }
};

const cornerEffectCooldown = 50; // Cooldown très court juste pour éviter les doublons sur la même frame

// Détecter quel coin a été touché
function detectCorner(logo) {
    const margin = 5;
    const isLeft = logo.x <= margin;
    const isRight = logo.x >= window.innerWidth - logo.width - margin;
    const isTop = logo.y <= margin;
    const isBottom = logo.y >= window.innerHeight - logo.height - margin;
    
    if (isTop && isLeft) return 'top-left';
    if (isTop && isRight) return 'top-right';
    if (isBottom && isLeft) return 'bottom-left';
    if (isBottom && isRight) return 'bottom-right';
    
    return null;
}

// Supprimer toute la pile d'un coin
function clearCornerStack(corner) {
    const stack = cornerStacks[corner];
    
    sendLog('🗑️ Suppression pile complète', { corner: corner, count: stack.effects.length });
    
    stack.effects.forEach(effect => {
        if (effect.element && effect.element.parentNode) {
            effect.element.parentNode.removeChild(effect.element);
        }
    });
    
    stack.effects = [];
    
    if (stack.timer) {
        clearTimeout(stack.timer);
        stack.timer = null;
    }
    
    if (stack.fadeTimer) {
        clearTimeout(stack.fadeTimer);
        stack.fadeTimer = null;
    }
}

// Fade out toute la pile d'un coin
function fadeOutCornerStack(corner) {
    const stack = cornerStacks[corner];
    
    if (stack.effects.length === 0) return;
    
    sendLog('🌅 Fade out pile', { corner: corner, count: stack.effects.length });
    
    const hasFadeOut = cornerAnimBehavior.includes('fade') || 
                       !(cornerEffect.endsWith('.gif') || cornerEffect.endsWith('.webp'));
    
    if (hasFadeOut && cornerFadeOut > 0) {
        // Appliquer le fade à tous les effets de la pile
        stack.effects.forEach(effect => {
            effect.element.style.transition = `opacity ${cornerFadeOut}s linear`;
            effect.element.style.opacity = '0';
        });
        
        // Supprimer la pile après le fade
        stack.fadeTimer = setTimeout(() => {
            clearCornerStack(corner);
        }, cornerFadeOut * 1000);
    } else {
        // Pas de fade, suppression immédiate
        clearCornerStack(corner);
    }
}

// Reset le timer de la pile d'un coin
function resetCornerStackTimer(corner) {
    const stack = cornerStacks[corner];
    
    // Annuler les timers existants
    if (stack.timer) {
        clearTimeout(stack.timer);
    }
    if (stack.fadeTimer) {
        clearTimeout(stack.fadeTimer);
    }
    
    // Reset l'opacity de tous les effets (au cas où un fade était en cours)
    stack.effects.forEach(effect => {
        effect.element.style.transition = 'none';
        effect.element.style.opacity = '1';
    });
    
    // Nouveau timer pour cette pile
    stack.timer = setTimeout(() => {
        fadeOutCornerStack(corner);
    }, cornerDuration * 1000);
}

// Créer un effet de coin
function createCornerEffect(corner, container, imageRendering) {
    if (cornerEffect === 'none') {
        return;
    }
    
    const stack = cornerStacks[corner];
    const stackIndex = stack.effects.length;
    
    sendLog('✨ Ajout effet à la pile', { 
        corner: corner, 
        stackIndex: stackIndex,
        effect: cornerEffect
    });
    
    const effectId = cornerEffectIdCounter++;
    
    const effect = {
        id: effectId,
        corner: corner,
        element: document.createElement('img'),
        stackIndex: stackIndex
    };
    
    const effectSrc = `corner_effects/${cornerEffect}`;
    effect.element.src = effectSrc;
    effect.element.alt = 'Corner Effect';
    effect.element.style.position = 'absolute';
    effect.element.style.pointerEvents = 'none';
    effect.element.style.opacity = '1';
    
    effect.element.style.transform = `scale(${cornerScale})`;
    effect.element.style.transformOrigin = 'top left'; // Sera ajusté dans le load event
    applyImageRenderingToElement(effect.element, imageRendering);
    
    effect.element.addEventListener('error', () => {
        sendLog('❌ ERREUR: Impossible de charger l\'effet de coin', effectSrc);
    });
    
    let baseLeft, baseTop, baseRight, baseBottom;
    
    switch(corner) {
        case 'top-left':
            baseLeft = 10;
            baseTop = 10;
            break;
        case 'top-right':
            baseRight = 10;
            baseTop = 10;
            break;
        case 'bottom-left':
            baseLeft = 10;
            baseBottom = 10;
            break;
        case 'bottom-right':
            baseRight = 10;
            baseBottom = 10;
            break;
    }
    
    effect.element.addEventListener('load', () => {
        const effectHeight = effect.element.naturalHeight * cornerScale;
        const stackOffset = effectHeight * 0.2 * stackIndex;
        
        // Ajuster uniquement le stackOffset et le transform-origin selon le coin
        if (corner === 'top-left') {
            effect.element.style.top = (baseTop + stackOffset) + 'px';
            effect.element.style.left = baseLeft + 'px';
            effect.element.style.transformOrigin = 'top left';
        } else if (corner === 'top-right') {
            effect.element.style.top = (baseTop + stackOffset) + 'px';
            effect.element.style.right = baseRight + 'px';
            effect.element.style.transformOrigin = 'top right';
        } else if (corner === 'bottom-left') {
            effect.element.style.bottom = (baseBottom + stackOffset) + 'px';
            effect.element.style.left = baseLeft + 'px';
            effect.element.style.transformOrigin = 'bottom left';
        } else if (corner === 'bottom-right') {
            effect.element.style.bottom = (baseBottom + stackOffset) + 'px';
            effect.element.style.right = baseRight + 'px';
            effect.element.style.transformOrigin = 'bottom right';
        }
    });
    
    if (baseLeft !== undefined) effect.element.style.left = baseLeft + 'px';
    if (baseRight !== undefined) effect.element.style.right = baseRight + 'px';
    if (baseTop !== undefined) effect.element.style.top = baseTop + 'px';
    if (baseBottom !== undefined) effect.element.style.bottom = baseBottom + 'px';
    
    const baseZIndex = cornerZIndex === 'above' ? 1000 : 0;
    effect.element.style.zIndex = baseZIndex + effectId;
    
    container.appendChild(effect.element);
    stack.effects.push(effect);
    
    // Reset le timer de toute la pile
    resetCornerStackTimer(corner);
    
    sendLog('📍 Pile mise à jour', { 
        corner: corner,
        totalInStack: stack.effects.length 
    });
}

// Vérifier si on peut créer un effet (cooldown minimal)
let lastCornerHit = {};

function canCreateCornerEffect(logoId, corner, now) {
    const key = `${logoId}-${corner}`;
    const lastHit = lastCornerHit[key] || 0;
    
    if (now - lastHit >= cornerEffectCooldown) {
        lastCornerHit[key] = now;
        return true;
    }
    
    return false;
}

// Mettre à jour les paramètres des effets de coin
function updateCornerEffectSettings(settings) {
    if (settings.cornerEffect !== undefined) cornerEffect = settings.cornerEffect;
    if (settings.cornerDuration !== undefined) cornerDuration = settings.cornerDuration;
    if (settings.cornerFadeOut !== undefined) {
        cornerFadeOut = settings.cornerFadeOut;
        if (cornerFadeOut > cornerDuration) {
            cornerFadeOut = cornerDuration;
        }
    }
    if (settings.cornerAnimBehavior !== undefined) cornerAnimBehavior = settings.cornerAnimBehavior;
    if (settings.cornerScale !== undefined) cornerScale = settings.cornerScale;
    if (settings.cornerZIndex !== undefined) cornerZIndex = settings.cornerZIndex;
}

// Charger les paramètres sauvegardés
function loadCornerEffectSettings() {
    const savedCornerEffect = localStorage.getItem('bpix-cornerEffect');
    if (savedCornerEffect) cornerEffect = savedCornerEffect;
    
    const savedCornerDuration = localStorage.getItem('bpix-cornerDuration');
    if (savedCornerDuration) cornerDuration = parseFloat(savedCornerDuration);
    
    const savedCornerFadeOut = localStorage.getItem('bpix-cornerFadeOut');
    if (savedCornerFadeOut) cornerFadeOut = parseFloat(savedCornerFadeOut);
    
    const savedCornerAnimBehavior = localStorage.getItem('bpix-cornerAnimBehavior');
    if (savedCornerAnimBehavior) cornerAnimBehavior = savedCornerAnimBehavior;
    
    const savedCornerScale = localStorage.getItem('bpix-cornerScale');
    if (savedCornerScale) cornerScale = parseFloat(savedCornerScale);
    
    const savedCornerZIndex = localStorage.getItem('bpix-cornerZIndex');
    if (savedCornerZIndex) cornerZIndex = savedCornerZIndex;
}