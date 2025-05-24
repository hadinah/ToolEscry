const sidebarScanLink = document.getElementById('sidebar-scan-link');
const scannerSection = document.getElementById('scanner-section');
const formSection = document.getElementById('form-section');
const qrVideo = document.getElementById('qr-video');
const scannerMessage = document.getElementById('scanner-message');
const loadingIndicator = document.getElementById('loading-indicator');
const saveLoadingIndicator = document.getElementById('save-loading-indicator');
const toolForm = document.getElementById('tool-form');
const uuidInput = document.getElementById('uuid');
const toolNameInput = document.getElementById('tool-name');
const parentToolSelect = document.getElementById('parent-tool');
const descriptionTextarea = document.getElementById('description');
const tagsInput = document.getElementById('tags');
const saveToolButton = document.getElementById('save-tool-button');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
const successAnimation = document.getElementById('success-animation');

const errorElements = {
    'tool-name': document.getElementById('tool-name-error'),
    'parent-tool': document.getElementById('parent-tool-error'),
    'description': document.getElementById('description-error'),
    'tags': document.getElementById('tags-error')
};

let videoStream = null;
let animationFrameId = null;
const canvas = document.createElement('canvas'); 
const context = canvas.getContext('2d');

function showSection(sectionElement) {
    [scannerSection, formSection].forEach(sec => sec.classList.add('hidden'));
    sectionElement.classList.remove('hidden');
}

function showLoading(element, message = '') {
    element.textContent = message;
    element.classList.remove('hidden');
}

function hideLoading(element) {
    element.classList.add('hidden');
}

function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toastNotification.classList.remove('show', 'error');
    if (isError) {
        toastNotification.classList.add('error');
    }
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000); 
}

function showError(field, message) {
    const errorElement = errorElements[field];
    const inputElement = document.getElementById(field);
    if (errorElement) {
        errorElement.textContent = message;
    }
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearErrors() {
    Object.values(errorElements).forEach(el => el.textContent = '');
    Object.keys(errorElements).forEach(field => {
        const inputElement = document.getElementById(field);
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    });
}

function showSuccessAnimation() {
    successAnimation.classList.remove('hidden');
    setTimeout(() => {
        successAnimation.classList.add('hidden');
    }, 1500);
}


// --- QR Scanner Logic ---

async function startScanner(event) {
    event.preventDefault();

    showSection(scannerSection);
    scannerMessage.textContent = 'Starting camera...';
    hideLoading(loadingIndicator); 

    if (typeof window.jsQR === 'undefined') {
        console.error("jsQR library not loaded.");
        scannerMessage.textContent = 'Error: QR library not loaded.';
        showToast('Error: QR scanner library failed to load.', true);
        return;
    }


    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        qrVideo.srcObject = videoStream;
        qrVideo.setAttribute("playsinline", true); 

        qrVideo.onloadedmetadata = () => {
            qrVideo.play();
            scannerMessage.textContent = 'Align QR code within the frame';
            requestAnimationFrame(tick); 
        };

    } catch (err) {
        console.error("Error accessing camera: ", err);
        scannerMessage.textContent = 'Error: Could not access camera.';
        showToast('Error: Could not access camera. Please allow camera permissions.', true);
    }
}

function stopScanner() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    qrVideo.srcObject = null; 
    hideLoading(loadingIndicator);
}

function tick() {
    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        canvas.height = qrVideo.videoHeight;
        canvas.width = qrVideo.videoWidth;

        context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            console.log("Found QR code:", code.data);
            stopScanner();
            handleScanSuccess(code.data);
            return; 
        }
    }

    animationFrameId = requestAnimationFrame(tick);
}

function handleScanSuccess(uuid) {
    clearForm();
    uuidInput.value = uuid;

    clearErrors(); 
    showSection(formSection); 
    showSuccessAnimation(); 
    showToast('QR code scanned successfully!');
}

function clearForm() {
    toolNameInput.value = '';
    parentToolSelect.value = '';
    descriptionTextarea.value = '';
    tagsInput.value = '';
}

toolForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveTool();
});

function validateForm() {
    let isValid = true;
    clearErrors(); 

    if (!uuidInput.value.trim()) {
        console.error("UUID is missing");
        showToast("Error: No UUID scanned.", true);
        isValid = false;
    }
    if (!toolNameInput.value.trim()) {
        showError('tool-name', 'Tool Name is required.');
        isValid = false;
    }

    return isValid;
}

function saveTool() {
    if (!validateForm()) {
        showToast('Please fix the errors in the form.', true);
        return; 
    }

    showLoading(saveLoadingIndicator, 'Saving tool...');
    saveToolButton.disabled = true; 

    const toolData = {
        uuid: uuidInput.value.trim(),
        name: toolNameInput.value.trim(),
        category: parentToolSelect.value,
        description: descriptionTextarea.value.trim(),
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
    };

    console.log("Attempting to save:", toolData);

    setTimeout(() => {
        hideLoading(saveLoadingIndicator);
        saveToolButton.disabled = false;

        const saveSuccessful = Math.random() > 0.1; 

        if (saveSuccessful) {
            console.log("Tool saved successfully:", toolData);
            showToast('Tool saved successfully!');
        } else {
            console.error("Failed to save tool");
            showToast('Failed to save tool. Please try again.', true);
        }
    }, 1500); 
}


sidebarScanLink.addEventListener('click', startScanner);

stopScanner();
showSection(scannerSection);
hideLoading(loadingIndicator); 