// ========================================
// Logo Collision System V2 - Physique Réaliste
// Système de collisions avec rotation et moment angulaire
// ========================================

// Paramètres de collision
let collisionEnabled = true;
let collisionMode = 'physics'; // 'simple', 'physics'
let antiStuckForce = 2.0;
let minimumSeparationSpeed = 1.0;
let collisionRotationChangeEnabled = false;

// Nouveaux paramètres physiques
let restitutionCoefficient = 0.95; // Coefficient de restitution (0-1, 1=parfaitement élastique)
let frictionCoefficient = 0.1; // Friction au point de contact (0-1)
let rotationalDamping = 0.98; // Amortissement de la rotation (0-1, 1=pas d'amortissement)
let rotationTransferMultiplier = 1.0; // Multiplicateur du transfert de rotation (0-3)

// Cooldown pour éviter les collisions répétées
const COLLISION_COOLDOWN = 50; // ms

// ========================================
// Obtenir l'OBB (Oriented Bounding Box) d'un logo
// ========================================
function getLogoOBB(logo) {
    const centerX = logo.x + logo.width / 2;
    const centerY = logo.y + logo.height / 2;
    
    const angle = (logo.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const halfWidth = logo.width / 2;
    const halfHeight = logo.height / 2;
    
    const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight }
    ];
    
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
// Vérifier si deux projections se chevauchent et retourner la profondeur
// ========================================
function getOverlapDepth(proj1, proj2) {
    if (proj1.max < proj2.min || proj2.max < proj1.min) {
        return 0; // Pas de chevauchement
    }
    
    // Calculer la profondeur de pénétration
    const overlap1 = proj1.max - proj2.min;
    const overlap2 = proj2.max - proj1.min;
    
    return Math.min(overlap1, overlap2);
}

// ========================================
// Collision OBB avec SAT - retourne la normale de collision et la profondeur
// ========================================
function checkOBBCollision(obbA, obbB) {
    let minOverlap = Infinity;
    let collisionNormal = null;
    
    const axes = [];
    
    // Axes de A
    for (let i = 0; i < obbA.length; i++) {
        const p1 = obbA[i];
        const p2 = obbA[(i + 1) % obbA.length];
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        axes.push({ x: -edge.y, y: edge.x });
    }
    
    // Axes de B
    for (let i = 0; i < obbB.length; i++) {
        const p1 = obbB[i];
        const p2 = obbB[(i + 1) % obbB.length];
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        axes.push({ x: -edge.y, y: edge.x });
    }
    
    // Tester chaque axe
    for (let axis of axes) {
        const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        if (length < 0.0001) continue;
        
        axis.x /= length;
        axis.y /= length;
        
        const projA = projectPolygon(obbA, axis);
        const projB = projectPolygon(obbB, axis);
        
        const overlap = getOverlapDepth(projA, projB);
        
        if (overlap === 0) {
            return null; // Pas de collision
        }
        
        if (overlap < minOverlap) {
            minOverlap = overlap;
            collisionNormal = { x: axis.x, y: axis.y };
        }
    }
    
    // Collision détectée
    return {
        normal: collisionNormal,
        depth: minOverlap
    };
}

