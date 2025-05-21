import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

let uuidGenerator = null;
let storage = null;
let notifications = null;

export const MAX_QRS_PER_PAGE = 11 * 16; 

export function initPdf(uuidModule, storageModule, notificationsModule) {
    uuidGenerator = uuidModule;
    storage = storageModule;
    notifications = notificationsModule;
}

export async function generateBulkPdf(count, generatePdfBtnElement) {
    if (!uuidGenerator || !storage || !notifications) {
        console.error("PDF module not initialized.");
        notifications.showNotification('PDF generation module not initialized correctly.', 'error');
        return;
    }

    const requestedCount = parseInt(count, 10);

    if (isNaN(requestedCount) || requestedCount < 1) {
        notifications.showNotification(`Please enter a number greater than 0.`, 'error');
        return;
    }

    notifications.showNotification(`Generating PDF with ${requestedCount} QR codes across potentially multiple pages... This may take a moment.`, 'info');

    if (generatePdfBtnElement) {
         generatePdfBtnElement.disabled = true;
         generatePdfBtnElement.textContent = 'Generating...';
    }

    try {
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const pageMargin = 10; 
        const qrSizeInPdf = 15; 
        const qrSpacing = 2;  

        const qrCodeGenerationOptions = {
            width: 128, 
            margin: 1, 
            errorCorrectionLevel: 'L' 
        };

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const availableWidth = pageWidth - (2 * pageMargin);
        const availableHeight = pageHeight - (2 * pageMargin);

        const qrsPerRow = Math.floor(availableWidth / (qrSizeInPdf + qrSpacing));
        
        let currentX = pageMargin;
        let currentY = pageMargin;
        let generatedCount = 0;
        let currentPage = 1;

        for (let i = 0; i < requestedCount; i++) {
            
            if (i > 0 && (i % qrsPerRow !== 0)) { 
                currentX += qrSizeInPdf + qrSpacing;
            } else if (i > 0) { 
                currentX = pageMargin;
                currentY += qrSizeInPdf + qrSpacing;
            }

            if (currentY + qrSizeInPdf > pageHeight - pageMargin) {
                 doc.addPage();
                 currentPage++;
                 currentX = pageMargin;
                 currentY = pageMargin;
            }

            const newUuid = uuidGenerator.generateUniqueUuid(); 
            if (!newUuid) {
                notifications.showNotification(`Failed to generate a unique UUID for the PDF after ${generatedCount} successful ones. Stopping PDF generation.`, 'error');
                break; 
            }

            const qrDataUrl = await QRCode.toDataURL(newUuid, qrCodeGenerationOptions);

            doc.addImage(qrDataUrl, 'PNG', currentX, currentY, qrSizeInPdf, qrSizeInPdf);

            generatedCount++;
        }

        if (generatedCount > 0) {
            doc.save(`qrcodes_${generatedCount}_uuids_${currentPage}_pages.pdf`);
            notifications.showNotification(`PDF with ${generatedCount} QR codes generated across ${currentPage} page(s)! Download started.`, 'success');
        } else {
            notifications.showNotification('No unique QR codes could be generated for the PDF.', 'error');
        }
    } catch (err) {
        console.error('Failed to generate PDF:', err);
        notifications.showNotification('Failed to generate PDF. See console for details.', 'error');
    } finally {
        if (generatePdfBtnElement) {
            generatePdfBtnElement.disabled = false;
            generatePdfBtnElement.textContent = 'Generate PDF';
        }
    }
}

