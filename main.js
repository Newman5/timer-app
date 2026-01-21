/**
 * Main Application Module - Entry point and event handlers
 */

import { formatDuration, generateLogFilename, triggerDownload } from './utils.js';
import { 
  getTimerQueue,
  isRunning,
  setRunning,
  getRunningTimer,
  setRunningTimer,
  shiftTimerFromQueue,
  clearTimerQueue,
  clearRunLog,
  exportRunLogAsJSON,
  getSoundLevel,
  setSoundLevel,
  loadSoundLevel,
  getNotificationsEnabled,
  setNotificationsEnabled,
  loadNotificationsEnabled
} from './timer-model.js';
import { 
  createTimerBlock,
  startTimerAnimation,
  updateRunLogUI,
  highlightQueuedTimers,
  clearQueueBar,
  clearTimerWindow
} from './ui.js';
import { initializeAudio, playSound } from './audio.js';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission 
} from './notifications.js';

/**
 * Starts the next timer in the queue.
 * If no timers remain, resets the running state.
 */
function startNextTimer() {
  const timerQueue = getTimerQueue();
  
  if (timerQueue.length === 0) {
    // No more timers in queue
    setRunning(false);
    const startQueueButton = document.getElementById("startqueue");
    startQueueButton.disabled = false;
    setRunningTimer(null);
    return;
  }
  
  // Get next timer and start it
  const timer = shiftTimerFromQueue();
  startTimerAnimation(timer, startNextTimer);
}

/**
 * Handles the Start Queue button click.
 * Begins running all timers in the queue sequentially.
 */
function handleStartQueue() {
  // Prevent starting if already running or queue is empty
  // if running, send an alert "A timer is already running"
  if (isRunning()) {
    alert("A timer is already running");
    return;
  }
  const timerQueue = getTimerQueue();
  if (timerQueue.length === 0) return;

  // Update state
  setRunning(true);
  const startQueueButton = document.getElementById("startqueue");
  startQueueButton.disabled = true;

  // Visual feedback: highlight queued timers
  highlightQueuedTimers(timerQueue);
  
  // Start first timer
  startNextTimer();
}

/**
 * Handles adding a custom timer from the form.
 * 
 * @param {Event} e - Form submit event
 */
function handleAddCustomTimer(e) {
  e.preventDefault();
  
  const customMinutes = document.getElementById("custom-minutes");
  const customLabel = document.getElementById("custom-label");
  const form = document.getElementById("timer-form");
  
  const minutes = parseInt(customMinutes.value);
  const label = customLabel.value || "Custom Timer";
  
  // Validate input
  if (!isNaN(minutes) && minutes > 0) {
    // Convert minutes to milliseconds
    const duration = minutes * 60000;
    createTimerBlock(duration, label, startNextTimer);
    form.reset();
  }
}

/**
 * Handles adding a preset timer (5 min or 1 min).
 * 
 * @param {number} duration - Duration in milliseconds
 * @param {string} label - Label for the timer
 */
function handleAddPresetTimer(duration, label) {
  createTimerBlock(duration, label, startNextTimer);
}

/**
 * Handles clearing the run log.
 */
function handleClearLog() {
  clearRunLog();
  updateRunLogUI();
}

/**
 * Handles exporting the run log as a JSON file.
 */
