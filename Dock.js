// Références aux éléments
const togglePlayBtn = document.getElementById('togglePlayBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
const colorModeSelect = document.getElementById('colorModeSelect');
const imageSelect = document.getElementById('imageSelect');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const status = document.getElementById('status');
const scaleInput = document.getElementById('scaleInput');
const scaleDownBtn = document.getElementById('scaleDownBtn');
const scaleUpBtn = document.getElementById('scaleUpBtn');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const logoCountInput = document.getElementById('logoCountInput');
const logoCountDownBtn = document.getElementById('logoCountDownBtn');
const logoCountUpBtn = document.getElementById('logoCountUpBtn');
const imageRenderingSelect = document.getElementById('imageRenderingSelect');
const cornerToleranceSlider = document.getElementById('cornerToleranceSlider');
const cornerToleranceValue = document.getElementById('cornerToleranceValue');

// Éléments Corner Effects
const cornerEffectSelect = document.getElementById('cornerEffectSelect');
const cornerDurationInput = document.getElementById('cornerDurationInput');
const cornerDurationValue = document.getElementById('cornerDurationValue');
const cornerDurationDownBtn = document.getElementById('cornerDurationDownBtn');
const cornerDurationUpBtn = document.getElementById('cornerDurationUpBtn');
const cornerFadeOutInput = document.getElementById('cornerFadeOutInput');
const cornerFadeOutValue = document.getElementById('cornerFadeOutValue');
const cornerFadeOutDownBtn = document.getElementById('cornerFadeOutDownBtn');
const cornerFadeOutUpBtn = document.getElementById('cornerFadeOutUpBtn');
const cornerAnimBehaviorSelect = document.getElementById('cornerAnimBehaviorSelect');
const cornerScaleInput = document.getElementById('cornerScaleInput');
const cornerScaleValue = document.getElementById('cornerScaleValue');
const cornerScaleDownBtn = document.getElementById('cornerScaleDownBtn');
const cornerScaleUpBtn = document.getElementById('cornerScaleUpBtn');
const cornerZIndexSelect = document.getElementById('cornerZIndexSelect');
const testEffectBtn = document.getElementById('testEffectBtn');

let isPlaying = true;
let isVisible = true;
let colorChangeMode = 'hue';
let scaleHoldInterval = null;
let logoCountHoldInterval = null;
let activeTab = 'controls';
let colorIntensity = 2.0;
let logoCount = 1;
let imageRendering = 'smooth';
let cornerDurationHoldInterval = null;
let cornerFadeOutHoldInterval = null;
let cornerScaleHoldInterval = null;

// Gestion des onglets
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

function switchTab(tabName) {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === tabName + '-tab') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    activeTab = tabName;
    savePersistentData('bpix-activeTab', tabName);
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Mettre à jour l'interface selon l'état isPlaying
function updatePlayPauseUI() {
    if (isPlaying) {
        togglePlayBtn.textContent = 'Pause';
        togglePlayBtn.classList.remove('btn-success');
        togglePlayBtn.classList.add('btn-danger');
    } else {
        togglePlayBtn.textContent = 'Start';
        togglePlayBtn.classList.remove('btn-danger');
        togglePlayBtn.classList.add('btn-success');
    }
    updateStatusDisplay();
}

// Mettre à jour l'interface selon l'état isVisible
function updateVisibilityUI() {
    if (isVisible) {
        toggleVisibilityBtn.textContent = 'Hide';
        toggleVisibilityBtn.classList.remove('btn-info');
        toggleVisibilityBtn.classList.add('btn-secondary');
    } else {
        toggleVisibilityBtn.textContent = 'Show';
        toggleVisibilityBtn.classList.remove('btn-secondary');
        toggleVisibilityBtn.classList.add('btn-info');
    }
    updateStatusDisplay();
}

// Mettre à jour l'affichage du status
function updateStatusDisplay() {
    if (!isVisible) {
        status.textContent = 'Hidden';
        status.className = 'status-hidden';
    } else if (isPlaying) {
        status.textContent = 'Active';
        status.className = 'status-active';
    } else {
        status.textContent = 'Paused';
        status.className = 'status-paused';
    }
}

// Charger les données persistantes
function loadPersistentData() {
    // Charger l'état isPlaying
    const savedIsPlaying = localStorage.getItem('bpix-isPlaying');
    if (savedIsPlaying !== null) {
        isPlaying = savedIsPlaying === 'true';
        updatePlayPauseUI();
        console.log('État lecture chargé:', isPlaying);
    }
    
    // Charger l'état isVisible
    const savedIsVisible = localStorage.getItem('bpix-isVisible');
    if (savedIsVisible !== null) {
        isVisible = savedIsVisible === 'true';
        updateVisibilityUI();
        console.log('État visibilité chargé:', isVisible);
    }
    
    const savedSpeed = localStorage.getItem('bpix-speed');
    const savedImageFile = localStorage.getItem('bpix-imageFile');
    const savedColorChange = localStorage.getItem('bpix-colorChange');
    const savedScale = localStorage.getItem('bpix-scale');
    
    if (savedSpeed) {
        const speed = parseFloat(savedSpeed);
        speedSlider.value = speed;
        speedValue.textContent = speed.toFixed(1);
        sendCommand('speed', speed);
        console.log('Vitesse chargée:', speed);
    }
    
    if (savedImageFile) {
        imageSelect.value = savedImageFile;
        sendCommand('changeImage', savedImageFile);
        console.log('Image chargée:', savedImageFile);
    }
    
    if (savedColorChange !== null) {
        colorChangeMode = savedColorChange;
        sendCommand('colorMode', colorChangeMode);
        colorModeSelect.value = colorChangeMode;
        console.log('Mode de couleur chargé:', colorChangeMode);
    }
    
    if (savedScale) {
        const scale = parseInt(savedScale);
        scaleInput.value = scale;
        sendCommand('scale', scale);
        console.log('Scale chargé:', scale);
    }
    
    const savedTab = localStorage.getItem('bpix-activeTab');
    if (savedTab) {
        switchTab(savedTab);
        console.log('Onglet chargé:', savedTab);
    }
    
    const savedIntensity = localStorage.getItem('bpix-colorIntensity');
    if (savedIntensity) {
        const intensity = parseFloat(savedIntensity);
        intensitySlider.value = intensity;
        intensityValue.textContent = intensity.toFixed(1);
        colorIntensity = intensity;
        sendCommand('colorIntensity', intensity);
        console.log('Intensité chargée:', intensity);
    }
    
    const savedLogoCount = localStorage.getItem('bpix-logoCount');
    if (savedLogoCount) {
        const count = parseInt(savedLogoCount);
        logoCountInput.value = count;
        logoCount = count;
        sendCommand('logoCount', count);
        console.log('Nombre de logos chargé:', count);
    }
    
    const savedImageRendering = localStorage.getItem('bpix-imageRendering');
    if (savedImageRendering) {
        imageRendering = savedImageRendering;
        imageRenderingSelect.value = imageRendering;
        sendCommand('imageRendering', imageRendering);
        console.log('Image rendering chargé:', imageRendering);
    }
    
    const savedCornerTolerance = localStorage.getItem('bpix-cornerTolerance');
    if (savedCornerTolerance) {
        const tolerance = parseFloat(savedCornerTolerance);
        cornerToleranceSlider.value = tolerance;
        cornerToleranceValue.textContent = tolerance.toFixed(2);
        sendCommand('cornerTolerance', tolerance);
        console.log('Corner tolerance chargé:', tolerance);
    } else {
        // Valeur par défaut : 0.10s
        cornerToleranceValue.textContent = '0.10';
        sendCommand('cornerTolerance', 0.10);
    }
    
    const savedCornerEffect = localStorage.getItem('bpix-cornerEffect');
    if (savedCornerEffect) {
        cornerEffectSelect.value = savedCornerEffect;
        sendCommand('cornerEffect', savedCornerEffect);
        console.log('Corner effect chargé:', savedCornerEffect);
    } else {
        sendCommand('cornerEffect', 'none');
    }
    
    const savedCornerDuration = localStorage.getItem('bpix-cornerDuration');
    if (savedCornerDuration) {
        const duration = parseFloat(savedCornerDuration);
        cornerDurationInput.value = duration;
        cornerDurationValue.textContent = duration.toFixed(1);
        sendCommand('cornerDuration', duration);
        console.log('Corner duration chargé:', duration);
    } else {
        cornerDurationValue.textContent = '1.0';
        sendCommand('cornerDuration', 1.0);
    }
    
    const savedCornerFadeOut = localStorage.getItem('bpix-cornerFadeOut');
    if (savedCornerFadeOut) {
        const fadeOut = parseFloat(savedCornerFadeOut);
        cornerFadeOutInput.value = fadeOut;
        cornerFadeOutValue.textContent = fadeOut.toFixed(1);
        sendCommand('cornerFadeOut', fadeOut);
        console.log('Corner fade out chargé:', fadeOut);
    } else {
        cornerFadeOutValue.textContent = '0.3';
        sendCommand('cornerFadeOut', 0.3);
    }
    
    const savedCornerAnimBehavior = localStorage.getItem('bpix-cornerAnimBehavior');
    if (savedCornerAnimBehavior) {
        cornerAnimBehaviorSelect.value = savedCornerAnimBehavior;
        sendCommand('cornerAnimBehavior', savedCornerAnimBehavior);
        console.log('Corner anim behavior chargé:', savedCornerAnimBehavior);
    } else {
        sendCommand('cornerAnimBehavior', 'play-once-fade');
    }
    
    const savedCornerScale = localStorage.getItem('bpix-cornerScale');
    if (savedCornerScale) {
        const scale = parseFloat(savedCornerScale);
        cornerScaleInput.value = scale;
        cornerScaleValue.textContent = 'x' + scale.toFixed(1);
        sendCommand('cornerScale', scale);
        console.log('Corner scale chargé:', scale);
    } else {
        cornerScaleValue.textContent = 'x1.0';
        sendCommand('cornerScale', 1.0);
    }
    
    const savedCornerZIndex = localStorage.getItem('bpix-cornerZIndex');
    if (savedCornerZIndex) {
        cornerZIndexSelect.value = savedCornerZIndex;
        sendCommand('cornerZIndex', savedCornerZIndex);
        console.log('Corner z-index chargé:', savedCornerZIndex);
    } else {
        sendCommand('cornerZIndex', 'above');
    }
}

// Sauvegarder les données persistantes
function savePersistentData(key, value) {
    localStorage.setItem(key, value);
    console.log('Sauvegardé:', key, '=', value);
}

// Fonction pour envoyer des commandes via localStorage
function sendCommand(action, value = null) {
    const command = {
        action: action,
        value: value,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('bpix-command', JSON.stringify(command));
        console.log('Commande envoyée:', action, value);
    } catch (e) {
        console.error('Erreur localStorage:', e);
    }
}

// Gestionnaires d'événements
togglePlayBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        sendCommand('start');
        savePersistentData('bpix-isPlaying', 'true');
    } else {
        sendCommand('stop');
        savePersistentData('bpix-isPlaying', 'false');
    }
    
    updatePlayPauseUI();
});