// ========================================
// Calculer le point de contact approximatif entre deux OBB
// ========================================
function getContactPoint(obbA, obbB, normal) {
    // Trouver les points les plus proches le long de la normale
    let maxA = -Infinity;
    let maxB = -Infinity;
    let contactA = null;
    let contactB = null;
    
    // Points de A dans la direction de la normale
    for (let point of obbA) {
        const projection = point.x * normal.x + point.y * normal.y;
        if (projection > maxA) {
            maxA = projection;
            contactA = point;
        }
    }
    
    // Points de B dans la direction opposée
    for (let point of obbB) {
        const projection = -(point.x * normal.x + point.y * normal.y);
        if (projection > maxB) {
            maxB = projection;
            contactB = point;
        }
    }
    
    // Point de contact moyen
    if (contactA && contactB) {
        return {
            x: (contactA.x + contactB.x) / 2,
            y: (contactA.y + contactB.y) / 2
        };
    }
    
    return null;
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
            
            // Distance check rapide
            const dx = (logoA.x + logoA.width / 2) - (logoB.x + logoB.width / 2);
            const dy = (logoA.y + logoA.height / 2) - (logoB.y + logoB.height / 2);
            const maxDist = Math.max(logoA.width, logoA.height) + Math.max(logoB.width, logoB.height) + 50;
            
            if (dx * dx + dy * dy > maxDist * maxDist) {
                continue;
            }
            
            // Collision check précis
            const obbB = getLogoOBB(logoB);
            const collision = checkOBBCollision(obbA, obbB);
            
            if (collision) {
                collisionPairs.push({
                    logoA,
                    logoB,
                    obbA,
                    obbB,
                    normal: collision.normal,
                    depth: collision.depth
                });
            }
        }
    }
    
    // Résoudre toutes les collisions détectées
    collisionPairs.forEach(data => {
        if (collisionMode === 'physics') {
            resolvePhysicsCollisionV2(data, now);
        } else {
            resolveSimpleCollision(data.logoA, data.logoB);
        }
    });
}

// ========================================
// Résolution physique réaliste avec rotation
// ========================================
function resolvePhysicsCollisionV2(collisionData, now) {
    const { logoA, logoB, obbA, obbB, normal, depth } = collisionData;
    
    // Marquer la collision pour le cooldown
    if (!logoA.lastCollisionWith) logoA.lastCollisionWith = {};
    if (!logoB.lastCollisionWith) logoB.lastCollisionWith = {};
    logoA.lastCollisionWith[logoB.id] = now;
    logoB.lastCollisionWith[logoA.id] = now;
    
    // Centres de masse
    const centerA = {
        x: logoA.x + logoA.width / 2,
        y: logoA.y + logoA.height / 2
    };
    const centerB = {
        x: logoB.x + logoB.width / 2,
        y: logoB.y + logoB.height / 2
    };
    
    // S'assurer que la normale pointe de A vers B
    const centerDiff = {
        x: centerB.x - centerA.x,
        y: centerB.y - centerA.y
    };
    
    const normalDot = normal.x * centerDiff.x + normal.y * centerDiff.y;
    if (normalDot < 0) {
        normal.x = -normal.x;
        normal.y = -normal.y;
    }
    
    // Point de contact
    const contactPoint = getContactPoint(obbA, obbB, normal);
    
    if (!contactPoint) {
        // Fallback vers le système simple si pas de point de contact
        resolveSimpleCollision(logoA, logoB);
        separateLogos(logoA, logoB, normal, depth);
        return;
    }
    
    // Vecteurs du centre vers le point de contact
    const rA = {
        x: contactPoint.x - centerA.x,
        y: contactPoint.y - centerA.y
    };
    const rB = {
        x: contactPoint.x - centerB.x,
        y: contactPoint.y - centerB.y
    };
    
    // Vitesses angulaires (en radians/frame)
    const angularVelA = ((logoA.spinSpeed || 0) * (logoA.spinDirectionMultiplier || 0)) * Math.PI / 180;
    const angularVelB = ((logoB.spinSpeed || 0) * (logoB.spinDirectionMultiplier || 0)) * Math.PI / 180;
    
    // Vitesses au point de contact (linéaire + rotationnel)
    const velA = {
        x: logoA.dx - rA.y * angularVelA,
        y: logoA.dy + rA.x * angularVelA
    };
    const velB = {
        x: logoB.dx - rB.y * angularVelB,
        y: logoB.dy + rB.x * angularVelB
    };
    
    // Vitesse relative
    const relVel = {
        x: velA.x - velB.x,
        y: velA.y - velB.y
    };
    
    // Vitesse relative le long de la normale
    const velAlongNormal = relVel.x * normal.x + relVel.y * normal.y;
    
    // Si les objets s'éloignent déjà, ne rien faire
    if (velAlongNormal <= 0) {
        separateLogos(logoA, logoB, normal, depth);
        return;
    }
    
    // Masses (on peut utiliser l'aire comme approximation)
    const massA = logoA.width * logoA.height;
    const massB = logoB.width * logoB.height;
    
    // Moments d'inertie (approximation pour un rectangle)
    const inertiaA = massA * (logoA.width * logoA.width + logoA.height * logoA.height) / 12;
    const inertiaB = massB * (logoB.width * logoB.width + logoB.height * logoB.height) / 12;
    
    // Produits vectoriels pour le calcul du dénominateur
    const rACrossN = rA.x * normal.y - rA.y * normal.x;
    const rBCrossN = rB.x * normal.y - rB.y * normal.x;
    
    // Masse effective pour la collision
    const invMassSum = 1/massA + 1/massB + 
                       (rACrossN * rACrossN) / inertiaA + 
                       (rBCrossN * rBCrossN) / inertiaB;
    
    // Impulsion (avec coefficient de restitution)
    const impulseMagnitude = -(1 + restitutionCoefficient) * velAlongNormal / invMassSum;
    
    // Vecteur d'impulsion
    const impulse = {
        x: impulseMagnitude * normal.x,
        y: impulseMagnitude * normal.y
    };
    
    // Appliquer l'impulsion aux vitesses linéaires
    logoA.dx += impulse.x / massA;
    logoA.dy += impulse.y / massA;
    logoB.dx -= impulse.x / massB;
    logoB.dy -= impulse.y / massB;
    
    // Appliquer l'impulsion aux vitesses angulaires
    const torqueA = rA.x * impulse.y - rA.y * impulse.x;
    const torqueB = rB.x * impulse.y - rB.y * impulse.x;
    
    const angularImpulseA = torqueA / inertiaA * rotationTransferMultiplier;
    const angularImpulseB = -torqueB / inertiaB * rotationTransferMultiplier;
    
    // Convertir en degrés/frame et appliquer
    if (logoA.spinSpeed !== undefined) {
        const newAngularVelA = angularVelA + angularImpulseA;
        logoA.spinSpeed = Math.abs(newAngularVelA * 180 / Math.PI);
        if (newAngularVelA !== 0) {
            logoA.spinDirectionMultiplier = newAngularVelA > 0 ? 1 : -1;
        }
    }
    
    if (logoB.spinSpeed !== undefined) {
        const newAngularVelB = angularVelB + angularImpulseB;
        logoB.spinSpeed = Math.abs(newAngularVelB * 180 / Math.PI);
        if (newAngularVelB !== 0) {
            logoB.spinDirectionMultiplier = newAngularVelB > 0 ? 1 : -1;
        }
    }
    
    // Friction tangentielle
    if (frictionCoefficient > 0) {
        applyFriction(logoA, logoB, normal, relVel, rA, rB, massA, massB, inertiaA, inertiaB, impulseMagnitude);
    }
    
    // Séparer les logos
    separateLogos(logoA, logoB, normal, depth);
}

