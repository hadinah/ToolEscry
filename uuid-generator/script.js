import * as uuidGenerator from './uuid.js';
import * as storage from './storage.js';
import * as notifications from './notifications.js';
import * as qrcodeDisplay from './qrcode.js';
import * as pdfGenerator from './pdf.js';

const generateBtn = document.getElementById('generateBtn');
const uuidValueEl = document.getElementById('uuidValue');
const copyUuidBtn = document.getElementById('copyUuidBtn');
const qrCodeImgEl = document.getElementById('qrCodeImg');
const downloadQrBtn = document.getElementById('downloadQrBtn');
const notificationArea = document.getElementById('notificationArea');

const uuidCountInput = document.getElementById('uuidCount');
const generatePdfBtn = document.getElementById('generatePdfBtn');

const exportUuidsBtn = document.getElementById('exportUuidsBtn');
const importUuidsBtn = document.getElementById('importUuidsBtn');
const importUuidsInput = document.getElementById('importUuidsInput'); 
const clearUuidsBtn = document.getElementById('clearUuidsBtn');

function initializeModules() {
    notifications.initNotifications(notificationArea);
    storage.initStorage(notifications);
    uuidGenerator.initUuid(storage, notifications);
    qrcodeDisplay.initQRCode(notifications);
    pdfGenerator.initPdf(uuidGenerator, storage, notifications);
}

function setupInitialState() {
    uuidValueEl.textContent = '';
    qrCodeImgEl.src = '';
    qrCodeImgEl.alt = 'QR Code will appear here';

    copyUuidBtn.disabled = true;
    downloadQrBtn.disabled = true;

    storage.loadUuids(); 
}

async function generateNew() {
    const newUuid = uuidGenerator.generateUniqueUuid(); 
    if (newUuid) {
        uuidValueEl.textContent = newUuid;
        copyUuidBtn.disabled = false; 
        await qrcodeDisplay.generateAndDisplayQRCode(newUuid, qrCodeImgEl, downloadQrBtn);
    } else {
        uuidValueEl.textContent = 'Error generating UUID';
        copyUuidBtn.disabled = true; 
        qrcodeDisplay.generateAndDisplayQRCode(null, qrCodeImgEl, downloadQrBtn); 
    }
}

async function copyUUID() {
    const uuid = uuidValueEl.textContent;
    if (!uuid || uuid === 'Error generating UUID') {
        notifications.showNotification('Nothing to copy.', 'error');
        return;
    }
    try {
        await navigator.clipboard.writeText(uuid);
        const originalText = copyUuidBtn.textContent;
        copyUuidBtn.textContent = 'Copied!';
        notifications.showNotification('UUID copied to clipboard!', 'success');
        setTimeout(() => {
            copyUuidBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy UUID: ', err);
        notifications.showNotification('Failed to copy UUID.', 'error');
    }
}

function downloadQRCode() {
    const dataUrl = qrCodeImgEl.src;
    const uuid = uuidValueEl.textContent || 'qrcode';
    if (!dataUrl || !dataUrl.startsWith('data:image/png;')) {
        notifications.showNotification('QR Code not available for download.', 'error');
        return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `uuid_qr_${uuid}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifications.showNotification('QR Code download started.', 'success');
}

function handleGeneratePdf() {
    const count = parseInt(uuidCountInput.value, 10);
    pdfGenerator.generateBulkPdf(count, generatePdfBtn);
}

function handleExportUuids() {
    storage.exportUuidsToFile();
}

function handleImportUuids(event) {
    const file = event.target.files[0];
    if (file) {
        storage.importUuidsFromFile(file);
    }
    event.target.value = ''; 
}

function handleClearAllUuids() {
    const cleared = storage.clearUuids();
    if (cleared) { 
         uuidValueEl.textContent = '';
         qrcodeDisplay.generateAndDisplayQRCode(null, qrCodeImgEl, downloadQrBtn); 
         copyUuidBtn.disabled = true; 
    }
}

generateBtn.addEventListener('click', generateNew);
copyUuidBtn.addEventListener('click', copyUUID);
downloadQrBtn.addEventListener('click', downloadQRCode);
generatePdfBtn.addEventListener('click', handleGeneratePdf); 

exportUuidsBtn.addEventListener('click', handleExportUuids); 
importUuidsBtn.addEventListener('click', () => {
    importUuidsInput.click(); 
});
importUuidsInput.addEventListener('change', handleImportUuids); 

clearUuidsBtn.addEventListener('click', handleClearAllUuids); 

document.addEventListener('DOMContentLoaded', () => {
    initializeModules();
    setupInitialState();
});

