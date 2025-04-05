document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const imageLoader = document.getElementById('imageLoader');
    const dropZone = document.getElementById('dropZone');
    const originalCanvas = document.getElementById('originalCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const variableNameInput = document.getElementById('variableName');
    const sizeSlider = document.getElementById('sizeSlider');
    const sliderValueDisplay = document.getElementById('sliderValueDisplay');
    const paletteModeSelect = document.getElementById('paletteMode');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const spriteSizeSpan = document.getElementById('spriteSize');
    const jsCodeOutput = document.getElementById('jsCodeOutput');
    const pythonCodeOutput = document.getElementById('pythonCodeOutput');
    const imgLiteralOutput = document.getElementById('imgLiteralOutput');

    let originalImage = null;
    // processedImageData will now store { width, height, palette, pixelIndices }
    let processedImageData = null;

    // --- MakeCode Default Palette --- (Index 0 is transparent)
    const makeCodeDefaultPaletteRGB = [
        null, // Index 0: Transparent - handled separately
        { r: 255, g: 255, b: 255 }, // 1: White #ffffff
        { r: 255, g: 33,  b: 33  }, // 2: Red #ff2121
        { r: 255, g: 147, b: 196 }, // 3: Pink #ff93c4
        { r: 255, g: 129, b: 53  }, // 4: Orange #ff8135
        { r: 255, g: 246, b: 9   }, // 5: Yellow #fff609
        { r: 36,  g: 156, b: 163 }, // 6: Teal #249ca3
        { r: 120, g: 220, b: 82  }, // 7: Green #78dc52
        { r: 0,   g: 63,  b: 173 }, // 8: Blue #003fad
        { r: 135, g: 242, b: 255 }, // 9: Light Blue #87f2ff
        { r: 142, g: 46,  b: 196 }, // A: Purple #8e2ec4
        { r: 164, g: 131, b: 159 }, // B: Light Purple #a4839f
        { r: 92,  g: 64,  b: 108 }, // C: Dark Purple #5c406c
        { r: 229, g: 205, b: 196 }, // D: Tan #e5cdc4
        { r: 145, g: 70,  b: 61  }, // E: Brown #91463d
        { r: 0,   g: 0,   b: 0   }  // F: Black #000000
    ];

    // Helper to convert hex to RGB
    // function hexToRgb(hex) {
    //     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    //     return result ? {
    //         r: parseInt(result[1], 16),
    //         g: parseInt(result[2], 16),
    //         b: parseInt(result[3], 16)
    //     } : null;
    // }

    // --- File Handling --- (Combined Drop Zone and Input)
    function handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            console.error('Invalid file type selected.');
            alert('Please select a valid image file (PNG or JPG).');
            resetUI();
            return;
        }
        console.log('File selected:', file.name);
        loadImageFromFile(file);
    }

    function loadImageFromFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                // Display original image
                originalCanvas.width = originalImage.naturalWidth;
                originalCanvas.height = originalImage.naturalHeight;
                originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
                originalCtx.drawImage(originalImage, 0, 0);

                // Update UI
                resetPreviewAndOutput(); // Clear previous results
                console.log('Image loaded successfully.');

                // --- Heuristic Default Size --- (Keep as is)
                const maxOriginalDim = Math.max(originalImage.naturalWidth, originalImage.naturalHeight);
                let defaultTargetMaxDim = 32;
                if (maxOriginalDim <= 100) defaultTargetMaxDim = 16;
                else if (maxOriginalDim <= 500) defaultTargetMaxDim = 32;
                else defaultTargetMaxDim = 64;
                defaultTargetMaxDim = Math.max(parseInt(sizeSlider.min, 10), Math.min(parseInt(sizeSlider.max, 10), defaultTargetMaxDim));
                sizeSlider.value = defaultTargetMaxDim;
                sliderValueDisplay.textContent = defaultTargetMaxDim;
                console.log(`Set default max dimension to: ${defaultTargetMaxDim}`);

                // Trigger initial processing
                processImage();
            };
            originalImage.onerror = () => {
                console.error('Error loading image data.');
                alert('Error loading the image file. It might be corrupted or an unsupported format.');
                resetUI();
            };
            originalImage.src = e.target.result; // Set src AFTER onload/onerror are defined
        };

        reader.onerror = () => {
            console.error('Error reading file.');
            alert('Error reading the selected file.');
            resetUI();
        };

        reader.readAsDataURL(file);
    }

    // --- Image Loading Event Listeners ---

    // Listener for the hidden file input
    imageLoader.addEventListener('change', (event) => {
        if (event.target.files && event.target.files[0]) {
            handleFileSelect(event.target.files[0]);
        }
    });

    // Listener for clicking the drop zone (triggers hidden input)
    dropZone.addEventListener('click', () => {
        imageLoader.click();
    });

    // Listeners for drag-and-drop
    dropZone.addEventListener('dragover', (event) => {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (event) => {
        event.stopPropagation();
        event.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (event) => {
        event.stopPropagation();
        event.preventDefault();
        dropZone.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]); // Process the first dropped file
        } else {
            console.warn('Drop event occurred without files.');
        }
    });

    // Prevent default drag behavior for the whole window (optional but good)
    window.addEventListener('dragover', (event) => {
        event.preventDefault();
    }, false);
    window.addEventListener('drop', (event) => {
        event.preventDefault();
    }, false);

    // --- UI Interaction ---

    // processButton.addEventListener('click', processImage); // Button is removed

    // --- Add listeners for real-time updates ---
    variableNameInput.addEventListener('input', processImageDebounced);
    sizeSlider.addEventListener('input', () => {
        sliderValueDisplay.textContent = sizeSlider.value;
        if (originalImage) { // Call directly, but ensure image exists
            processImage();
        }
    });
    paletteModeSelect.addEventListener('change', processImageDebounced);

    // Debounce function to prevent excessive processing
    let debounceTimer;
    function processImageDebounced() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (originalImage) { // Only process if an image is loaded
                processImage();
            }
        }, 250); // Adjust delay as needed (e.g., 250ms)
    }

    // --- Core Processing Logic ---
    function processImage() {
        if (!originalImage) {
            alert('Please load an image first.');
            return;
        }
        console.log('Processing image...');

        // 1. Get Configuration
        const varName = variableNameInput.value || 'mySprite';
        const targetMaxDim = parseInt(sizeSlider.value, 10);
        const paletteMode = paletteModeSelect.value;

        // Validate inputs
        if (!varName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            alert('Invalid variable name. Must start with a letter or underscore, and contain only letters, numbers, or underscores.');
            return;
        }
        if (targetMaxDim <= 0) {
            alert('Invalid size provided.');
            return;
        }

        // 2. Resize Image
        console.log(`Resizing - Max Dimension: ${targetMaxDim}`);

        // Calculate scale based on target max dimension and original image dimensions
        const W = originalImage.naturalWidth;
        const H = originalImage.naturalHeight;
        if (W <= 0 || H <= 0) {
            console.error('Original image has zero width or height.');
            return; // Cannot resize
        }

        const maxOriginal = Math.max(W, H);
        let scale = 1.0; // Default scale if already small enough or target is invalid
        if (maxOriginal > 0 && targetMaxDim > 0) {
             scale = targetMaxDim / maxOriginal;
        }

        let actualTargetWidth = Math.round(W * scale);
        let actualTargetHeight = Math.round(H * scale);

        // Ensure dimensions are at least 1x1
        actualTargetWidth = Math.max(1, actualTargetWidth);
        actualTargetHeight = Math.max(1, actualTargetHeight);

        // Optional: Check MakeCode limits (e.g., 255x255)
        if (actualTargetWidth > 255 || actualTargetHeight > 255) {
            console.warn(`Target dimensions (${actualTargetWidth}x${actualTargetHeight}) exceed MakeCode's 255 limit.`);
            // Optionally alert user or cap dimensions
            // actualTargetWidth = Math.min(255, actualTargetWidth);
            // actualTargetHeight = Math.min(255, actualTargetHeight);
            // alert(`Dimensions capped at 255x255.`);
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = actualTargetWidth;
        tempCanvas.height = actualTargetHeight;
        tempCtx.imageSmoothingEnabled = false; // Crucial for pixel art
        tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);
        console.log(`Resized to ${tempCanvas.width}x${tempCanvas.height}`);

        // Get pixel data AFTER drawing
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        // 3. Map to Palette
        console.log(`Palette Mode: ${paletteMode}`);
        try {
            processedImageData = mapToPalette(imageData, paletteMode);
        } catch (error) {
            console.error("Error during palette mapping:", error);
            alert(`Error during palette mapping: ${error.message}`);
            return; // Stop processing
        }

        // 4. Generate MakeCode `img` Literal
        const imgLiteral = generateImageLiteral(processedImageData); // paletteMode no longer needed here

        // 5. Update Preview Canvas
        updatePreview(processedImageData);

        // 6. Update Output Textareas
        updateOutputs(varName, imgLiteral);

        console.log('Processing complete.');
    }

    // --- Helper Functions ---

    // Calculate squared Euclidean distance between two RGB colors
    function colorDistanceSquared(rgb1, rgb2) {
        const dR = rgb1.r - rgb2.r;
        const dG = rgb1.g - rgb2.g;
        const dB = rgb1.b - rgb2.b;
        return dR * dR + dG * dG + dB * dB;
    }

    // Find the index of the closest color in the palette
    function findClosestColorIndex(r, g, b, palette) {
        let minDistance = Infinity;
        let closestIndex = -1;

        // Start from index 1, as 0 is reserved for transparency
        for (let i = 1; i < palette.length; i++) {
            if (!palette[i]) continue; // Should not happen with default palette, but good check
            const distance = colorDistanceSquared({ r, g, b }, palette[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
            if (minDistance === 0) break; // Perfect match found
        }
        return closestIndex;
    }

    function mapToPalette(imageData, paletteMode) {
        console.log('Mapping to palette...');
        const { width, height, data } = imageData;
        const pixelIndices = new Uint8Array(width * height); // Array to hold palette indices (0-15)
        let currentPalette = [];
        let paletteIncludesTransparent = true; // MakeCode default always includes transparent at 0

        if (paletteMode === 'default') {
            currentPalette = makeCodeDefaultPaletteRGB;
        } else if (paletteMode === 'dynamic') {
            // --- TODO: Implement Dynamic Palette Generation ---
            console.warn('Dynamic palette generation not implemented yet. Using default.');
            // For now, fall back to default or throw error
             currentPalette = makeCodeDefaultPaletteRGB;
            // throw new Error("Dynamic palette generation not yet implemented.");
        } else {
            throw new Error(`Unknown palette mode: ${paletteMode}`);
        }

        const transparencyThreshold = 128; // Alpha values below this are treated as transparent

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            const pixelArrayIndex = i / 4;

            if (a < transparencyThreshold) {
                pixelIndices[pixelArrayIndex] = 0; // Transparent index
            } else {
                const closestIndex = findClosestColorIndex(r, g, b, currentPalette);
                if (closestIndex === -1) {
                    // Should only happen if palette is empty or malformed
                    console.error(`Could not find closest color for pixel ${pixelArrayIndex} (RGB: ${r},${g},${b})`);
                    pixelIndices[pixelArrayIndex] = 15; // Default to black (index 15)
                } else {
                    pixelIndices[pixelArrayIndex] = closestIndex;
                }
            }
        }

        console.log('Palette mapping complete.');
        return {
            width: width,
            height: height,
            palette: currentPalette, // The palette definition used (RGB values)
            pixelIndices: pixelIndices // The array of palette indices (0-15)
        };
    }

    function generateImageLiteral(processedData) {
        console.log('Generating image literal...');
        const { width, height, palette, pixelIndices } = processedData;

        if (!palette || !pixelIndices) {
             console.error("Missing palette or pixel data for literal generation.");
             return 'img``'; // Return empty literal on error
        }

        const widthHex = width.toString(16).padStart(2, '0');
        const heightHex = height.toString(16).padStart(2, '0');

        // Palette format: . RRGGBBRRGGBB ... RRGGBB .
        // Skip index 0 (transparent), use '.' for it.
        let paletteHex = "."; // Start with transparent placeholder
        // Ensure we provide exactly 15 colors after the first dot.
        for (let i = 1; i < 16; i++) {
            // Use palette colors if available (index exists and is not null)
            // Otherwise, default to black (or another suitable default like white)
            const color = (i < palette.length && palette[i]) ? palette[i] : { r: 0, g: 0, b: 0 }; // Default black
            const rHex = color.r.toString(16).padStart(2, '0');
            const gHex = color.g.toString(16).padStart(2, '0');
            const bHex = color.b.toString(16).padStart(2, '0');
            // Add space ONLY between colors, not after first dot or before last dot
            paletteHex += (i === 1 ? '' : ' ') + `${rHex}${gHex}${bHex}`;
        }
        paletteHex += " ."; // End with space and transparent placeholder

        // Pixel data: Each hex digit (0-f) corresponds to a palette index
        let pixelDataHex = "";
        for (let i = 0; i < pixelIndices.length; i++) {
            pixelDataHex += pixelIndices[i].toString(16);
        }

        // Ensure pixel data length is even by padding if necessary (MakeCode format requirement)
        // This typically happens for sprites with an odd number of pixels (width*height is odd)
        // Padding with 0 (transparent) is usually safe.
         if (pixelDataHex.length % 2 !== 0) {
             pixelDataHex += '0'; // Pad with transparent index
         }

        // Check total length (optional sanity check)
         // console.log(`Literal parts: W=${widthHex}, H=${heightHex}, Palette=${paletteHex}, Pixels=${pixelDataHex}`);
         // console.log(`Raw palette hex: [${paletteHex}]`)
         // console.log(`Raw pixel data hex: [${pixelDataHex}]`)

        return `img\`${widthHex}${heightHex}${paletteHex}${pixelDataHex}\``;
    }

    function updatePreview(processedData) {
        console.log('Updating preview...');
        const { width, height, palette, pixelIndices } = processedData;

         if (!palette || !pixelIndices) {
             console.error("Missing palette or pixel data for preview.");
             // Clear preview or show error state
             previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
             spriteSizeSpan.textContent = 'Error';
             return;
         }

        spriteSizeSpan.textContent = `${width}x${height}`;

        // Scale up preview for visibility
        const previewDim = Math.max(160, width * 4, height * 4); // Ensure preview is reasonably large
        const scale = Math.max(1, Math.floor(previewDim / Math.max(width, height))); // Auto-scale
        previewCanvas.width = width * scale;
        previewCanvas.height = height * scale;
        previewCtx.imageSmoothingEnabled = false; // Keep it pixelated

        // Clear previous preview
        previewCtx.fillStyle = '#eee'; // Background for transparency
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const paletteIndex = pixelIndices[index];

                if (paletteIndex === 0) {
                    // Transparent - already cleared to #eee bg
                    continue;
                }

                // Ensure palette index is valid
                const color = (paletteIndex > 0 && paletteIndex < palette.length) ? palette[paletteIndex] : null;
                if (color) {
                    previewCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                    previewCtx.fillRect(x * scale, y * scale, scale, scale);
                } else {
                     console.warn(`Invalid or missing palette color for index ${paletteIndex} at (${x},${y})`);
                     // Draw placeholder for missing/invalid color
                     previewCtx.fillStyle = 'magenta'; // Error color
                     previewCtx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
         // console.log('Preview updated.'); // Noisy
    }

    function updateOutputs(varName, imgLiteral) {
        // console.log('Updating code outputs...'); // Noisy
        jsCodeOutput.value = `let ${varName} = ${imgLiteral};`;
        pythonCodeOutput.value = `${varName} = ${imgLiteral}`; // Correct Python assignment
        imgLiteralOutput.value = imgLiteral;
    }

    function resetPreviewAndOutput() {
        if (previewCtx) {
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            previewCanvas.width = 160; // Reset to a default size
            previewCanvas.height = 160;
            previewCtx.fillStyle = '#eee'; // Match background
            previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        }
        spriteSizeSpan.textContent = 'N/A';
        jsCodeOutput.value = '';
        pythonCodeOutput.value = '';
        imgLiteralOutput.value = '';
        processedImageData = null;
    }

    function resetUI() {
        console.log('Resetting UI.');
        // Clear canvases safely
        if (originalCtx) originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);

        imageLoader.value = ''; // Clear the file input
        originalImage = null;
        // processButton.disabled = true; // Button is gone
        variableNameInput.value = 'mySprite';
        // Reset slider to default
        sizeSlider.value = 16;
        sliderValueDisplay.textContent = '16';
        paletteModeSelect.value = 'default';
        resetPreviewAndOutput(); // Clear outputs and preview
    }

    // Initialize UI state
    resetUI();
});