resetBtn.addEventListener('click', () => {
    sendCommand('reset');
    isPlaying = true;
    savePersistentData('bpix-isPlaying', 'true');
    updatePlayPauseUI();
});

toggleVisibilityBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    sendCommand('toggleVisibility', isVisible);
    savePersistentData('bpix-isVisible', isVisible.toString());
    updateVisibilityUI();
});

colorModeSelect.addEventListener('change', (e) => {
    colorChangeMode = e.target.value;
    sendCommand('colorMode', colorChangeMode);
    savePersistentData('bpix-colorChange', colorChangeMode);
});

// Fonction pour tester si une image existe
function testImageExists(imagePath) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imagePath;
    });
}

imageSelect.addEventListener('change', (e) => {
    const imageName = e.target.value;
    const imagePath = `images/${imageName}`;
    
    // Tester si l'image existe
    testImageExists(imagePath).then(exists => {
        if (!exists) {
            showPopup(`Image "${imageName}" not found in /images folder!`, 'error');
        }
    });
    
    sendCommand('changeImage', imageName);
    savePersistentData('bpix-imageFile', imageName);
});

imageRenderingSelect.addEventListener('change', (e) => {
    imageRendering = e.target.value;
    sendCommand('imageRendering', imageRendering);
    savePersistentData('bpix-imageRendering', imageRendering);
});

cornerToleranceSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    cornerToleranceValue.textContent = value.toFixed(2);
    sendCommand('cornerTolerance', value);
    savePersistentData('bpix-cornerTolerance', value.toString());
});

// Gestion des Corner Effects
cornerEffectSelect.addEventListener('change', (e) => {
    const effect = e.target.value;
    
    // Tester si l'effet existe (sauf pour "none")
    if (effect !== 'none') {
        const effectPath = `corner_effects/${effect}`;
        testImageExists(effectPath).then(exists => {
            if (!exists) {
                showPopup(`Corner effect "${effect}" not found in /corner_effects folder!`, 'error');
            }
        });
    }
    
    sendCommand('cornerEffect', effect);
    savePersistentData('bpix-cornerEffect', effect);
});

cornerAnimBehaviorSelect.addEventListener('change', (e) => {
    const behavior = e.target.value;
    sendCommand('cornerAnimBehavior', behavior);
    savePersistentData('bpix-cornerAnimBehavior', behavior);
});

cornerZIndexSelect.addEventListener('change', (e) => {
    const zIndex = e.target.value;
    sendCommand('cornerZIndex', zIndex);
    savePersistentData('bpix-cornerZIndex', zIndex);
});

// Gestion du bouton Test Effect
testEffectBtn.addEventListener('click', () => {
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const randomCorner = corners[Math.floor(Math.random() * corners.length)];
    sendCommand('testCornerEffect', randomCorner);
    console.log('Test effect déclenché:', randomCorner);
});

