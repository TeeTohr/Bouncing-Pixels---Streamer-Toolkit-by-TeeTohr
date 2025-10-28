// ========================================
// Logo Collision System
// Gestion des collisions entre logos
// ========================================

// Paramètres de collision
let collisionEnabled = true;
let collisionMode = 'physics'; // 'simple', 'physics'
let antiStuckForce = 2.0;
let minimumSeparationSpeed = 1.0; // Vitesse de repousse minimum (0-3)
let collisionRotationChangeEnabled = false; // Inverser la rotation lors de collision avec rotations opposées

// Cooldown pour éviter les collisions répétées immédiates
const COLLISION_COOLDOWN = 50; // ms (réduit pour meilleure réactivité)

// ========================================
// Obtenir l'OBB (Oriented Bounding Box) d'un logo
// Retourne les 4 coins du rectangle tourné
// ========================================
function getLogoOBB(logo) {
    const centerX = logo.x + logo.width / 2;
    const centerY = logo.y + logo.height / 2;
    
    const angle = (logo.rotation || 0) * Math.PI / 180; // Conversion en radians
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const halfWidth = logo.width / 2;
    const halfHeight = logo.height / 2;
    
    // Calculer les 4 coins du rectangle tourné
    const corners = [
        { x: -halfWidth, y: -halfHeight }, // Top-left
        { x: halfWidth, y: -halfHeight },  // Top-right
        { x: halfWidth, y: halfHeight },   // Bottom-right
        { x: -halfWidth, y: halfHeight }   // Bottom-left
    ];
    
    // Appliquer la rotation et translater au centre
    return corners.map(corner => ({
        x: centerX + corner.x * cos - corner.y * sin,
        y: centerY + corner.x * sin + corner.y * cos
    }));
}

// ========================================
// Projeter un polygone sur un axe
// ========================================
function projectPolygon(corners, axis) {
    let min = corners[0].x * axis.x + corners[0].y * axis.y;
    let max = min;
    
    for (let i = 1; i < corners.length; i++) {
        const projection = corners[i].x * axis.x + corners[i].y * axis.y;
        if (projection < min) min = projection;
        if (projection > max) max = projection;
    }
    
    return { min, max };
}

// ========================================
// Vérifier si deux projections se chevauchent
// ========================================
function projectionsOverlap(proj1, proj2) {
    return !(proj1.max < proj2.min || proj2.max < proj1.min);
}

// ========================================
// Collision OBB avec SAT (Separating Axis Theorem)
// ========================================
function checkOBBOverlap(obbA, obbB) {
    // Obtenir les axes à tester (perpendiculaires aux côtés)
    const axes = [];
    
    // Axes de A
    for (let i = 0; i < obbA.length; i++) {
        const p1 = obbA[i];
        const p2 = obbA[(i + 1) % obbA.length];
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        // Perpendiculaire (normale)
        axes.push({ x: -edge.y, y: edge.x });
    }
    
    // Axes de B
    for (let i = 0; i < obbB.length; i++) {
        const p1 = obbB[i];
        const p2 = obbB[(i + 1) % obbB.length];
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        // Perpendiculaire (normale)
        axes.push({ x: -edge.y, y: edge.x });
    }
    
    // Tester chaque axe
    for (let axis of axes) {
        // Normaliser l'axe
        const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        if (length < 0.0001) continue; // Skip si axe nul
        
        axis.x /= length;
        axis.y /= length;
        
        // Projeter les deux OBB sur cet axe
        const projA = projectPolygon(obbA, axis);
        const projB = projectPolygon(obbB, axis);
        
        // Si pas de chevauchement sur cet axe, pas de collision
        if (!projectionsOverlap(projA, projB)) {
            return false;
        }
    }
    
    // Chevauchement sur tous les axes = collision !
    return true;
}

// ========================================
// Détecter et résoudre toutes les collisions
// ========================================
function checkAndResolveCollisions(logos) {
    if (!collisionEnabled || logos.length < 2) {
        return;
    }
    
    const now = Date.now();
    const collisionPairs = [];
    
    // Détecter toutes les paires en collision
    for (let i = 0; i < logos.length; i++) {
        const logoA = logos[i];
        const obbA = getLogoOBB(logoA);
        
        for (let j = i + 1; j < logos.length; j++) {
            const logoB = logos[j];
            
            // Vérifier le cooldown
            if (logoA.lastCollisionWith?.[logoB.id] && 
                now - logoA.lastCollisionWith[logoB.id] < COLLISION_COOLDOWN) {
                continue;
            }
            
            // Distance check rapide (optimisation avec dimensions réelles)
            const dx = logoA.x - logoB.x;
            const dy = logoA.y - logoB.y;
            
            // Utiliser les dimensions réelles (pas bbox) pour distance check
            const maxDist = Math.max(logoA.width, logoA.height) + Math.max(logoB.width, logoB.height) + 50;
            
            if (dx * dx + dy * dy > maxDist * maxDist) {
                continue; // Trop loin, skip
            }
            
            // OBB check précis (prend en compte la rotation)
            const obbB = getLogoOBB(logoB);
            
            if (checkOBBOverlap(obbA, obbB)) {
                collisionPairs.push([logoA, logoB, obbA, obbB]);
            }
        }
    }
    
    // Résoudre toutes les collisions détectées
    collisionPairs.forEach(([logoA, logoB, obbA, obbB]) => {
        resolveCollision(logoA, logoB, obbA, obbB, now);
    });
}

