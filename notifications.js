/**
 * Notifications Module - Handles browser notification functionality
 * Manages permission requests and displays notifications when timers complete
 */

// Notification timeout constant (milliseconds)
const NOTIFICATION_TIMEOUT_MS = 5000;

/**
 * Checks if the browser supports the Notification API
 * @returns {boolean} True if Notification API is available
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Gets the current notification permission status
 * @returns {string} Permission status: 'granted', 'denied', or 'default'
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from the user
 * @returns {Promise<string>} Promise resolving to permission status
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Shows a browser notification for timer completion
 * @param {string} label - The timer label
 * @returns {Notification|null} The notification object or null if not shown
 */
export function showTimerCompletionNotification(label) {
  if (!isNotificationSupported()) {
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    return null;
  }
  
  try {
    const notification = new Notification('Timer Completed', {
      body: `${label} - Completed`,
      icon: './favicon.ico',
      badge: './favicon.ico',
      tag: 'timer-completion',
      requireInteraction: false
    });
    
    // Add event listeners for debugging
    notification.onshow = () => {
      console.log('Notification displayed:', label);
    };
    
    notification.onerror = (error) => {
      console.error('Notification error:', error);
    };
    
    notification.onclick = () => {
      console.log('Notification clicked');
      window.focus();
      notification.close();
    };
    
    // Auto-close notification after timeout
    setTimeout(() => {
      notification.close();
    }, NOTIFICATION_TIMEOUT_MS);
    
    console.log('Timer completion notification created:', label);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