// Gestion Corner Duration
function updateCornerDuration(newDuration) {
    newDuration = Math.max(0.1, Math.min(10, newDuration));
    newDuration = Math.round(newDuration * 10) / 10;
    cornerDurationInput.value = newDuration;
    cornerDurationValue.textContent = newDuration.toFixed(1);
    sendCommand('cornerDuration', newDuration);
    savePersistentData('bpix-cornerDuration', newDuration.toString());
    
    const currentFadeOut = parseFloat(cornerFadeOutInput.value);
    if (currentFadeOut > newDuration) {
        updateCornerFadeOut(newDuration);
    }
}

cornerDurationInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 0.1;
    updateCornerDuration(value);
});

cornerDurationDownBtn.addEventListener('mousedown', () => {
    updateCornerDuration(parseFloat(cornerDurationInput.value) - 0.1);
    cornerDurationHoldInterval = setTimeout(() => {
        cornerDurationHoldInterval = setInterval(() => {
            updateCornerDuration(parseFloat(cornerDurationInput.value) - 0.1);
        }, 50);
    }, 350);
});

cornerDurationDownBtn.addEventListener('mouseup', () => {
    if (cornerDurationHoldInterval) {
        clearTimeout(cornerDurationHoldInterval);
        clearInterval(cornerDurationHoldInterval);
        cornerDurationHoldInterval = null;
    }
});