// ========================================
// Appliquer la friction au point de contact
// ========================================
function applyFriction(logoA, logoB, normal, relVel, rA, rB, massA, massB, inertiaA, inertiaB, normalImpulse) {
    // Vecteur tangent (perpendiculaire à la normale)
    const tangent = {
        x: -normal.y,
        y: normal.x
    };
    
    // Vitesse relative tangentielle
    const relVelTangent = relVel.x * tangent.x + relVel.y * tangent.y;
    
    if (Math.abs(relVelTangent) < 0.01) return; // Pas de friction significative
    
    // Produits vectoriels
    const rACrossT = rA.x * tangent.y - rA.y * tangent.x;
    const rBCrossT = rB.x * tangent.y - rB.y * tangent.x;
    
    // Masse effective tangentielle
    const invMassTangent = 1/massA + 1/massB + 
                           (rACrossT * rACrossT) / inertiaA + 
                           (rBCrossT * rBCrossT) / inertiaB;
    
    // Impulsion de friction (limitée par le coefficient de friction)
    let frictionImpulse = -relVelTangent / invMassTangent;
    const maxFriction = Math.abs(normalImpulse * frictionCoefficient);
    
    if (Math.abs(frictionImpulse) > maxFriction) {
        frictionImpulse = maxFriction * Math.sign(frictionImpulse);
    }
    
    // Vecteur d'impulsion de friction
    const frictionVec = {
        x: frictionImpulse * tangent.x,
        y: frictionImpulse * tangent.y
    };
    
    // Appliquer la friction aux vitesses linéaires
    logoA.dx += frictionVec.x / massA;
    logoA.dy += frictionVec.y / massA;
    logoB.dx -= frictionVec.x / massB;
    logoB.dy -= frictionVec.y / massB;
    
    // Appliquer la friction aux vitesses angulaires
    const frictionTorqueA = rA.x * frictionVec.y - rA.y * frictionVec.x;
    const frictionTorqueB = rB.x * frictionVec.y - rB.y * frictionVec.x;
    
    if (logoA.spinSpeed !== undefined) {
        const angularVelA = ((logoA.spinSpeed || 0) * (logoA.spinDirectionMultiplier || 0)) * Math.PI / 180;
        const newAngularVelA = angularVelA + (frictionTorqueA / inertiaA * rotationTransferMultiplier);
        logoA.spinSpeed = Math.abs(newAngularVelA * 180 / Math.PI);
        if (newAngularVelA !== 0) {
            logoA.spinDirectionMultiplier = newAngularVelA > 0 ? 1 : -1;
        }
    }
    
    if (logoB.spinSpeed !== undefined) {
        const angularVelB = ((logoB.spinSpeed || 0) * (logoB.spinDirectionMultiplier || 0)) * Math.PI / 180;
        const newAngularVelB = angularVelB - (frictionTorqueB / inertiaB * rotationTransferMultiplier);
        logoB.spinSpeed = Math.abs(newAngularVelB * 180 / Math.PI);
        if (newAngularVelB !== 0) {
            logoB.spinDirectionMultiplier = newAngularVelB > 0 ? 1 : -1;
        }
    }
}

