// Get elements
const generateBtn = document.getElementById('generateBtn');
const screenPreview = document.getElementById('screenPreview');
const devicePreview = document.getElementById('devicePreview');
const displayInfo = document.getElementById('displayInfo');
const resolutionInputs = document.getElementById('resolutionInputs');
const ppiInputs = document.getElementById('ppiInputs');
const checkerboardOptions = document.getElementById('checkerboardOptions');
const previewContainer = document.getElementById('previewContainer');
const previewContent = document.getElementById('previewContent');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const infoPanel = document.getElementById('infoPanel');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const previewInfoBanner = document.getElementById('previewInfoBanner');
const monitorDiagonalInput = document.getElementById('monitorDiagonal');

// Pan and Zoom state
let scale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let userScreenPPI = 96;

// Mobile menu toggle
mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !mobileMenuToggle.contains(e.target) &&
        sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
});

// Input mode radio buttons
const inputModeRadios = document.querySelectorAll('input[name="inputMode"]');

// Toggle between resolution and PPI inputs
inputModeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'resolution') {
            resolutionInputs.style.display = 'block';
            ppiInputs.style.display = 'none';
        } else {
            resolutionInputs.style.display = 'none';
            ppiInputs.style.display = 'block';
        }
    });
});

// Measurement unit radios
const measurementRadios = document.querySelectorAll('input[name="measurementUnit"]');

// Pattern type radio buttons
const patternTypeRadios = document.querySelectorAll('input[name="patternType"]');

// Toggle checkerboard options visibility
patternTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'checkerboard') {
            checkerboardOptions.style.display = 'block';
        } else {
            checkerboardOptions.style.display = 'none';
        }
    });
});

// Helper: convert value from unit -> inches
function toInches(value, unit) {
    if (isNaN(value) || value === null) return NaN;
    switch (unit) {
        case 'in': return value;
        case 'cm': return value / 2.54;
        case 'mm': return value / 25.4;
        default: return value;
    }
}

// Helper: convert inches -> unit
function fromInches(valueInInches, unit) {
    if (isNaN(valueInInches) || valueInInches === null) return NaN;
    switch (unit) {
        case 'in': return valueInInches;
        case 'cm': return valueInInches * 2.54;
        case 'mm': return valueInInches * 25.4;
        default: return valueInInches;
    }
}

// Convert all dimension inputs when unit changes
measurementRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        const newUnit = this.value;

        // Read current unit (the other radio that was checked previously)
        const prevUnit = document.querySelector('input[name="measurementUnit"][data-prev="true"]')
            ? document.querySelector('input[name="measurementUnit"][data-prev="true"]').value
            : (newUnit === 'in' ? 'cm' : 'in');

    // We'll store the new selection as prev for next time
    measurementRadios.forEach(r => r.removeAttribute('data-prev'));
    this.setAttribute('data-prev', 'true');

        // Inputs to convert: screenWidth, screenHeight, deviceWidth, deviceHeight
        const fields = ['screenWidth', 'screenHeight', 'deviceWidth', 'deviceHeight'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            const raw = parseFloat(el.value);
            if (isNaN(raw)) return;

            // Convert from prevUnit -> inches -> newUnit
            const valueInInches = toInches(raw, prevUnit);
            const converted = fromInches(valueInInches, newUnit);

            // Round sensibly: if unit is inches keep one decimal, cm/mm -> one or no decimals
            let rounded;
            if (newUnit === 'in') rounded = Math.round(converted * 10) / 10;
            else if (newUnit === 'cm') rounded = Math.round(converted * 10) / 10;
            else rounded = Math.round(converted); // mm

            el.value = rounded;
        });
    });
});

// Mark the initially-checked measurement radio so conversions know the previous unit
measurementRadios.forEach(r => { if (r.checked) r.setAttribute('data-prev', 'true'); });