// ========================================
// Vérifier si deux AABB se chevauchent
// ========================================
// Résoudre une collision entre deux logos
// ========================================
function resolveCollision(logoA, logoB, obbA, obbB, now) {
    // Marquer la collision pour le cooldown
    if (!logoA.lastCollisionWith) logoA.lastCollisionWith = {};
    if (!logoB.lastCollisionWith) logoB.lastCollisionWith = {};
    logoA.lastCollisionWith[logoB.id] = now;
    logoB.lastCollisionWith[logoA.id] = now;
    
    // Calculer le vecteur entre les centres
    const centerAX = logoA.x + logoA.width / 2;
    const centerAY = logoA.y + logoA.height / 2;
    const centerBX = logoB.x + logoB.width / 2;
    const centerBY = logoB.y + logoB.height / 2;
    
    const dx = centerBX - centerAX;
    const dy = centerBY - centerAY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Cas extrême : logos exactement superposés
    if (distance < 0.001) {
        const angle = Math.random() * Math.PI * 2;
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        
        // Appliquer le mode de collision
        if (collisionMode === 'physics') {
            resolvePhysicsCollision(logoA, logoB, nx, ny);
        } else {
            resolveSimpleCollision(logoA, logoB);
        }
        
        // Séparer avec normale aléatoire jusqu'à séparation complète
        separateUntilClear(logoA, logoB, nx, ny);
        return;
    }
    
    // Vecteur normal (direction de A vers B)
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Appliquer le mode de collision choisi
    if (collisionMode === 'physics') {
        resolvePhysicsCollision(logoA, logoB, nx, ny);
    } else {
        resolveSimpleCollision(logoA, logoB);
    }
    
    // Anti-stuck : séparer les logos jusqu'à ce qu'ils ne se chevauchent plus
    separateUntilClear(logoA, logoB, nx, ny);
    
    // Reset des cooldowns de rebond mur pour permettre rebond immédiat
    logoA.lastHorizontalBounce = 0;
    logoA.lastVerticalBounce = 0;
    logoB.lastHorizontalBounce = 0;
    logoB.lastVerticalBounce = 0;
    
    // Garantir une vitesse de séparation minimale pour éviter le glissement/stuttering
    if (minimumSeparationSpeed > 0) {
        applyMinimumSeparationSpeed(logoA, logoB, nx, ny);
    }
    
    // Gérer la rotation pour éviter le glissement
    handleRotationOnCollision(logoA, logoB, nx, ny);
}

// ========================================
// Séparer deux logos jusqu'à ce qu'ils ne se chevauchent plus
// ========================================
function separateUntilClear(logoA, logoB, nx, ny) {
    const maxIterations = 10; // Limiter pour éviter boucle infinie
    const separationStep = 2 * antiStuckForce; // Étape de séparation
    
    for (let i = 0; i < maxIterations; i++) {
        // Séparer un peu
        logoA.x -= nx * separationStep;
        logoA.y -= ny * separationStep;
        logoB.x += nx * separationStep;
        logoB.y += ny * separationStep;
        
        // Vérifier s'ils sont maintenant séparés
        const newObbA = getLogoOBB(logoA);
        const newObbB = getLogoOBB(logoB);
        
        if (!checkOBBOverlap(newObbA, newObbB)) {
            // Séparés avec succès !
            return;
        }
    }
    
    // Si toujours collés après 10 itérations, dernière séparation forte
    logoA.x -= nx * separationStep * 3;
    logoA.y -= ny * separationStep * 3;
    logoB.x += nx * separationStep * 3;
    logoB.y += ny * separationStep * 3;
}

// ========================================
// Appliquer une force de repousse minimum pour éviter le glissement/stuttering
// ========================================
function applyMinimumSeparationSpeed(logoA, logoB, nx, ny) {
    // Calculer la vitesse relative projetée sur la normale
    const relVelX = logoB.dx - logoA.dx;
    const relVelY = logoB.dy - logoA.dy;
    const relVelOnNormal = relVelX * nx + relVelY * ny;
    
    // Si la vitesse de séparation est trop faible, booster
    if (Math.abs(relVelOnNormal) < minimumSeparationSpeed) {
        const boost = (minimumSeparationSpeed - Math.abs(relVelOnNormal)) / 2;
        
        // Appliquer le boost dans la direction de la normale
        // (diviser par 2 car on applique à chaque logo)
        logoA.dx -= nx * boost;
        logoA.dy -= ny * boost;
        logoB.dx += nx * boost;
        logoB.dy += ny * boost;
    }
}

