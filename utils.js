/**
 * Utility functions for the timer application
 */

/**
 * Formats a duration in milliseconds to a human-readable string.
 * Displays as "H:MM:SS" if hours are present, otherwise "M:SS"
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 * 
 * @example
 * formatDuration(3661000) // Returns "1:01:01"
 * formatDuration(125000)  // Returns "2:05"
 */
export function formatDuration(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}

/**
 * Generates a timestamped filename for log exports.
 * Format: timer-log-YYYY-MM-DD-HHMMSS.json
 * 
 * @returns {string} Filename with current timestamp
 * 
 * @example
 * generateLogFilename() // Returns "timer-log-2024-01-20-143052.json"
 */
export function generateLogFilename() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `timer-log-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
}

/**
 * Triggers a file download in the browser.
 * Creates a temporary anchor element and triggers a click to download the file.
 * 
 * @param {Blob} blob - The blob containing the file data
 * @param {string} filename - The name for the downloaded file
 * 
 * @example
 * const blob = new Blob(['data'], { type: 'application/json' });
 * triggerDownload(blob, 'myfile.json');
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up after download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Removes all child elements from a DOM node.
 * More efficient than setting innerHTML = ''
 * 
 * @param {HTMLElement} element - The element to clear
 * 
 * @example
 * clearChildren(document.getElementById('queue-bar'));
 */
export function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