// Pan and Zoom functionality
previewContainer.addEventListener('mousedown', startDrag);
previewContainer.addEventListener('mousemove', drag);
previewContainer.addEventListener('mouseup', endDrag);
previewContainer.addEventListener('mouseleave', endDrag);
previewContainer.addEventListener('wheel', zoom, { passive: false });

// Touch support for mobile
previewContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
previewContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
previewContainer.addEventListener('touchend', endDrag);

let touchStartDistance = 0;
let touchStartScale = 1;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        // Single touch - pan
        e.preventDefault();
        isDragging = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
        previewContainer.classList.add('dragging');
    } else if (e.touches.length === 2) {
        // Two fingers - zoom
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        touchStartScale = scale;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        updateTransform();
    } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scaleChange = distance / touchStartDistance;
        scale = Math.min(Math.max(0.1, touchStartScale * scaleChange), 5);
        updateTransform();
    }
}

function startDrag(e) {
    if (previewPlaceholder.style.display !== 'none') return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    previewContainer.classList.add('dragging');
}

function drag(e) {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
}

function endDrag() {
    isDragging = false;
    previewContainer.classList.remove('dragging');
}

function zoom(e) {
    if (previewPlaceholder.style.display !== 'none') return;
    e.preventDefault();
    
    const delta = -e.deltaY;
    const scaleChange = delta > 0 ? 1.1 : 0.9;
    
    const newScale = scale * scaleChange;
    scale = Math.min(Math.max(0.1, newScale), 5); // Limit scale between 0.1 and 5
    
    updateTransform();
}

function updateTransform() {
    previewContent.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
}

function resetView() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
}

// Generate preview button
generateBtn.addEventListener('click', generatePreview);

function generatePreview() {
    updatePhysicalScreenInfo();
    // Get input values
    const unit = document.querySelector('input[name="measurementUnit"]:checked').value;

    // Parse raw values according to selected unit and convert to inches for internal calculations
    const rawScreenWidth = parseFloat(document.getElementById('screenWidth').value);
    const rawScreenHeight = parseFloat(document.getElementById('screenHeight').value);
    const rawDeviceWidth = parseFloat(document.getElementById('deviceWidth').value);
    const rawDeviceHeight = parseFloat(document.getElementById('deviceHeight').value);

    const screenWidth = toInches(rawScreenWidth, unit);
    const screenHeight = toInches(rawScreenHeight, unit);
    const deviceWidth = toInches(rawDeviceWidth, unit);
    const deviceHeight = toInches(rawDeviceHeight, unit);
    
    // Validate basic inputs
    if (!screenWidth || !screenHeight || !deviceWidth || !deviceHeight) {
        alert('Please fill in all dimension fields.');
        return;
    }
    
    if (screenWidth > deviceWidth || screenHeight > deviceHeight) {
        alert('Screen dimensions cannot be larger than device dimensions.');
        return;
    }
    
    // Get input mode
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    
    let resWidth, resHeight, ppi;
    
    if (inputMode === 'resolution') {
        resWidth = parseInt(document.getElementById('resWidth').value);
        resHeight = parseInt(document.getElementById('resHeight').value);
        
        if (!resWidth || !resHeight) {
            alert('Please fill in resolution fields.');
            return;
        }
        
        // Calculate PPI from resolution and screen dimensions
        const diagonalInches = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
        const diagonalPixels = Math.sqrt(resWidth * resWidth + resHeight * resHeight);
        ppi = diagonalPixels / diagonalInches;
    } else {
        ppi = parseFloat(document.getElementById('ppi').value);
        
        if (!ppi) {
            alert('Please fill in the PPI field.');
            return;
        }
        
        // Calculate resolution from PPI and screen dimensions
        resWidth = Math.round(screenWidth * ppi);
        resHeight = Math.round(screenHeight * ppi);
    }
    
    // Calculate display on screen
    renderPreview(screenWidth, screenHeight, deviceWidth, deviceHeight, resWidth, resHeight, ppi);
}

