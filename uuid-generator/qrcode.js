import QRCode from 'qrcode';

let notifications = null; 

export function initQRCode(notificationsModule) {
    notifications = notificationsModule;
}

export async function generateAndDisplayQRCode(text, imgElement, downloadBtnElement) {
    if (!notifications) {
        console.error("QR Code module not initialized.");
         await tryGenerateAndDisplay(text, imgElement, downloadBtnElement);
         return;
    }

    if (!text) {
        imgElement.src = '';
        imgElement.alt = 'QR Code will appear here';
        if (downloadBtnElement) downloadBtnElement.disabled = true;
        return;
    }
    try {
         await tryGenerateAndDisplay(text, imgElement, downloadBtnElement);
    } catch (err) {
        console.error('Failed to generate QR Code:', err);
        imgElement.src = '';
        imgElement.alt = 'Error generating QR Code';
        if (downloadBtnElement) downloadBtnElement.disabled = true;
        notifications.showNotification('Failed to generate QR code.', 'error');
    }
}

async function tryGenerateAndDisplay(text, imgElement, downloadBtnElement) {
     const dataUrl = await QRCode.toDataURL(text, {
         width: 200, 
         margin: 1,
         errorCorrectionLevel: 'H'
     });
     imgElement.src = dataUrl;
     imgElement.alt = `QR Code for ${text}`;
     if (downloadBtnElement) downloadBtnElement.disabled = false;
}