cornerDurationDownBtn.addEventListener('mouseleave', () => {
    if (cornerDurationHoldInterval) {
        clearTimeout(cornerDurationHoldInterval);
        clearInterval(cornerDurationHoldInterval);
        cornerDurationHoldInterval = null;
    }
});

cornerDurationUpBtn.addEventListener('mousedown', () => {
    updateCornerDuration(parseFloat(cornerDurationInput.value) + 0.1);
    cornerDurationHoldInterval = setTimeout(() => {
        cornerDurationHoldInterval = setInterval(() => {
            updateCornerDuration(parseFloat(cornerDurationInput.value) + 0.1);
        }, 50);
    }, 350);
});

cornerDurationUpBtn.addEventListener('mouseup', () => {
    if (cornerDurationHoldInterval) {
        clearTimeout(cornerDurationHoldInterval);
        clearInterval(cornerDurationHoldInterval);
        cornerDurationHoldInterval = null;
    }
});

cornerDurationUpBtn.addEventListener('mouseleave', () => {
    if (cornerDurationHoldInterval) {
        clearTimeout(cornerDurationHoldInterval);
        clearInterval(cornerDurationHoldInterval);
        cornerDurationHoldInterval = null;
    }
});

// Gestion Corner Fade Out
function updateCornerFadeOut(newFadeOut) {
    const maxDuration = parseFloat(cornerDurationInput.value);
    const requestedFadeOut = newFadeOut;
    
    newFadeOut = Math.max(0, Math.min(maxDuration, newFadeOut));
    newFadeOut = Math.round(newFadeOut * 10) / 10;
    
    // Afficher un warning si l'utilisateur tente de dépasser la durée
    if (requestedFadeOut > maxDuration && requestedFadeOut > 0) {
        showPopup(`Fade out duration cannot exceed effect duration (${maxDuration.toFixed(1)}s)`, 'warning');
    }
    
    cornerFadeOutInput.value = newFadeOut;
    cornerFadeOutValue.textContent = newFadeOut.toFixed(1);
    sendCommand('cornerFadeOut', newFadeOut);
    savePersistentData('bpix-cornerFadeOut', newFadeOut.toString());
}

cornerFadeOutInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 0;
    updateCornerFadeOut(value);
});

cornerFadeOutDownBtn.addEventListener('mousedown', () => {
    updateCornerFadeOut(parseFloat(cornerFadeOutInput.value) - 0.1);
    cornerFadeOutHoldInterval = setTimeout(() => {
        cornerFadeOutHoldInterval = setInterval(() => {
            updateCornerFadeOut(parseFloat(cornerFadeOutInput.value) - 0.1);
        }, 50);
    }, 350);
});

cornerFadeOutDownBtn.addEventListener('mouseup', () => {
    if (cornerFadeOutHoldInterval) {
        clearTimeout(cornerFadeOutHoldInterval);
        clearInterval(cornerFadeOutHoldInterval);
        cornerFadeOutHoldInterval = null;
    }
});

cornerFadeOutDownBtn.addEventListener('mouseleave', () => {
    if (cornerFadeOutHoldInterval) {
        clearTimeout(cornerFadeOutHoldInterval);
        clearInterval(cornerFadeOutHoldInterval);
        cornerFadeOutHoldInterval = null;
    }
});

cornerFadeOutUpBtn.addEventListener('mousedown', () => {
    updateCornerFadeOut(parseFloat(cornerFadeOutInput.value) + 0.1);
    cornerFadeOutHoldInterval = setTimeout(() => {
        cornerFadeOutHoldInterval = setInterval(() => {
            updateCornerFadeOut(parseFloat(cornerFadeOutInput.value) + 0.1);
        }, 50);
    }, 350);
});

cornerFadeOutUpBtn.addEventListener('mouseup', () => {
    if (cornerFadeOutHoldInterval) {
        clearTimeout(cornerFadeOutHoldInterval);
        clearInterval(cornerFadeOutHoldInterval);
        cornerFadeOutHoldInterval = null;
    }
});