function renderPreview(screenWidth, screenHeight, deviceWidth, deviceHeight, resWidth, resHeight, ppi) {
    // Use the best-known CSS pixels-per-inch for the user's screen
    const userPPI = userScreenPPI || 96;
    
    // Convert inches to pixels on user's screen
    const screenWidthPx = screenWidth * userPPI;
    const screenHeightPx = screenHeight * userPPI;
    const deviceWidthPx = deviceWidth * userPPI;
    const deviceHeightPx = deviceHeight * userPPI;
    
    // Set device preview size
    devicePreview.style.width = deviceWidthPx + 'px';
    devicePreview.style.height = deviceHeightPx + 'px';
    
    // Set screen preview size and gradient
    screenPreview.style.width = screenWidthPx + 'px';
    screenPreview.style.height = screenHeightPx + 'px';
    
    // Create pattern based on resolution
    createPattern(screenPreview, resWidth, resHeight);
    
    // Display information
    const diagonalInches = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight).toFixed(2);
    const aspectRatio = calculateAspectRatio(resWidth, resHeight);
    // Get currently selected unit to show converted values
    const selectedUnit = document.querySelector('input[name="measurementUnit"]:checked').value;

    // Convert inches back to selected unit for display
    const displayScreenW = fromInches(screenWidth, selectedUnit);
    const displayScreenH = fromInches(screenHeight, selectedUnit);
    const displayDeviceW = fromInches(deviceWidth, selectedUnit);
    const displayDeviceH = fromInches(deviceHeight, selectedUnit);

    // Format values
    function fmt(val) {
        if (selectedUnit === 'mm') return Math.round(val);
        return Math.round(val * 10) / 10;
    }

    displayInfo.innerHTML = `
        <p><strong>Diagonal:</strong> ${diagonalInches}"</p>
        <p><strong>Screen:</strong> ${fmt(displayScreenW)} × ${fmt(displayScreenH)} ${selectedUnit}</p>
        <p><strong>Resolution:</strong> ${resWidth} × ${resHeight}px</p>
        <p><strong>PPI:</strong> ${Math.round(ppi)}</p>
        <p><strong>Aspect:</strong> ${aspectRatio}</p>
        <p><strong>Pixels:</strong> ${(resWidth * resHeight / 1000000).toFixed(2)}MP</p>
    `;
    
    // Show preview and hide placeholder
    previewPlaceholder.style.display = 'none';
    infoPanel.style.display = 'block';
    
    // Reset view
    resetView();
    
    // Close mobile sidebar if open
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
    }
}

