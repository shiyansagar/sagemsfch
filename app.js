// === DOM Elements ===
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const qualitySection = document.getElementById('qualitySection');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const imageCount = document.getElementById('imageCount');
const actionSection = document.getElementById('actionSection');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const statusMessage = document.getElementById('statusMessage');

// === State ===
let uploadedFiles = [];
let convertedBlobs = [];
let isConverting = false;

// === Event Listeners ===
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', handleDragOver);
uploadZone.addEventListener('dragleave', handleDragLeave);
uploadZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', handleQualityChange);
convertBtn.addEventListener('click', convertImages);
downloadBtn.addEventListener('click', downloadZip);
clearBtn.addEventListener('click', clearAll);

// === Drag & Drop Handlers ===
function handleDragOver(e) {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(isValidImage);
    addFiles(files);
}

// === File Handling ===
function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(isValidImage);
    addFiles(files);
    fileInput.value = '';
}

function isValidImage(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    return validTypes.includes(file.type);
}

function addFiles(files) {
    if (files.length === 0) {
        showStatus('Please select PNG, JPEG, or JPG images.', 'error');
        return;
    }
    
    uploadedFiles = [...uploadedFiles, ...files];
    convertedBlobs = [];
    downloadBtn.disabled = true;
    updateUI();
    hideStatus();
}

// === UI Updates ===
function updateUI() {
    const hasFiles = uploadedFiles.length > 0;
    
    qualitySection.classList.toggle('visible', hasFiles);
    previewSection.classList.toggle('visible', hasFiles);
    actionSection.classList.toggle('visible', hasFiles);
    
    imageCount.textContent = `(${uploadedFiles.length})`;
    renderPreviews();
}

function renderPreviews() {
    previewGrid.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.onload = () => URL.revokeObjectURL(img.src);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFile(index);
        };
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        item.appendChild(img);
        item.appendChild(removeBtn);
        item.appendChild(fileName);
        previewGrid.appendChild(item);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    convertedBlobs = [];
    downloadBtn.disabled = true;
    updateUI();
    
    if (uploadedFiles.length === 0) {
        hideStatus();
    }
}

function clearAll() {
    uploadedFiles = [];
    convertedBlobs = [];
    downloadBtn.disabled = true;
    updateUI();
    hideStatus();
}

// === Quality Control ===
function handleQualityChange(e) {
    qualityValue.textContent = `${e.target.value}%`;
    // Reset conversion if quality changes
    if (convertedBlobs.length > 0) {
        convertedBlobs = [];
        downloadBtn.disabled = true;
        document.querySelectorAll('.preview-item').forEach(item => {
            item.classList.remove('converted');
        });
    }
}

// === Image Conversion ===
async function convertImages() {
    if (uploadedFiles.length === 0 || isConverting) return;
    
    isConverting = true;
    convertedBlobs = [];
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    progressSection.classList.add('visible');
    previewGrid.classList.add('converting');
    
    const quality = qualitySlider.value / 100;
    const total = uploadedFiles.length;
    
    try {
        for (let i = 0; i < total; i++) {
            const file = uploadedFiles[i];
            progressText.textContent = `Converting ${i + 1} of ${total}...`;
            progressFill.style.width = `${((i + 1) / total) * 100}%`;
            
            const webpBlob = await convertToWebP(file, quality);
            convertedBlobs.push({
                blob: webpBlob,
                name: file.name.replace(/\.(png|jpe?g)$/i, '.webp')
            });
            
            // Mark as converted in UI
            const previewItem = previewGrid.querySelector(`[data-index="${i}"]`);
            if (previewItem) {
                previewItem.classList.add('converted');
            }
        }
        
        progressText.textContent = 'Conversion complete!';
        showStatus(`✓ Successfully converted ${total} image${total > 1 ? 's' : ''} to WebP!`, 'success');
        downloadBtn.disabled = false;
        
    } catch (error) {
        console.error('Conversion error:', error);
        showStatus('Error converting images. Please try again.', 'error');
    } finally {
        isConverting = false;
        convertBtn.disabled = false;
        previewGrid.classList.remove('converting');
        
        setTimeout(() => {
            progressSection.classList.remove('visible');
            progressFill.style.width = '0%';
        }, 2000);
    }
}

function convertToWebP(file, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                },
                'image/webp',
                quality
            );
            
            URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// === ZIP Download ===
async function downloadZip() {
    if (convertedBlobs.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
        </svg>
        Creating ZIP...
    `;
    
    try {
        const zip = new JSZip();
        
        convertedBlobs.forEach(({ blob, name }) => {
            zip.file(name, blob);
        });
        
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // Download the ZIP file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `webp-images-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showStatus('✓ ZIP file downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('ZIP creation error:', error);
        showStatus('Error creating ZIP file. Please try again.', 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download ZIP
        `;
    }
}

// === Status Messages ===
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message visible ${type}`;
}

function hideStatus() {
    statusMessage.className = 'status-message';
}
