/**
 * Handles storing, loading, exporting, and importing UUIDs using localStorage.
 */

const LOCAL_STORAGE_KEY = 'generatedUuids';
let generatedUuids = new Set();
let notifications = null; 

/**
 * Initializes the storage module.
 * @param {object} notificationsModule - The module responsible for showing notifications.
 */
export function initStorage(notificationsModule) {
    notifications = notificationsModule;
}

/**
 * Loads generated UUIDs from localStorage.
 */
export function loadUuids() {
    if (!notifications) {
         console.error("Storage module not initialized with notifications.");
         tryLoad();
         return;
    }

    try {
        tryLoad();
        notifications.showNotification(`Loaded ${generatedUuids.size} UUIDs from storage.`, 'info');
    } catch (e) {
        console.error('Failed to load UUIDs from localStorage:', e);
        generatedUuids = new Set(); 
        notifications.showNotification('Warning: Could not load previous UUIDs from storage. Starting fresh. Duplicates across sessions might occur.', 'error');
    }
}

function tryLoad() {
     const storedUuids = localStorage.getItem(LOCAL_STORAGE_KEY);
     if (storedUuids) {
         const parsed = JSON.parse(storedUuids);
         if (Array.isArray(parsed)) {
             generatedUuids = new Set(parsed);
         } else {
             throw new Error('Stored data is not an array.');
         }
     } else {
        generatedUuids = new Set();
     }
}

/**
 * Saves the current set of generated UUIDs to localStorage.
 */
export function saveUuids() {
     if (!notifications) {
         console.error("Storage module not initialized with notifications. Cannot save.");
         return;
    }
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(generatedUuids)));
    } catch (e) {
        console.error('Failed to save UUIDs to localStorage:', e);
        notifications.showNotification('Warning: Could not save new UUIDs to storage. Duplicates across sessions might occur.', 'error');
    }
}

/**
 * Adds a single UUID to the set and saves.
 * @param {string} uuid - The UUID to add.
 * @returns {boolean} - True if the UUID was added (was unique), false otherwise.
 */
export function addUuid(uuid) {
    const sizeBefore = generatedUuids.size;
    generatedUuids.add(uuid);
    const added = generatedUuids.size > sizeBefore;
    if (added) {
        saveUuids();
    }
    return added;
}

/**
 * Checks if a UUID already exists in the set.
 * @param {string} uuid - The UUID to check.
 * @returns {boolean} - True if the UUID exists, false otherwise.
 */
export function hasUuid(uuid) {
    return generatedUuids.has(uuid);
}

/**
 * Gets the current set of generated UUIDs.
 * @returns {Set<string>} - The set of UUID strings.
 */
export function getUuidsSet() {
    return generatedUuids;
}

/**
 * Clears all stored UUIDs.
 * @returns {boolean} - True if cleared (user confirmed), false otherwise.
 */
export function clearUuids() {
    if (!notifications) {
         console.error("Storage module not initialized with notifications. Cannot clear.");
         return false;
    }

    if (generatedUuids.size === 0) {
        notifications.showNotification('No UUIDs to clear.', 'info');
        return false;
    }

    if (confirm(`Are you sure you want to clear all ${generatedUuids.size} stored UUIDs? This cannot be undone and might lead to generating duplicates of previously cleared UUIDs.`)) {
        generatedUuids.clear();
        saveUuids();
        notifications.showNotification('All stored UUIDs have been cleared.', 'success');
        return true;
    }
     return false;
}

/**
 * Exports stored UUIDs to a JSON file.
 */
export function exportUuidsToFile() {
     if (!notifications) {
         console.error("Storage module not initialized with notifications. Cannot export.");
         return;
    }
    if (generatedUuids.size === 0) {
        notifications.showNotification('No UUIDs to export.', 'info');
        return;
    }

    try {
        const uuidsArray = Array.from(generatedUuids);
        const jsonString = JSON.stringify(uuidsArray, null, 2); 

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `uuids_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url); 
        notifications.showNotification(`Exported ${uuidsArray.length} UUIDs.`, 'success');

    } catch (err) {
        console.error('Failed to export UUIDs:', err);
        notifications.showNotification('Failed to export UUIDs.', 'error');
    }
}

/**
 * Imports UUIDs from a JSON file and merges them with the current set.
 * @param {File} file - The file object selected by the user.
 */
export function importUuidsFromFile(file) {
     if (!notifications) {
         console.error("Storage module not initialized with notifications. Cannot import.");
         return;
    }

    if (file.type !== 'application/json') {
        notifications.showNotification('Invalid file type. Please select a JSON file.', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!Array.isArray(importedData)) {
                notifications.showNotification('Import failed: File content is not a JSON array.', 'error');
                return;
            }

            const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const validUuids = importedData.filter(item => {
                 return typeof item === 'string' && uuidV4Regex.test(item);
            });

             if (validUuids.length === 0) {
                notifications.showNotification('Import failed: No valid UUID v4 strings found in the file.', 'warning');
                 return;
             }

            const initialSize = generatedUuids.size;
            let addedCount = 0;

            validUuids.forEach(uuid => {
                if (!generatedUuids.has(uuid)) {
                    generatedUuids.add(uuid);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                saveUuids(); 
                notifications.showNotification(`Successfully imported ${addedCount} new UUIDs. Total UUIDs: ${generatedUuids.size}`, 'success');
            } else {
                notifications.showNotification(`No new UUIDs found in the imported file. Total UUIDs: ${generatedUuids.size}`, 'info');
            }

        } catch (err) {
            console.error('Failed to parse or process imported file:', err);
            notifications.showNotification('Import failed: Could not read or parse the file content.', 'error');
        }
    };

    reader.onerror = function() {
        console.error('FileReader error', reader.error);
        notifications.showNotification('Import failed: Could not read the file.', 'error');
    };

    reader.readAsText(file);
}