// ========================================
// Séparer les logos après collision
// ========================================
function separateLogos(logoA, logoB, normal, depth) {
    // Séparer proportionnellement aux masses
    const massA = logoA.width * logoA.height;
    const massB = logoB.width * logoB.height;
    const totalMass = massA + massB;
    
    const separationA = (depth * massB / totalMass) * antiStuckForce;
    const separationB = (depth * massA / totalMass) * antiStuckForce;
    
    logoA.x -= normal.x * separationA;
    logoA.y -= normal.y * separationA;
    logoB.x += normal.x * separationB;
    logoB.y += normal.y * separationB;
    
    // Garantir une vitesse minimale de séparation
    const centerA = {
        x: logoA.x + logoA.width / 2,
        y: logoA.y + logoA.height / 2
    };
    const centerB = {
        x: logoB.x + logoB.width / 2,
        y: logoB.y + logoB.height / 2
    };
    
    const separationVec = {
        x: centerB.x - centerA.x,
        y: centerB.y - centerA.y
    };
    
    const separationDist = Math.sqrt(separationVec.x * separationVec.x + separationVec.y * separationVec.y);
    
    if (separationDist > 0.001) {
        const separationNormal = {
            x: separationVec.x / separationDist,
            y: separationVec.y / separationDist
        };
        
        const relVel = {
            x: logoB.dx - logoA.dx,
            y: logoB.dy - logoA.dy
        };
        
        const separationSpeed = relVel.x * separationNormal.x + relVel.y * separationNormal.y;
        
        if (separationSpeed < minimumSeparationSpeed) {
            const boost = (minimumSeparationSpeed - separationSpeed) / 2;
            logoA.dx -= separationNormal.x * boost;
            logoA.dy -= separationNormal.y * boost;
            logoB.dx += separationNormal.x * boost;
            logoB.dy += separationNormal.y * boost;
        }
    }
}

// ========================================
// Mode Simple : Swap des vitesses
// ========================================
function resolveSimpleCollision(logoA, logoB) {
    const tempDx = logoA.dx;
    const tempDy = logoA.dy;
    
    logoA.dx = logoB.dx;
    logoA.dy = logoB.dy;
    logoB.dx = tempDx;
    logoB.dy = tempDy;
}

