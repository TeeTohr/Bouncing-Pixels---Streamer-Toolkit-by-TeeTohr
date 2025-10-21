// Fonction pour envoyer des logs au dock
function sendLog(message, data = null) {
    try {
        const logEntry = {
            message: message,
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem('bpix-log', JSON.stringify(logEntry));
        console.log(message, data !== null ? data : '');
    } catch (e) {
        console.error('Erreur envoi log:', e);
    }
}

// Liste de couleurs prédéfinies pour le mode "Solid color"
const solidColors = [
    { name: 'Red', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(-50deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(-50deg)' },
    { name: 'Blue', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(180deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(180deg)' },
    { name: 'Yellow', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(0deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(0deg)' },
    { name: 'Green', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(70deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(70deg)' },
    { name: 'Orange', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(-30deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(-30deg)' },
    { name: 'Purple', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(230deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(230deg)' },
    { name: 'Cyan', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(140deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(140deg)' },
    { name: 'Magenta', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(270deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(270deg)' },
    { name: 'Lime', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(40deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(40deg)' },
    { name: 'Pink', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(290deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(290deg)' },
    { name: 'Teal', filter: 'brightness(0.4) sepia(1) saturate(10000%) hue-rotate(120deg)', filterDark: 'invert(1) brightness(0.4) sepia(1) saturate(10000%) hue-rotate(120deg)' },
    { name: 'Amber', filter: 'brightness(0.5) sepia(1) saturate(10000%) hue-rotate(-10deg)', filterDark: 'invert(1) brightness(0.5) sepia(1) saturate(10000%) hue-rotate(-10deg)' },
    { name: 'White', filter: 'brightness(1000%)', filterDark: 'invert(1)' },
    { name: 'Black', filter: 'brightness(0%)', filterDark: 'brightness(0%)' },
    { name: 'Gray', filter: 'brightness(50%) grayscale(100%)', filterDark: 'invert(1) brightness(50%) grayscale(100%)' }
];

// Appliquer le mode de rendu d'image à un élément
function applyImageRenderingToElement(element, imageRendering) {
    if (imageRendering === 'pixelated') {
        element.style.imageRendering = 'pixelated';
        element.style.msInterpolationMode = 'nearest-neighbor';
    } else {
        element.style.imageRendering = 'auto';
        element.style.msInterpolationMode = 'bicubic';
    }
}

// Générer une teinte différente des autres logos ET de la teinte actuelle
function getNewHueForLogo(currentLogo, otherLogos) {
    let attempts = 0;
    let newHue;
    const maxAttempts = 50;
    const currentHue = currentLogo.currentHue;
    
    do {
        newHue = Math.random() * 360;
        attempts++;
        
        const diffFromCurrent = Math.abs(newHue - currentHue);
        const wrappedDiffFromCurrent = Math.min(diffFromCurrent, 360 - diffFromCurrent);
        
        if (wrappedDiffFromCurrent < 30) {
            continue;
        }
        
        let isUnique = true;
        for (let otherLogo of otherLogos) {
            const diff = Math.abs(newHue - otherLogo.currentHue);
            const wrappedDiff = Math.min(diff, 360 - diff);
            if (wrappedDiff < 30) {
                isUnique = false;
                break;
            }
        }
        
        if (isUnique) break;
    } while (attempts < maxAttempts);
    
    return newHue;
}

// Générer une luminosité différente des autres logos ET de la luminosité actuelle
function getNewBrightnessForLogo(currentLogo, otherLogos) {
    let attempts = 0;
    let newBrightness;
    const maxAttempts = 30;
    const currentBrightness = currentLogo.currentBrightness;
    
    do {
        newBrightness = 0.5 + Math.random();
        attempts++;
        
        if (Math.abs(newBrightness - currentBrightness) < 0.2) {
            continue;
        }
        
        let isUnique = true;
        for (let otherLogo of otherLogos) {
            if (Math.abs(newBrightness - otherLogo.currentBrightness) < 0.2) {
                isUnique = false;
                break;
            }
        }
        
        if (isUnique) break;
    } while (attempts < maxAttempts);
    
    return newBrightness;
}

// Obtenir un index de couleur solide différent des autres logos ET de l'index actuel
function getNewSolidColorIndexForLogo(currentLogo, otherLogos, logoCount) {
    if (solidColors.length <= logoCount) {
        let newIndex;
        let attempts = 0;
        do {
            newIndex = Math.floor(Math.random() * solidColors.length);
            attempts++;
        } while (newIndex === currentLogo.currentSolidColorIndex && attempts < 10);
        return newIndex;
    }
    
    let attempts = 0;
    let newIndex;
    const maxAttempts = 30;
    const currentIndex = currentLogo.currentSolidColorIndex;
    const usedIndices = otherLogos.map(l => l.currentSolidColorIndex);
    
    do {
        newIndex = Math.floor(Math.random() * solidColors.length);
        attempts++;
        
        if (newIndex === currentIndex) {
            continue;
        }
        
        if (!usedIndices.includes(newIndex)) break;
    } while (attempts < maxAttempts);
    
    return newIndex;
}