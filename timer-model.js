/**
 * Timer Model - Manages timer queue, run log, and application state
 */

/**
 * Application state
 */
const state = {
  timerQueue: [],      // Queue of timers waiting to run
  runLog: [],          // Historical log of completed timers
  isRunning: false,    // Whether a timer is currently running
  runningTimer: null,  // Reference to the currently running timer
  runningTimerStart: null  // Timestamp when current timer started
};

/**
 * Gets the current timer queue
 * @returns {Array} Array of timer objects
 */
export function getTimerQueue() {
  return state.timerQueue;
}

/**
 * Gets the run log
 * @returns {Array} Array of completed timer log entries
 */
export function getRunLog() {
  return state.runLog;
}

/**
 * Checks if a timer is currently running
 * @returns {boolean} True if a timer is running
 */
export function isRunning() {
  return state.isRunning;
}

/**
 * Sets the running state
 * @param {boolean} running - Whether a timer is running
 */
export function setRunning(running) {
  state.isRunning = running;
}

/**
 * Gets the currently running timer
 * @returns {Object|null} The running timer object or null
 */
export function getRunningTimer() {
  return state.runningTimer;
}

/**
 * Sets the currently running timer
 * @param {Object|null} timer - The timer object or null
 */
export function setRunningTimer(timer) {
  state.runningTimer = timer;
}

/**
 * Gets the start time of the running timer
 * @returns {Date|null} Start timestamp or null
 */
export function getRunningTimerStart() {
  return state.runningTimerStart;
}

/**
 * Sets the start time of the running timer
 * @param {Date|null} startTime - Start timestamp or null
 */
export function setRunningTimerStart(startTime) {
  state.runningTimerStart = startTime;
}

/**
 * Adds a timer to the queue
 * @param {Object} timer - Timer object containing block, duration, label, timeText
 */
export function addTimerToQueue(timer) {
  state.timerQueue.push(timer);
}

/**
 * Removes the first timer from the queue and returns it
 * @returns {Object|undefined} The first timer in the queue or undefined
 */
export function shiftTimerFromQueue() {
  return state.timerQueue.shift();
}

/**
 * Finds and removes a timer from the queue by its block element
 * @param {HTMLElement} block - The block element to find and remove
 * @returns {boolean} True if a timer was removed
 */
export function removeTimerFromQueue(block) {
  const idx = state.timerQueue.findIndex(t => t.block === block);
  if (idx !== -1) {
    state.timerQueue.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Clears all timers from the queue
 */
export function clearTimerQueue() {
  state.timerQueue.length = 0;
}

/**
 * Adds an entry to the run log
 * @param {Object} entry - Log entry with label, plannedDuration, startedAt, endedAt, actualElapsed
 */
export function addToRunLog(entry) {
  state.runLog.push(entry);
}

/**
 * Clears the run log
 */
export function clearRunLog() {
  state.runLog.length = 0;
}

/**
 * Exports the run log as a JSON string suitable for download.
 * Converts Date objects to ISO strings and includes only relevant fields.
 * 
 * @returns {string} JSON string of the run log
 */
export function exportRunLogAsJSON() {
  const exportArr = state.runLog.map(entry => ({
    label: entry.label,
    plannedDurationMs: entry.plannedDuration,
    actualDurationMs: entry.actualElapsed,
    startedAtISO: entry.startedAt.toISOString(),
    endedAtISO: entry.endedAt.toISOString()
  }));
  return JSON.stringify(exportArr, null, 2);
}