// ========================================
// Gérer la rotation lors de collision pour éviter le glissement
// ========================================
function handleRotationOnCollision(logoA, logoB, nx, ny) {
    // Vérifier si les logos ont une rotation active
    if (!logoA.spinSpeed && !logoB.spinSpeed) {
        return; // Pas de rotation, rien à faire
    }
    
    // Utiliser la variable globale spinDirection de ImageSpin.js
    const currentSpinDirection = typeof spinDirection !== 'undefined' ? spinDirection : 'clockwise';
    
    // Vérifier si les logos tournent dans des directions opposées
    if (logoA.spinSpeed !== 0 && logoB.spinSpeed !== 0) {
        const sameDirection = (logoA.spinDirectionMultiplier > 0) === (logoB.spinDirectionMultiplier > 0);
        
        if (!sameDirection) {
            // FORCER une direction opposée forte
            // Au lieu de juste booster, on force les logos à s'éloigner dans des directions strictement opposées
            const minSeparationSpeed = 2.5; // Vitesse de séparation minimum
            
            // Calculer la vitesse actuelle de séparation
            const relVelX = logoB.dx - logoA.dx;
            const relVelY = logoB.dy - logoA.dy;
            const relVelOnNormal = relVelX * nx + relVelY * ny;
            
            // Si la séparation est trop faible, forcer une vitesse opposée forte
            if (Math.abs(relVelOnNormal) < minSeparationSpeed) {
                // Réinitialiser les vitesses dans des directions strictement opposées
                logoA.dx = -nx * minSeparationSpeed / 2;
                logoA.dy = -ny * minSeparationSpeed / 2;
                logoB.dx = nx * minSeparationSpeed / 2;
                logoB.dy = ny * minSeparationSpeed / 2;
            } else {
                // Si déjà une bonne séparation, juste booster
                const strongBoost = 2.0;
                logoA.dx -= nx * strongBoost;
                logoA.dy -= ny * strongBoost;
                logoB.dx += nx * strongBoost;
                logoB.dy += ny * strongBoost;
            }
            
            // OPTION 2 : Inverser la rotation (si activé et applicable)
            if (collisionRotationChangeEnabled && 
                (currentSpinDirection === 'random-on-bounce' || currentSpinDirection === 'opposite-on-bounce')) {
                logoB.spinDirectionMultiplier = -logoB.spinDirectionMultiplier;
            }
        }
    }
}

// ========================================
// Mode Simple : Swap des vitesses
// ========================================
function resolveSimpleCollision(logoA, logoB) {
    // Échanger les vitesses
    const tempDx = logoA.dx;
    const tempDy = logoA.dy;
    
    logoA.dx = logoB.dx;
    logoA.dy = logoB.dy;
    logoB.dx = tempDx;
    logoB.dy = tempDy;
}

// ========================================
// Mode Physics : Collision élastique
// ========================================
function resolvePhysicsCollision(logoA, logoB, nx, ny) {
    // Vitesses relatives
    const dvx = logoA.dx - logoB.dx;
    const dvy = logoA.dy - logoB.dy;
    
    // Projection de la vitesse relative sur la normale
    const dvn = dvx * nx + dvy * ny;
    
    // Si les logos s'éloignent déjà, ne rien faire
    if (dvn <= 0) {
        return;
    }
    
    // Collision élastique avec masses égales
    // Formule : v1' = v1 - (v1-v2)·n * n
    logoA.dx -= dvn * nx;
    logoA.dy -= dvn * ny;
    logoB.dx += dvn * nx;
    logoB.dy += dvn * ny;
}

// ========================================
// Vérifier si une position overlap avec des logos existants
// ========================================
// Vérifier si une position overlap avec des logos existants
// ========================================
function checkPositionOverlap(x, y, width, height, existingLogos, minDistance = 20) {
    for (let existing of existingLogos) {
        // Utiliser les dimensions réelles (pas bbox) pour le spawn
        const newLeft = x - minDistance;
        const newRight = x + width + minDistance;
        const newTop = y - minDistance;
        const newBottom = y + height + minDistance;
        
        const existingLeft = existing.x - minDistance;
        const existingRight = existing.x + existing.width + minDistance;
        const existingTop = existing.y - minDistance;
        const existingBottom = existing.y + existing.height + minDistance;
        
        // Test de chevauchement AABB simple
        if (!(newRight < existingLeft || newLeft > existingRight || 
              newBottom < existingTop || newTop > existingBottom)) {
            return true; // Overlap détecté
        }
    }
    
    return false; // Pas d'overlap
}

