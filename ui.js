/**
 * UI Module - Handles all DOM manipulation and user interface updates
 */

import { formatDuration, clearChildren } from './utils.js';
import { 
  addTimerToQueue, 
  removeTimerFromQueue, 
  getRunningTimer,
  setRunningTimer,
  addToRunLog,
  getRunLog,
  setRunningTimerStart,
  getRunningTimerStart,
  getSoundLevel,
  getNotificationsEnabled
} from './timer-model.js';
import { playSound } from './audio.js';
import { showTimerCompletionNotification } from './notifications.js';

// UI Constants
const DELETE_BUTTON_ZINDEX = 2;
const TIMER_BOTTOM_OFFSET = 170; // Offset from bottom of timer window for animation

/**
 * Creates a timer block element for the queue.
 * The block displays the duration and label, and includes a delete button.
 * 
 * @param {number} duration - Duration in milliseconds
 * @param {string} label - Label for the timer
 * @param {Function} onDelete - Callback function when block is deleted while running
 * @returns {Object} Timer object with block, duration, label, and timeText elements
 */
export function createTimerBlock(duration, label, onDelete) {
  const queueBar = document.getElementById("queue-bar");
  const block = document.createElement("div");
  block.className = "timer-block";

  // Create delete button
  const delBtn = createDeleteButton(block, duration, label, onDelete);
  block.appendChild(delBtn);

  // Create time display
  const timeText = document.createElement("div");
  timeText.textContent = formatDuration(duration);
  block.appendChild(timeText);

  // Create label display
  const labelText = document.createElement("div");
  labelText.className = "timer-label";
  labelText.textContent = label;
  block.appendChild(labelText);

  // Position block relatively for delete button
  block.style.position = "relative";
  queueBar.appendChild(block);

  // Create and store timer object
  const timer = { block, duration, label, timeText };
  addTimerToQueue(timer);
  
  console.log("Timer added to queue:", timer);
  return timer;
}

/**
 * Creates a delete button for a timer block.
 * Handles both deletion from queue and cancellation of running timers.
 * 
 * @param {HTMLElement} block - The timer block element
 * @param {number} duration - Duration in milliseconds
 * @param {string} label - Label for the timer
 * @param {Function} onDelete - Callback to trigger next timer if this one is running
 * @returns {HTMLElement} The delete button element
 */
function createDeleteButton(block, duration, label, onDelete) {
  const delBtn = document.createElement("button");
  delBtn.textContent = "×";
  delBtn.style.position = "absolute";
  delBtn.style.top = "4px";
  delBtn.style.right = "8px";
  delBtn.style.background = "transparent";
  delBtn.style.color = "white";
  delBtn.style.border = "none";
  delBtn.style.fontSize = "1.2rem";
  delBtn.style.cursor = "pointer";
  delBtn.style.zIndex = DELETE_BUTTON_ZINDEX;

  delBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    
    const runningTimer = getRunningTimer();
    
    // Check if deleting the currently running timer
    if (runningTimer && runningTimer.block === block) {
      // Stop the running timer
      if (runningTimer.interval) clearInterval(runningTimer.interval);
      if (runningTimer.tween && typeof gsap !== 'undefined') runningTimer.tween.kill();
      
      // Log the cancellation
      const startedAt = getRunningTimerStart();
      const endedAt = new Date();
      const actualElapsed = endedAt - startedAt;
      addToRunLog({
        label,
        plannedDuration: duration,
        startedAt,
        endedAt,
        actualElapsed
      });
      
      // Update UI and state
      block.remove();
      setRunningTimer(null);
      setRunningTimerStart(null);
      updateRunLogUI();
      
      // Start next timer in queue
      onDelete();
      return;
    }
    
    // Remove from queue if not running
    removeTimerFromQueue(block);
    block.remove();
  });

  return delBtn;
}

/**
 * Moves a timer block to the timer window and starts the countdown animation.
 * Uses GSAP for smooth animation and updates the display every 100ms.
 * 
 * @param {Object} timer - Timer object with block, duration, label, timeText
 * @param {Function} callback - Callback to execute when timer completes
 */