function createPattern(element, resWidth, resHeight) {
    // Get selected pattern type
    const patternType = document.querySelector('input[name="patternType"]:checked').value;
    
    // Create a canvas to draw the pattern
    const canvas = document.createElement('canvas');
    canvas.width = resWidth;
    canvas.height = resHeight;
    const ctx = canvas.getContext('2d');
    
    if (patternType === 'gradient') {
        // Create a colorful gradient that matches the resolution
        const gradient = ctx.createLinearGradient(0, 0, resWidth, resHeight);
        gradient.addColorStop(0, '#FF0080');
        gradient.addColorStop(0.25, '#FF8C00');
        gradient.addColorStop(0.5, '#40E0D0');
        gradient.addColorStop(0.75, '#9370DB');
        gradient.addColorStop(1, '#00CED1');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resWidth, resHeight);
    } else if (patternType === 'checkerboard') {
        // Create a black and white checkerboard pattern
        const squareSizeInput = document.getElementById('squareSize').value;
        let squareSize;
        
        if (squareSizeInput && !isNaN(squareSizeInput) && squareSizeInput > 0) {
            // Use custom square size
            squareSize = parseInt(squareSizeInput);
        } else {
            // Auto-calculate based on resolution (default to 20 squares across smaller dimension)
            squareSize = Math.max(1, Math.floor(Math.min(resWidth, resHeight) / 20));
        }
        
        for (let y = 0; y < resHeight; y += squareSize) {
            for (let x = 0; x < resWidth; x += squareSize) {
                const isBlack = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
                ctx.fillStyle = isBlack ? '#000000' : '#FFFFFF';
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }
    
    // Add resolution text overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `${Math.max(resWidth / 20, 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${resWidth} × ${resHeight}`, resWidth / 2, resHeight / 2);
    
    // Convert canvas to image and set as background
    const imageUrl = canvas.toDataURL();
    element.style.backgroundImage = `url(${imageUrl})`;
    element.style.backgroundSize = '100% 100%';
    element.style.backgroundPosition = 'center';
    element.style.imageRendering = 'pixelated';
}

function updatePhysicalScreenInfo() {
    if (!previewInfoBanner || typeof window === 'undefined') {
        return;
    }

    const cssWidth = window.screen && window.screen.width ? window.screen.width : window.innerWidth;
    const cssHeight = window.screen && window.screen.height ? window.screen.height : window.innerHeight;

    if (!cssWidth || !cssHeight) {
        previewInfoBanner.style.opacity = '0';
        return;
    }

    const cssDiagonal = Math.sqrt(cssWidth * cssWidth + cssHeight * cssHeight);
    if (!cssDiagonal) {
        previewInfoBanner.style.opacity = '0';
        return;
    }

    const manualDiagonalRaw = monitorDiagonalInput ? parseFloat(monitorDiagonalInput.value) : NaN;
    const manualDiagonal = !isNaN(manualDiagonalRaw) && manualDiagonalRaw > 0 ? manualDiagonalRaw : null;

    let diagonalInches;
    let widthInches;
    let heightInches;

    if (manualDiagonal) {
        userScreenPPI = cssDiagonal / manualDiagonal;
        diagonalInches = manualDiagonal;
        widthInches = cssWidth / userScreenPPI;
        heightInches = cssHeight / userScreenPPI;
    } else {
        userScreenPPI = 96;
        diagonalInches = cssDiagonal / userScreenPPI;
        widthInches = cssWidth / userScreenPPI;
        heightInches = cssHeight / userScreenPPI;
    }

    if (!isFinite(diagonalInches) || !isFinite(widthInches) || !isFinite(heightInches)) {
        previewInfoBanner.style.opacity = '0';
        return;
    }

    const fmt = (value) => Math.round(value * 10) / 10;
    previewInfoBanner.textContent = manualDiagonal
        ? `≈ ${fmt(diagonalInches)}″ display (${fmt(widthInches)} × ${fmt(heightInches)} in, manual)`
        : `≈ ${fmt(diagonalInches)}″ display (${fmt(widthInches)} × ${fmt(heightInches)} in)`;
    previewInfoBanner.style.opacity = '1';
}

updatePhysicalScreenInfo();
window.addEventListener('resize', updatePhysicalScreenInfo);
window.addEventListener('orientationchange', updatePhysicalScreenInfo);
if (monitorDiagonalInput) {
    monitorDiagonalInput.addEventListener('input', updatePhysicalScreenInfo);
}

function calculateAspectRatio(width, height) {
    // Calculate GCD to simplify the aspect ratio
    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }
    
    const divisor = gcd(width, height);
    const ratioWidth = width / divisor;
    const ratioHeight = height / divisor;
    
    // Check for common aspect ratios
    const ratio = width / height;
    if (Math.abs(ratio - 16/9) < 0.01) return '16:9';
    if (Math.abs(ratio - 16/10) < 0.01) return '16:10';
    if (Math.abs(ratio - 4/3) < 0.01) return '4:3';
    if (Math.abs(ratio - 21/9) < 0.01) return '21:9';
    if (Math.abs(ratio - 3/2) < 0.01) return '3:2';
    
    return `${ratioWidth}:${ratioHeight}`;
}