// ========================================
// Fonctions utilitaires pour la compatibilité
// ========================================

function checkPositionOverlap(x, y, width, height, existingLogos, minDistance = 20) {
    for (let existing of existingLogos) {
        const newLeft = x - minDistance;
        const newRight = x + width + minDistance;
        const newTop = y - minDistance;
        const newBottom = y + height + minDistance;
        
        const existingLeft = existing.x - minDistance;
        const existingRight = existing.x + existing.width + minDistance;
        const existingTop = existing.y - minDistance;
        const existingBottom = existing.y + existing.height + minDistance;
        
        if (!(newRight < existingLeft || newLeft > existingRight || 
              newBottom < existingTop || newTop > existingBottom)) {
            return true;
        }
    }
    
    return false;
}

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
    
    return {
        x: Math.random() * (viewportWidth - width - margin * 2) + margin,
        y: Math.random() * (viewportHeight - height - margin * 2) + margin,
        success: false
    };
}

function separateOverlappingLogos(logos) {
    const maxIterations = 5;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let hadOverlap = false;
        
        for (let i = 0; i < logos.length; i++) {
            const logoA = logos[i];
            const obbA = getLogoOBB(logoA);
            
            for (let j = i + 1; j < logos.length; j++) {
                const logoB = logos[j];
                const obbB = getLogoOBB(logoB);
                
                const collision = checkOBBCollision(obbA, obbB);
                
                if (collision) {
                    hadOverlap = true;
                    
                    const centerAX = logoA.x + logoA.width / 2;
                    const centerAY = logoA.y + logoA.height / 2;
                    const centerBX = logoB.x + logoB.width / 2;
                    const centerBY = logoB.y + logoB.height / 2;
                    
                    const dx = centerBX - centerAX;
                    const dy = centerBY - centerAY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    let nx, ny;
                    if (distance < 0.001) {
                        const angle = Math.random() * Math.PI * 2;
                        nx = Math.cos(angle);
                        ny = Math.sin(angle);
                    } else {
                        nx = dx / distance;
                        ny = dy / distance;
                    }
                    
                    const separationDistance = 5 * antiStuckForce;
                    
                    logoA.x -= nx * separationDistance;
                    logoA.y -= ny * separationDistance;
                    logoB.x += nx * separationDistance;
                    logoB.y += ny * separationDistance;
                }
            }
        }
        
        if (!hadOverlap) {
            break;
        }
    }
}

// ========================================
// Mettre à jour les paramètres
// ========================================
function updateCollisionSettings(settings, logos) {
    const wasEnabled = collisionEnabled;
    
    if (settings.collisionEnabled !== undefined) {
        collisionEnabled = settings.collisionEnabled;
        
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
    
    if (settings.restitutionCoefficient !== undefined) {
        restitutionCoefficient = parseFloat(settings.restitutionCoefficient);
    }
    
    if (settings.frictionCoefficient !== undefined) {
        frictionCoefficient = parseFloat(settings.frictionCoefficient);
    }
    
    if (settings.rotationalDamping !== undefined) {
        rotationalDamping = parseFloat(settings.rotationalDamping);
    }
    
    if (settings.rotationTransferMultiplier !== undefined) {
        rotationTransferMultiplier = parseFloat(settings.rotationTransferMultiplier);
    }
}

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
    
    const savedRestitution = localStorage.getItem('bpix-restitutionCoefficient');
    if (savedRestitution) restitutionCoefficient = parseFloat(savedRestitution);
    
    const savedFriction = localStorage.getItem('bpix-frictionCoefficient');
    if (savedFriction) frictionCoefficient = parseFloat(savedFriction);
    
    const savedDamping = localStorage.getItem('bpix-rotationalDamping');
    if (savedDamping) rotationalDamping = parseFloat(savedDamping);
    
    const savedRotationTransfer = localStorage.getItem('bpix-rotationTransferMultiplier');
    if (savedRotationTransfer) rotationTransferMultiplier = parseFloat(savedRotationTransfer);
}
