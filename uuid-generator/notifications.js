let notificationAreaElement = null;

export function initNotifications(areaElement) {
    if (!areaElement) {
        console.error("Notification area element not provided.");
        return;
    }
    notificationAreaElement = areaElement;
}

export function showNotification(message, type = 'success', duration = 4000) {
    if (!notificationAreaElement) {
        console.error("Notification module not initialized. Cannot show notification:", message);
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationAreaElement.appendChild(notification);

    requestAnimationFrame(() => {
        const notifications = notificationAreaElement.querySelectorAll('.notification');
        let currentOffset = 0;

        notifications.forEach((notif) => {
            notif.style.top = `${currentOffset}px`;
            currentOffset += notif.offsetHeight + 10;
        });

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)'; 

        notification.addEventListener('transitionend', function handler() {
            notification.removeEventListener('transitionend', handler);
            notification.remove();

            const remainingNotifications = notificationAreaElement.querySelectorAll('.notification');
            let currentOffset = 0;
            remainingNotifications.forEach(notif => {
                notif.style.top = `${currentOffset}px`;
                currentOffset += notif.offsetHeight + 10;
            });
        });
    }, duration);
}

