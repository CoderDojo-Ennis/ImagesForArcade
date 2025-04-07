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
    // const imgLiteralOutput = document.getElementById('imgLiteralOutput'); // Remove reference

    let originalImage = null;
    // processedImageData will now store { width, height, palette, pixelIndices }
    let processedImageData = null;

    // --- Predefined Palettes (RGB) ---
    // Index 0 (transparent) handled separately
    const predefinedPalettes = {
        arcade: [
            null, // 0: Transparent
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
        ],
        matte: [
            null, {r: 255, g: 255, b: 255}, {r: 255, g: 69, b: 90}, {r: 255, g: 174, b: 188}, {r: 255, g: 171, b: 60}, {r: 255, g: 250, b: 64}, {r: 39, g: 140, b: 63}, {r: 55, g: 230, b: 80}, {r: 94, g: 112, b: 212}, {r: 153, g: 213, b: 229}, {r: 168, g: 69, b: 255}, {r: 207, g: 164, b: 255}, {r: 122, g: 74, b: 139}, {r: 255, g: 204, b: 164}, {r: 189, g: 127, b: 71}, {r: 65, g: 52, b: 78}
        ],
        pastel: [
            null, {r: 255, g: 255, b: 255}, {r: 255, g: 176, b: 161}, {r: 255, g: 214, b: 236}, {r: 255, g: 220, b: 161}, {r: 255, g: 253, b: 161}, {r: 161, g: 255, b: 225}, {r: 186, g: 255, b: 193}, {r: 161, g: 214, b: 255}, {r: 225, g: 255, b: 255}, {r: 214, g: 161, b: 255}, {r: 234, g: 193, b: 255}, {r: 189, g: 176, b: 214}, {r: 255, g: 240, b: 225}, {r: 214, g: 176, b: 161}, {r: 105, g: 106, b: 106}
        ],
        sweet: [
            null, {r: 255, g: 255, b: 255}, {r: 128, g: 61, b: 65}, {r: 154, g: 212, b: 106}, {r: 235, g: 139, b: 74}, {r: 246, g: 216, b: 110}, {r: 24, g: 84, b: 74}, {r: 49, g: 164, b: 119}, {r: 54, g: 95, b: 145}, {r: 107, g: 208, b: 255}, {r: 101, g: 55, b: 128}, {r: 159, g: 123, b: 173}, {r: 214, g: 184, b: 192}, {r: 231, g: 215, b: 193}, {r: 172, g: 137, b: 110}, {r: 79, g: 69, b: 90}
        ],
        poke: [
            null, {r: 255, g: 255, b: 255}, {r: 228, g: 89, b: 93}, {r: 247, g: 161, b: 113}, {r: 252, g: 234, b: 140}, {r: 105, g: 216, b: 175}, {r: 113, g: 170, b: 106}, {r: 44, g: 110, b: 183}, {r: 81, g: 150, b: 216}, {r: 138, g: 167, b: 204}, {r: 176, g: 112, b: 204}, {r: 222, g: 163, b: 234}, {r: 172, g: 206, b: 162}, {r: 231, g: 204, b: 174}, {r: 154, g: 109, b: 95}, {r: 69, g: 69, b: 69}
        ],
        adventure: [
            null, {r: 255, g: 255, b: 255}, {r: 233, g: 212, b: 169}, {r: 197, g: 126, b: 125}, {r: 167, g: 78, b: 90}, {r: 248, g: 174, b: 73}, {r: 157, g: 157, b: 90}, {r: 85, g: 125, b: 74}, {r: 15, g: 74, b: 109}, {r: 59, g: 131, b: 161}, {r: 77, g: 80, b: 97}, {r: 110, g: 129, b: 161}, {r: 161, g: 172, b: 189}, {r: 231, g: 231, b: 231}, {r: 113, g: 74, b: 71}, {r: 28, g: 31, b: 33}
        ],
        diy: [
            null, {r: 255, g: 255, b: 255}, {r: 255, g: 0, b: 0}, {r: 255, g: 153, b: 170}, {r: 255, g: 204, b: 0}, {r: 255, g: 255, b: 0}, {r: 0, g: 255, b: 0}, {r: 0, g: 204, b: 0}, {r: 0, g: 0, b: 255}, {r: 0, g: 255, b: 255}, {r: 170, g: 0, b: 255}, {r: 204, g: 153, b: 255}, {r: 170, g: 170, b: 170}, {r: 238, g: 187, b: 136}, {r: 136, g: 68, b: 0}, {r: 0, g: 0, b: 0}
        ],
        adafruit: [
            null, {r: 255, g: 255, b: 255}, {r: 255, g: 0, b: 0}, {r: 255, g: 85, b: 0}, {r: 255, g: 170, b: 0}, {r: 255, g: 255, b: 0}, {r: 0, g: 255, b: 0}, {r: 0, g: 170, b: 85}, {r: 0, g: 0, b: 255}, {r: 0, g: 170, b: 255}, {r: 170, g: 0, b: 255}, {r: 255, g: 0, b: 255}, {r: 170, g: 170, b: 170}, {r: 85, g: 85, b: 85}, {r: 255, g: 85, b: 170}, {r: 0, g: 0, b: 0}
        ],
        still_life: [
            null, {r: 255, g: 255, b: 255}, {r: 155, g: 226, b: 222}, {r: 255, g: 111, b: 90}, {r: 224, g: 148, b: 106}, {r: 232, g: 196, b: 102}, {r: 173, g: 205, b: 109}, {r: 105, g: 180, b: 119}, {r: 84, g: 129, b: 142}, {r: 97, g: 164, b: 196}, {r: 157, g: 148, b: 209}, {r: 107, g: 90, b: 131}, {r: 141, g: 121, b: 110}, {r: 199, g: 174, b: 158}, {r: 112, g: 96, b: 89}, {r: 61, g: 58, b: 79}
        ],
        steam_punk: [
            null, {r: 255, g: 255, b: 255}, {r: 180, g: 218, b: 214}, {r: 59, g: 55, b: 64}, {r: 102, g: 77, b: 73}, {r: 159, g: 103, b: 81}, {r: 115, g: 113, b: 86}, {r: 159, g: 168, b: 102}, {r: 100, g: 125, b: 135}, {r: 138, g: 161, b: 171}, {r: 125, g: 113, b: 135}, {r: 163, g: 146, b: 165}, {r: 189, g: 191, b: 197}, {r: 228, g: 231, b: 234}, {r: 165, g: 148, b: 135}, {r: 89, g: 85, b: 90}
        ],
        grayscale: [
             null, {r: 255, g: 255, b: 255}, {r: 247, g: 247, b: 247}, {r: 225, g: 225, b: 225}, {r: 204, g: 204, b: 204}, {r: 184, g: 184, b: 184}, {r: 163, g: 163, b: 163}, {r: 142, g: 142, b: 142}, {r: 122, g: 122, b: 122}, {r: 102, g: 102, b: 102}, {r: 81, g: 81, b: 81}, {r: 61, g: 61, b: 61}, {r: 41, g: 41, b: 41}, {r: 20, g: 20, b: 20}, {r: 0, g: 0, b: 0}, {r: 0, g: 0, b: 0} // Only 14 unique grays + black
        ]
    };

    // MakeCode Default Palette (Keep for reference/fallback?)
    const makeCodeDefaultPaletteRGB = predefinedPalettes.arcade;

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
        const imgLiteral = generateImageLiteral(processedImageData);

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
        // console.log('Mapping to palette...'); // Noisy
        const { width, height, data } = imageData;
        const pixelIndices = new Uint8Array(width * height); // Array to hold palette indices (0-15)
        let currentPalette = predefinedPalettes[paletteMode]; // Get selected palette by key

        // Fallback to default if the selected palette doesn't exist (shouldn't happen)
        if (!currentPalette) {
            console.warn(`Selected palette '${paletteMode}' not found, using default Arcade palette.`);
            currentPalette = predefinedPalettes.arcade;
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

        // console.log('Palette mapping complete.'); // Noisy
        return {
            width: width,
            height: height,
            palette: currentPalette, // The palette definition used (RGB values)
            pixelIndices: pixelIndices // The array of palette indices (0-15)
        };
    }

    function generateImageLiteral(processedData) {
        // console.log('Generating image literal multi-line...'); // Noisy
        const { width, height, pixelIndices } = processedData;

        if (!pixelIndices || width <= 0 || height <= 0) {
             console.error("Missing or invalid pixel data for literal generation.");
             return ''; // Return empty string on error
        }

        // --- Generate Multi-line Format with Spaces and ACTUAL newlines ---
        let multiLineContent = "";
        for (let y = 0; y < height; y++) {
            let rowString = "";
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                // Ensure index is valid, default to 0 if out of bounds (shouldn't happen)
                const paletteIndex = (index < pixelIndices.length) ? pixelIndices[index] : 0;
                // Use '.' for transparent (index 0), hex otherwise
                const char = (paletteIndex === 0) ? '.' : paletteIndex.toString(16);
                rowString += char + " "; // Add character AND space
            }
            // Trim trailing space from the row before adding ACTUAL newline
            multiLineContent += rowString.trimEnd() + "\n"; // Use "\n" (newline character)
        }
        // Trim the final newline
        multiLineContent = multiLineContent.trimEnd();

        return multiLineContent; // Return just the multi-line content string with actual newlines
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

    function updateOutputs(varName, multiLineContent) {
        // console.log('Updating code outputs...'); // Noisy

        // Ensure multiLineContent doesn't start/end with extra newlines
        const trimmedContent = multiLineContent.trim();

        // Add indentation (e.g., 4 spaces) to each line of the sprite data
        const indentedSpriteData = trimmedContent.split('\n') // Split by newline char
                                             .map(line => '    ' + line) // Indent
                                             .join('\n'); // Join with newline char

        // Construct the final formatted code strings using template literals with actual newlines
        // JavaScript version (already correct)
        const jsCode =
`let ${varName} = sprites.create(img\`
${indentedSpriteData}
\`, SpriteKind.Player)`;

        // Python version - Add parentheses around the img literal
        const pythonCode =
`${varName} = sprites.create(img("""
${indentedSpriteData}
"""), SpriteKind.player)`; // Added parentheses HERE ---^  ^

        jsCodeOutput.value = jsCode;
        pythonCodeOutput.value = pythonCode;
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
        // imgLiteralOutput.value = ''; // Remove reset
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
        paletteModeSelect.value = 'arcade'; // Set default palette
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

    let successful = false;
    try {
        successful = document.execCommand('copy');
        if (successful) {
            console.log('Code copied to clipboard (execCommand).');
            // Optional: Add visual feedback (e.g., temporary message)
            // alert('Code copied!'); // Example feedback
        } else {
             console.error('Fallback copy command failed.');
             alert('Failed to copy code automatically. Please copy manually.');
        }
    } catch (err) {
        console.error('execCommand copy failed with error: ', err);
        alert('Failed to copy code automatically. Please copy manually.');
    }

    // Deselect text after copy attempt (optional)
    // window.getSelection().removeAllRanges();
}