// --- Global Helper Functions (for HTML onclick) ---

function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    const currentTab = document.getElementById(tabName);
    if (currentTab) {
        currentTab.style.display = "block";
    }
    if (evt) {
         evt.currentTarget.className += " active";
    } else {
        // Ensure default tab is marked active if no event (e.g., on initial load if needed)
        const defaultTabLink = document.querySelector('.tabs button'); // Get the first tab button
        if (defaultTabLink && !defaultTabLink.classList.contains('active')) {
             defaultTabLink.className += " active";
        }
    }
}

function copyCode(elementId) {
    const textArea = document.getElementById(elementId);
    if (!textArea || !textArea.value) {
        console.warn(`Textarea with ID ${elementId} not found or is empty.`);
        return; // Don't try to copy if there's nothing there
    }
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    navigator.clipboard.writeText(textArea.value).then(() => {
        console.log('Code copied to clipboard!');
        // Optional: Add visual feedback (e.g., change button text briefly)
    }).catch(err => {
        console.error('Failed to copy code using Clipboard API: ', err);
        // Fallback for older browsers or insecure contexts (like http)
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('Code copied to clipboard (fallback method).');
            } else {
                 console.error('Fallback copy command failed.');
                 alert('Failed to copy code automatically. Please copy manually.');
            }
        } catch (execErr) {
            console.error('Fallback copy failed with error: ', execErr);
            alert('Failed to copy code automatically. Please copy manually.');
        }
    });
}