export function startTimerAnimation(timer, callback) {
  const { block, duration, label, timeText } = timer;
  
  // Record start time
  setRunningTimerStart(new Date());
  
  // Move block to timer window
  const timerWindow = document.getElementById("timer-window");
  timerWindow.appendChild(block);
  block.style.top = `0px`;
  block.style.left = `0px`;
  block.style.width = "50%";
  block.style.minWidth = "200px";

  // Set up countdown
  const startTime = Date.now();
  const endTime = startTime + duration;

  // Update display every 100ms
  const interval = setInterval(() => {
    const remaining = endTime - Date.now();
    
    if (remaining <= 0) {
      // Timer complete
      clearInterval(interval);
      timeText.textContent = formatDuration(0);
      
      // Play sound alert at the configured level
      const soundLevel = getSoundLevel();
      playSound(soundLevel);
      
      // Show browser notification if enabled
      if (getNotificationsEnabled()) {
        showTimerCompletionNotification(label);
      }
      
      const runningTimer = getRunningTimer();
      if (runningTimer && runningTimer.tween && typeof gsap !== 'undefined') {
        runningTimer.tween.kill();
      }
      
      // Log completion
      logTimerCompletion(label, duration);
      
      // Fade out animation (use GSAP if available, otherwise use CSS)
      if (typeof gsap !== 'undefined') {
        gsap.to(block, {
          opacity: 0,
          scale: 0,
          duration: 0.5,
          onComplete: () => {
            block.remove();
            setRunningTimer(null);
            setRunningTimerStart(null);
            if (typeof callback === 'function') callback();
          }
        });
      } else {
        // Fallback to CSS animation
        block.style.transition = 'opacity 0.5s, transform 0.5s';
        block.style.opacity = '0';
        block.style.transform = 'scale(0)';
        setTimeout(() => {
          block.remove();
          setRunningTimer(null);
          setRunningTimerStart(null);
          if (typeof callback === 'function') callback();
        }, 500);
      }
    } else {
      timeText.textContent = formatDuration(remaining);
    }
  }, 100);

  // Animate block falling down (use GSAP if available, otherwise use CSS)
  let tween = null;
  if (typeof gsap !== 'undefined') {
    tween = gsap.to(block, {
      y: timerWindow.clientHeight - TIMER_BOTTOM_OFFSET,
      duration: duration / 1000,
      ease: "linear"
    });
  } else {
    // Fallback to CSS animation if GSAP is not available
    const targetY = timerWindow.clientHeight - TIMER_BOTTOM_OFFSET;
    block.style.transition = `transform ${duration / 1000}s linear`;
    block.style.transform = `translateY(${targetY}px)`;
  }

  // Store references
  setRunningTimer({ block, interval, tween });
}

/**
 * Logs the completion of a timer to the run log and updates the UI.
 * 
 * @param {string} label - Timer label
 * @param {number} plannedDuration - Planned duration in milliseconds
 */
function logTimerCompletion(label, plannedDuration) {
  const endedAt = new Date();
  const startedAt = getRunningTimerStart();
  const actualElapsed = endedAt - startedAt;
  
  addToRunLog({
    label,
    plannedDuration,
    startedAt,
    endedAt,
    actualElapsed
  });
  
  updateRunLogUI();
}

/**
 * Updates the run log display with all completed timers.
 * Shows label, planned duration, start/end times, and actual duration.
 */
export function updateRunLogUI() {
  const logList = document.getElementById("run-log");
  clearChildren(logList);
  
  const logs = getRunLog();
  logs.forEach(entry => {
    const li = document.createElement("li");
    li.style.marginBottom = "0.5rem";
    li.textContent = `${entry.label} | Planned: ${formatDuration(entry.plannedDuration)} | Started: ${entry.startedAt.toLocaleString()} | Ended: ${entry.endedAt.toLocaleString()} | Actual: ${formatDuration(entry.actualElapsed)}`;
    logList.appendChild(li);
  });
}

/**
 * Highlights all timer blocks in the queue to indicate they are about to start.
 * Changes color and scales up slightly.
 * 
 * @param {Array} timerQueue - Array of timer objects
 */
export function highlightQueuedTimers(timerQueue) {
  timerQueue.forEach(({ block }) => {
    block.style.transform = "scale(1.1)";
    block.style.backgroundColor = "#d84315";
  });
}

/**
 * Clears all timer blocks from the queue bar.
 */
export function clearQueueBar() {
  const queueBar = document.getElementById("queue-bar");
  clearChildren(queueBar);
}

/**
 * Clears the timer window of all blocks.
 */
export function clearTimerWindow() {
  const timerWindow = document.getElementById("timer-window");
  clearChildren(timerWindow);
}
