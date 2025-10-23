/**
 * Popup System - Simple notification library
 * Version: 1.0.0
 * 
 * A lightweight, dependency-free popup notification system with queue management.
 * Supports multiple simultaneous popups with auto-stacking and smooth animations.
 */

(function(window) {
    'use strict';

    // Private variables
    let popupQueue = [];
    let popupIdCounter = 0;
    let container = null;

    // Configuration
    const config = {
        defaultDuration: 4000,
        stackSpacing: 8,
        containerSelector: 'popup-container'
    };

    // Labels for each popup type
    const popupLabels = {
        error: 'Error',
        warning: 'Warning',
        success: 'Success',
        info: 'Info'
    };

    /**
     * Initialize the popup system
     * Creates the container element if it doesn't exist
     */
    function init() {
        if (container) return;

        container = document.getElementById(config.containerSelector);
        
        if (!container) {
            container = document.createElement('div');
            container.id = config.containerSelector;
            container.className = 'popup-container-wrapper';
            document.body.appendChild(container);
        }
    }

    /**
     * Show a popup notification
     * @param {string} message - The message to display
     * @param {string} type - The type of popup ('error', 'warning', 'success', 'info')
     * @param {number} duration - Display duration in milliseconds (0 = no auto-close)
     * @returns {number} The popup ID (can be used to close it manually)
     */
    function showPopup(message, type = 'info', duration = config.defaultDuration) {
        init();

        // Validate type
        if (!['error', 'warning', 'success', 'info'].includes(type)) {
            type = 'info';
        }

        const popupId = popupIdCounter++;

        // Create popup element
        const popup = document.createElement('div');
        popup.className = `popup-item popup-${type}`;
        popup.dataset.popupId = popupId;
        popup.style.cursor = 'pointer';
        
        // Disable click-to-close during animation, enable after animation completes
        let clickEnabled = false;
        setTimeout(() => {
            clickEnabled = true;
        }, 300); // Match animation duration
        
        popup.onclick = (e) => {
            // Only close if click is enabled and not on the close button
            if (clickEnabled && e.target !== closeBtn) {
                hidePopup(popupId);
            }
        };

        // Create header with type label and close button
        const header = document.createElement('div');
        header.className = 'popup-header';

        const typeLabel = document.createElement('span');
        typeLabel.className = 'popup-type';
        typeLabel.textContent = popupLabels[type];

        const closeBtn = document.createElement('button');
        closeBtn.className = 'popup-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent popup click handler from firing
            hidePopup(popupId);
        };

        header.appendChild(typeLabel);
        header.appendChild(closeBtn);

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'popup-message';
        messageEl.textContent = message;

        popup.appendChild(header);
        popup.appendChild(messageEl);

        // Add to queue
        const popupData = {
            id: popupId,
            element: popup,
            timeout: null,
            isClosing: false
        };

        popupQueue.push(popupData);

        // Add to DOM
        container.appendChild(popup);

        // Update positions
        updatePopupPositions();

        // Auto-close if duration > 0
        if (duration > 0) {
            popupData.timeout = setTimeout(() => {
                hidePopup(popupId);
            }, duration);
        }

        return popupId;
    }

    /**
     * Hide a specific popup
     * @param {number} popupId - The ID of the popup to hide
     */
    function hidePopup(popupId) {
        const index = popupQueue.findIndex(p => p.id === popupId);
        if (index === -1) {
            // Popup doesn't exist (already closed or invalid ID)
            return;
        }

        const popupData = popupQueue[index];

        // Prevent multiple close attempts
        if (popupData.isClosing) {
            return;
        }
        popupData.isClosing = true;

        // Cancel timeout
        if (popupData.timeout) {
            clearTimeout(popupData.timeout);
        }

        // Slide out animation
        popupData.element.style.animation = 'popupSlideOut 0.3s ease';

        setTimeout(() => {
            // Remove from DOM
            if (popupData.element.parentNode) {
                popupData.element.parentNode.removeChild(popupData.element);
            }

            // Remove from queue
            const currentIndex = popupQueue.findIndex(p => p.id === popupId);
            if (currentIndex !== -1) {
                popupQueue.splice(currentIndex, 1);
            }

            // Update positions
            updatePopupPositions();
        }, 300);
    }

    /**
     * Update positions of all popups in the queue
     * @private
     */
    function updatePopupPositions() {
        let currentTop = 10;

        popupQueue.forEach((popupData) => {
            popupData.element.style.top = currentTop + 'px';
            currentTop += popupData.element.offsetHeight + config.stackSpacing;
        });
    }

    /**
     * Clear all popups
     */
    function clearAll() {
        popupQueue.forEach(popupData => {
            if (popupData.timeout) {
                clearTimeout(popupData.timeout);
            }
            if (popupData.element.parentNode) {
                popupData.element.parentNode.removeChild(popupData.element);
            }
        });
        popupQueue = [];
    }

    /**
     * Configure the popup system
     * @param {Object} options - Configuration options
     * @param {number} options.defaultDuration - Default duration in ms
     * @param {number} options.stackSpacing - Spacing between stacked popups in px
     */
    function configure(options) {
        if (options.defaultDuration !== undefined) {
            config.defaultDuration = options.defaultDuration;
        }
        if (options.stackSpacing !== undefined) {
            config.stackSpacing = options.stackSpacing;
        }
    }

    // Expose public API
    window.PopupSystem = {
        show: showPopup,
        hide: hidePopup,
        clearAll: clearAll,
        configure: configure,
        version: '1.0.0'
    };

    // Also expose showPopup directly for convenience
    window.showPopup = showPopup;

})(window);
