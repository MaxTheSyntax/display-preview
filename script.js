// Get elements
const generateBtn = document.getElementById('generateBtn');
const previewSection = document.getElementById('previewSection');
const screenPreview = document.getElementById('screenPreview');
const devicePreview = document.getElementById('devicePreview');
const displayInfo = document.getElementById('displayInfo');
const resolutionInputs = document.getElementById('resolutionInputs');
const ppiInputs = document.getElementById('ppiInputs');

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
        // Find the unchecked one? Better to read data-attribute; fallback: assume previous was inches if not stored.
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

// Generate preview button
generateBtn.addEventListener('click', generatePreview);

function generatePreview() {
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
    // Get user's screen PPI (approximate - assumes 96 DPI as default)
    const userPPI = window.devicePixelRatio * 96;
    
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
    
    // Create gradient based on resolution
    createGradient(screenPreview, resWidth, resHeight);
    
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
        <p><strong>Screen Diagonal:</strong> ${diagonalInches} inches (${fmt(fromInches(diagonalInches, selectedUnit))} ${selectedUnit})</p>
        <p><strong>Screen Dimensions:</strong> ${Math.round(screenWidth*10)/10}" × ${Math.round(screenHeight*10)/10}" (${fmt(displayScreenW)} ${selectedUnit} × ${fmt(displayScreenH)} ${selectedUnit})</p>
        <p><strong>Device Dimensions:</strong> ${Math.round(deviceWidth*10)/10}" × ${Math.round(deviceHeight*10)/10}" (${fmt(displayDeviceW)} ${selectedUnit} × ${fmt(displayDeviceH)} ${selectedUnit})</p>
        <p><strong>Resolution:</strong> ${resWidth} × ${resHeight} pixels</p>
        <p><strong>Pixel Density:</strong> ${Math.round(ppi)} PPI</p>
        <p><strong>Aspect Ratio:</strong> ${aspectRatio}</p>
        <p><strong>Total Pixels:</strong> ${(resWidth * resHeight / 1000000).toFixed(2)} megapixels</p>
    `;
    
    // Show preview section
    previewSection.style.display = 'block';
    
    // Scroll to preview
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createGradient(element, resWidth, resHeight) {
    // Create a canvas to draw the gradient
    const canvas = document.createElement('canvas');
    canvas.width = resWidth;
    canvas.height = resHeight;
    const ctx = canvas.getContext('2d');
    
    // Create a colorful gradient that matches the resolution
    const gradient = ctx.createLinearGradient(0, 0, resWidth, resHeight);
    gradient.addColorStop(0, '#FF0080');
    gradient.addColorStop(0.25, '#FF8C00');
    gradient.addColorStop(0.5, '#40E0D0');
    gradient.addColorStop(0.75, '#9370DB');
    gradient.addColorStop(1, '#00CED1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, resWidth, resHeight);
    
    // Add resolution text overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `${Math.max(resWidth / 20, 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${resWidth} × ${resHeight}`, resWidth / 2, resHeight / 2);
    
    // Convert canvas to image and set as background
    const imageUrl = canvas.toDataURL();
    element.style.backgroundImage = `url(${imageUrl})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
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