// ========================================
// Trouver une position sans overlap
// ========================================
function findNonOverlappingPosition(width, height, existingLogos, viewportWidth, viewportHeight) {
    const maxAttempts = 50;
    const margin = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.random() * (viewportWidth - width - margin * 2) + margin;
        const y = Math.random() * (viewportHeight - height - margin * 2) + margin;
        
        if (!checkPositionOverlap(x, y, width, height, existingLogos)) {
            return { x, y, success: true };
        }
    }
    
    // Fallback : position aléatoire même avec overlap
    return {
        x: Math.random() * (viewportWidth - width - margin * 2) + margin,
        y: Math.random() * (viewportHeight - height - margin * 2) + margin,
        success: false
    };
}

// ========================================
// Séparer tous les logos qui se chevauchent (appelé lors de l'activation)
// ========================================
function separateOverlappingLogos(logos) {
    const maxIterations = 5; // Faire plusieurs passes si nécessaire
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let hadOverlap = false;
        
        for (let i = 0; i < logos.length; i++) {
            const logoA = logos[i];
            const obbA = getLogoOBB(logoA);
            
            for (let j = i + 1; j < logos.length; j++) {
                const logoB = logos[j];
                const obbB = getLogoOBB(logoB);
                
                if (checkOBBOverlap(obbA, obbB)) {
                    hadOverlap = true;
                    
                    // Calculer le vecteur entre les centres
                    const centerAX = logoA.x + logoA.width / 2;
                    const centerAY = logoA.y + logoA.height / 2;
                    const centerBX = logoB.x + logoB.width / 2;
                    const centerBY = logoB.y + logoB.height / 2;
                    
                    const dx = centerBX - centerAX;
                    const dy = centerBY - centerAY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Vecteur normal (ou random si exactement superposés)
                    let nx, ny;
                    if (distance < 0.001) {
                        const angle = Math.random() * Math.PI * 2;
                        nx = Math.cos(angle);
                        ny = Math.sin(angle);
                    } else {
                        nx = dx / distance;
                        ny = dy / distance;
                    }
                    
                    // Séparer les logos (lors de l'activation, on peut être plus généreux)
                    const separationDistance = 5 * antiStuckForce; // 5px × force pour bien séparer
                    
                    logoA.x -= nx * separationDistance;
                    logoA.y -= ny * separationDistance;
                    logoB.x += nx * separationDistance;
                    logoB.y += ny * separationDistance;
                }
            }
        }
        
        // Si aucun overlap détecté, on peut arrêter
        if (!hadOverlap) {
            break;
        }
    }
}

// ========================================
// Mettre à jour les paramètres de collision
// ========================================
function updateCollisionSettings(settings, logos) {
    const wasEnabled = collisionEnabled;
    
    if (settings.collisionEnabled !== undefined) {
        collisionEnabled = settings.collisionEnabled;
        
        // Si on vient d'activer les collisions, séparer les logos qui se chevauchent
        if (!wasEnabled && collisionEnabled && logos && logos.length > 1) {
            separateOverlappingLogos(logos);
        }
    }
    
    if (settings.collisionMode !== undefined) {
        collisionMode = settings.collisionMode;
    }
    
    if (settings.antiStuckForce !== undefined) {
        antiStuckForce = parseFloat(settings.antiStuckForce);
    }
    
    if (settings.minimumSeparationSpeed !== undefined) {
        minimumSeparationSpeed = parseFloat(settings.minimumSeparationSpeed);
    }
    
    if (settings.collisionRotationChangeEnabled !== undefined) {
        collisionRotationChangeEnabled = settings.collisionRotationChangeEnabled;
    }
}

// ========================================
// Charger les paramètres sauvegardés
// ========================================
function loadCollisionSettings() {
    const savedEnabled = localStorage.getItem('bpix-collisionEnabled');
    if (savedEnabled !== null) collisionEnabled = savedEnabled === 'true';
    
    const savedMode = localStorage.getItem('bpix-collisionMode');
    if (savedMode) collisionMode = savedMode;
    
    const savedAntiStuck = localStorage.getItem('bpix-antiStuckForce');
    if (savedAntiStuck) antiStuckForce = parseFloat(savedAntiStuck);
    
    const savedMinSepSpeed = localStorage.getItem('bpix-minimumSeparationSpeed');
    if (savedMinSepSpeed) minimumSeparationSpeed = parseFloat(savedMinSepSpeed);
    
    const savedRotationChange = localStorage.getItem('bpix-collisionRotationChangeEnabled');
    if (savedRotationChange !== null) collisionRotationChangeEnabled = savedRotationChange === 'true';
}