cornerFadeOutUpBtn.addEventListener('mouseleave', () => {
    if (cornerFadeOutHoldInterval) {
        clearTimeout(cornerFadeOutHoldInterval);
        clearInterval(cornerFadeOutHoldInterval);
        cornerFadeOutHoldInterval = null;
    }
});

// Gestion Corner Scale
function updateCornerScale(newScale) {
    newScale = Math.max(0.1, Math.min(10, newScale));
    newScale = Math.round(newScale * 10) / 10;
    cornerScaleInput.value = newScale;
    cornerScaleValue.textContent = 'x' + newScale.toFixed(1);
    sendCommand('cornerScale', newScale);
    savePersistentData('bpix-cornerScale', newScale.toString());
}

cornerScaleInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 1.0;
    updateCornerScale(value);
});

cornerScaleDownBtn.addEventListener('mousedown', () => {
    updateCornerScale(parseFloat(cornerScaleInput.value) - 0.1);
    cornerScaleHoldInterval = setTimeout(() => {
        cornerScaleHoldInterval = setInterval(() => {
            updateCornerScale(parseFloat(cornerScaleInput.value) - 0.1);
        }, 50);
    }, 350);
});

cornerScaleDownBtn.addEventListener('mouseup', () => {
    if (cornerScaleHoldInterval) {
        clearTimeout(cornerScaleHoldInterval);
        clearInterval(cornerScaleHoldInterval);
        cornerScaleHoldInterval = null;
    }
});

cornerScaleDownBtn.addEventListener('mouseleave', () => {
    if (cornerScaleHoldInterval) {
        clearTimeout(cornerScaleHoldInterval);
        clearInterval(cornerScaleHoldInterval);
        cornerScaleHoldInterval = null;
    }
});

cornerScaleUpBtn.addEventListener('mousedown', () => {
    updateCornerScale(parseFloat(cornerScaleInput.value) + 0.1);
    cornerScaleHoldInterval = setTimeout(() => {
        cornerScaleHoldInterval = setInterval(() => {
            updateCornerScale(parseFloat(cornerScaleInput.value) + 0.1);
        }, 50);
    }, 350);
});

cornerScaleUpBtn.addEventListener('mouseup', () => {
    if (cornerScaleHoldInterval) {
        clearTimeout(cornerScaleHoldInterval);
        clearInterval(cornerScaleHoldInterval);
        cornerScaleHoldInterval = null;
    }
});

cornerScaleUpBtn.addEventListener('mouseleave', () => {
    if (cornerScaleHoldInterval) {
        clearTimeout(cornerScaleHoldInterval);
        clearInterval(cornerScaleHoldInterval);
        cornerScaleHoldInterval = null;
    }
});

speedSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    speedValue.textContent = parseFloat(value).toFixed(1);
    sendCommand('speed', value);
    savePersistentData('bpix-speed', value);
});

// Gestion du scale
function updateScale(newScale) {
    newScale = Math.max(0, Math.min(1500, newScale));
    scaleInput.value = newScale;
    sendCommand('scale', newScale);
    savePersistentData('bpix-scale', newScale.toString());
}

scaleInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) || 150;
    updateScale(value);
});

scaleInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value) || 150;
    updateScale(value);
});

scaleDownBtn.addEventListener('mousedown', () => {
    updateScale(parseInt(scaleInput.value) - 10);
    scaleHoldInterval = setTimeout(() => {
        scaleHoldInterval = setInterval(() => {
            updateScale(parseInt(scaleInput.value) - 10);
        }, 50);
    }, 350);
});

scaleDownBtn.addEventListener('mouseup', () => {
    if (scaleHoldInterval) {
        clearTimeout(scaleHoldInterval);
        clearInterval(scaleHoldInterval);
        scaleHoldInterval = null;
    }
});