function handleExportLog() {
  const jsonStr = exportRunLogAsJSON();
  const filename = generateLogFilename();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/**
 * Handles clearing all timers from the queue and stopping any running timer.
 */
function handleClearAll() {
  const runningTimer = getRunningTimer();
  
  // Stop running timer if exists
  if (isRunning() && runningTimer) {
    if (runningTimer.interval) clearInterval(runningTimer.interval);
    if (runningTimer.tween && typeof gsap !== 'undefined') runningTimer.tween.kill();
    if (runningTimer.block) runningTimer.block.remove();
    setRunningTimer(null);
    setRunning(false);
  }
  
  // Clear all visual elements
  clearQueueBar();
  clearTimerWindow();
  
  // Clear the queue
  clearTimerQueue();
  
  // Re-enable start button
  const startQueueButton = document.getElementById("startqueue");
  startQueueButton.disabled = false;
}

/**
 * Handles sound alert level changes.
 * Updates the model and plays a test sound at the new level.
 */
function handleSoundLevelChange(event) {
  const level = event.target.value;
  setSoundLevel(level);
  
  // Play a test beep at the selected level
  if (level !== 'off') {
    playSound(level);
  }
}

/**
 * Handles browser notification checkbox changes.
 * Requests permission if enabling, or updates preference if disabling.
 */
async function handleNotificationToggle(event) {
  const checkbox = event.target;
  const messageDiv = document.getElementById("notification-message");
  
  if (checkbox.checked) {
    // User wants to enable notifications - request permission
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      // Permission granted - enable notifications
      setNotificationsEnabled(true);
      messageDiv.textContent = '';
      console.log('Browser notifications enabled');
    } else {
      // Permission denied - uncheck and show message
      checkbox.checked = false;
      setNotificationsEnabled(false);
      messageDiv.textContent = 'Permission denied. Please enable notifications in your browser settings.';
      console.log('Notification permission denied');
    }
  } else {
    // User wants to disable notifications
    setNotificationsEnabled(false);
    messageDiv.textContent = '';
    console.log('Browser notifications disabled');
  }
}

/**
 * Initializes the application by setting up all event listeners.
 * Called when the DOM is fully loaded.
 */
function initializeApp() {
  // Initialize audio system (helps with browser autoplay policies)
  initializeAudio();
  
  // Load saved sound level preference
  const savedLevel = loadSoundLevel();
  const soundSelect = document.getElementById("sound-alert");
  if (soundSelect) {
    soundSelect.value = savedLevel;
  }
  
  // Initialize browser notifications
  const notificationCheckbox = document.getElementById("browser-notifications");
  const notificationSection = document.getElementById("notifications-section");
  
  if (!isNotificationSupported()) {
    // Hide notification section if API is not supported
    if (notificationSection) {
      notificationSection.style.display = 'none';
    }
  } else {
    // Load saved notification preference
    const savedNotificationPref = loadNotificationsEnabled();
    
    // If saved preference is enabled, check if permission is still granted
    if (savedNotificationPref) {
      const currentPermission = getNotificationPermission();
      if (currentPermission === 'granted') {
        notificationCheckbox.checked = true;
        setNotificationsEnabled(true);
      } else {
        // Permission was revoked, reset preference
        notificationCheckbox.checked = false;
        setNotificationsEnabled(false);
      }
    }
  }
  
  // Get DOM elements
  const fiveButton = document.getElementById("5btn");
  const oneButton = document.getElementById("1btn");
  const startQueueButton = document.getElementById("startqueue");
  const clearAllButton = document.getElementById("clearall");
  const form = document.getElementById("timer-form");
  const clearLogButton = document.getElementById("clearlog");
  const exportLogButton = document.getElementById("exportlog");

  // Set up event listeners
  form.addEventListener("submit", handleAddCustomTimer);
  startQueueButton.addEventListener("click", handleStartQueue);
  fiveButton.addEventListener("click", () => handleAddPresetTimer(300000, "5 Min Focus"));
  oneButton.addEventListener("click", () => handleAddPresetTimer(60000, "1 Min Breath"));
  clearLogButton.addEventListener("click", handleClearLog);
  exportLogButton.addEventListener("click", handleExportLog);
  clearAllButton.addEventListener("click", handleClearAll);
  
  // Set up sound alert control listener
  if (soundSelect) {
    soundSelect.addEventListener("change", handleSoundLevelChange);
  }
  
  // Set up browser notification checkbox listener
  if (notificationCheckbox) {
    notificationCheckbox.addEventListener("change", handleNotificationToggle);
  }
  
  console.log("Timer app initialized");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOMContentLoaded already fired
  initializeApp();
}
