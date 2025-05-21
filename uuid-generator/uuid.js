let storage = null;
let notifications = null;

const MAX_ATTEMPTS = 100;

/**
 * Initializes the UUID module.
 * @param {object} storageModule - The module responsible for storing and checking UUIDs.
 * @param {object} notificationsModule - The module responsible for showing notifications.
 */
export function initUuid(storageModule, notificationsModule) {
    storage = storageModule;
    notifications = notificationsModule;
}

/**
 * Generates a UUID v4 string.
 * Ref: https://stackoverflow.com/a/2117523/1313284 and RFC 4122 section 4.4
 * @returns {string} - A new UUID v4 string.
 */
function generateUUIDv4Internal() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Generates a unique UUID v4 string, checking against the stored set.
 * Adds the new unique UUID to the storage.
 * @returns {string | null} - A unique UUID string, or null if generation fails after attempts.
 */
export function generateUniqueUuid() {
    if (!storage || !notifications) {
        console.error("UUID module not initialized.");
        return generateUUIDv4Internal(); 
    }

    let uuid;
    let attempts = 0;

    do {
        uuid = generateUUIDv4Internal();
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            console.error(`Failed to generate a unique UUID after ${MAX_ATTEMPTS} attempts.`);
            notifications.showNotification("Failed to generate a unique UUID after multiple attempts. There might be an issue or a very large number of UUIDs stored.", 'error');
            return null;
        }
    } while (storage.hasUuid(uuid));

    storage.addUuid(uuid); 
    return uuid;
}