scaleDownBtn.addEventListener('mouseleave', () => {
    if (scaleHoldInterval) {
        clearTimeout(scaleHoldInterval);
        clearInterval(scaleHoldInterval);
        scaleHoldInterval = null;
    }
});

scaleUpBtn.addEventListener('mousedown', () => {
    updateScale(parseInt(scaleInput.value) + 10);
    scaleHoldInterval = setTimeout(() => {
        scaleHoldInterval = setInterval(() => {
            updateScale(parseInt(scaleInput.value) + 10);
        }, 50);
    }, 350);
});

scaleUpBtn.addEventListener('mouseup', () => {
    if (scaleHoldInterval) {
        clearTimeout(scaleHoldInterval);
        clearInterval(scaleHoldInterval);
        scaleHoldInterval = null;
    }
});

scaleUpBtn.addEventListener('mouseleave', () => {
    if (scaleHoldInterval) {
        clearTimeout(scaleHoldInterval);
        clearInterval(scaleHoldInterval);
        scaleHoldInterval = null;
    }
});

// Gestion de l'intensité
intensitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    intensityValue.textContent = value.toFixed(1);
    colorIntensity = value;
    sendCommand('colorIntensity', value);
    savePersistentData('bpix-colorIntensity', value.toString());
});

// Gestion du nombre de logos
function updateLogoCount(newCount) {
    newCount = Math.max(1, Math.min(100, newCount));
    logoCountInput.value = newCount;
    logoCount = newCount;
    sendCommand('logoCount', newCount);
    savePersistentData('bpix-logoCount', newCount.toString());
}

logoCountInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) || 1;
    updateLogoCount(value);
});

logoCountInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value) || 1;
    updateLogoCount(value);
});

logoCountDownBtn.addEventListener('mousedown', () => {
    updateLogoCount(parseInt(logoCountInput.value) - 1);
    logoCountHoldInterval = setTimeout(() => {
        logoCountHoldInterval = setInterval(() => {
            updateLogoCount(parseInt(logoCountInput.value) - 1);
        }, 100);
    }, 350);
});

logoCountDownBtn.addEventListener('mouseup', () => {
    if (logoCountHoldInterval) {
        clearTimeout(logoCountHoldInterval);
        clearInterval(logoCountHoldInterval);
        logoCountHoldInterval = null;
    }
});

logoCountDownBtn.addEventListener('mouseleave', () => {
    if (logoCountHoldInterval) {
        clearTimeout(logoCountHoldInterval);
        clearInterval(logoCountHoldInterval);
        logoCountHoldInterval = null;
    }
});

logoCountUpBtn.addEventListener('mousedown', () => {
    updateLogoCount(parseInt(logoCountInput.value) + 1);
    logoCountHoldInterval = setTimeout(() => {
        logoCountHoldInterval = setInterval(() => {
            updateLogoCount(parseInt(logoCountInput.value) + 1);
        }, 100);
    }, 350);
});

logoCountUpBtn.addEventListener('mouseup', () => {
    if (logoCountHoldInterval) {
        clearTimeout(logoCountHoldInterval);
        clearInterval(logoCountHoldInterval);
        logoCountHoldInterval = null;
    }
});

logoCountUpBtn.addEventListener('mouseleave', () => {
    if (logoCountHoldInterval) {
        clearTimeout(logoCountHoldInterval);
        clearInterval(logoCountHoldInterval);
        logoCountHoldInterval = null;
    }
});

// Initialisation
console.log('Dock OBS initialisé');

let hasImageError = false;
let lastLogTimestamp = 0;

// Écouter les logs de la browser source
function checkBrowserLogs() {
    try {
        const logStr = localStorage.getItem('bpix-log');
        if (logStr) {
            const log = JSON.parse(logStr);
            
            if (log.timestamp !== lastLogTimestamp) {
                lastLogTimestamp = log.timestamp;
                
                if (log.data !== null) {
                    console.log('[Browser Source]', log.message, log.data);
                } else {
                    console.log('[Browser Source]', log.message);
                }
            }
        }
    } catch (e) {
        // Ignorer les erreurs de parsing
    }
}

// Vérifier les logs toutes les 200ms
setInterval(checkBrowserLogs, 200);

// Vérifier les erreurs d'image
function checkImageError() {
    const imageError = localStorage.getItem('bpix-image-error');
    const statusHeader = document.querySelector('.status-header');
    
    if (imageError) {
        hasImageError = true;
        status.textContent = 'Image Not Found';
        status.className = 'status-error';
        statusHeader.classList.add('status-header-error');
    } else if (hasImageError) {
        hasImageError = false;
        statusHeader.classList.remove('status-header-error');
        updateStatusDisplay();
    }
}

// Vérifier les erreurs toutes les 500ms
setInterval(checkImageError, 500);

// Charger les données sauvegardées au démarrage
loadPersistentData();
// ========================================
// Système générique de navigation sous-menus
// ========================================

const submenuNavigationState = {
    activeSubmenu: null,
    previousTab: null
};

// Initialiser le système de navigation des sous-menus
function initSubmenuNavigation() {
    const mainTabsHeader = document.getElementById('mainTabsHeader');
    
    // Gérer tous les boutons de navigation vers sous-menus
    document.querySelectorAll('[data-submenu-nav]').forEach(navButton => {
        navButton.addEventListener('click', () => {
            const submenuName = navButton.dataset.submenuNav;
            navigateToSubmenu(submenuName);
        });
    });
    
    // Gérer tous les boutons de retour
    document.querySelectorAll('[data-submenu-back]').forEach(backButton => {
        backButton.addEventListener('click', () => {
            navigateBackFromSubmenu();
        });
    });
}

// Naviguer vers un sous-menu
function navigateToSubmenu(submenuName) {
    // Sauvegarder l'onglet actif actuel
    const activeTabBtn = document.querySelector('.tab-btn.active');
    submenuNavigationState.previousTab = activeTabBtn ? activeTabBtn.dataset.tab : 'controls';
    submenuNavigationState.activeSubmenu = submenuName;
    
    // Cacher le header principal et tous les onglets principaux
    const mainTabsHeader = document.getElementById('mainTabsHeader');
    mainTabsHeader.style.display = 'none';
    
    document.querySelectorAll('.tab-content:not([data-submenu-content])').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Afficher le header et le contenu du sous-menu
    const submenuHeader = document.querySelector(`[data-submenu-header="${submenuName}"]`);
    const submenuContent = document.querySelector(`[data-submenu-content="${submenuName}"]`);
    
    if (submenuHeader) submenuHeader.style.display = 'block';
    if (submenuContent) submenuContent.classList.add('active');
}

// Retour du sous-menu vers les onglets principaux
function navigateBackFromSubmenu() {
    if (!submenuNavigationState.activeSubmenu) return;
    
    // Cacher le sous-menu actuel
    const submenuHeader = document.querySelector(`[data-submenu-header="${submenuNavigationState.activeSubmenu}"]`);
    const submenuContent = document.querySelector(`[data-submenu-content="${submenuNavigationState.activeSubmenu}"]`);
    
    if (submenuHeader) submenuHeader.style.display = 'none';
    if (submenuContent) submenuContent.classList.remove('active');
    
    // Réafficher le header principal
    const mainTabsHeader = document.getElementById('mainTabsHeader');
    mainTabsHeader.style.display = 'block';
    
    // Réafficher l'onglet qui était actif avant d'aller dans le sous-menu
    const previousTabId = submenuNavigationState.previousTab + '-tab';
    const previousTab = document.getElementById(previousTabId);
    if (previousTab) {
        previousTab.classList.add('active');
    }
    
    // Reset l'état
    submenuNavigationState.activeSubmenu = null;
    submenuNavigationState.previousTab = null;
}

// Initialiser au chargement de la page
initSubmenuNavigation();

