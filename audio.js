/**
 * Audio Module - Handles sound generation using Web Audio API
 * Generates beep sounds with configurable volume levels
 */

// Audio context (initialized lazily to comply with browser autoplay policies)
let audioContext = null;

/**
 * Sound level configurations mapping UI states to audio parameters
 * Each level defines gain (volume) and frequency for the beep sound
 */
const SOUND_LEVELS = {
  off: { gain: 0, frequency: 0 },
  soft: { gain: 0.1, frequency: 800 },
  medium: { gain: 0.3, frequency: 1000 },
  loud: { gain: 0.5, frequency: 1200 }
};

/**
 * Initializes the AudioContext if not already created.
 * Must be called in response to user interaction for browser autoplay policy.
 * 
 * @returns {AudioContext|null} The audio context or null if creation fails
 */
function getAudioContext() {
  if (!audioContext) {
    try {
      // Create AudioContext (works in modern browsers)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext initialized');
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return null;
    }
  }
  
  // Resume context if it's in suspended state (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(err => {
      console.error('Failed to resume AudioContext:', err);
    });
  }
  
  return audioContext;
}

/**
 * Plays a beep sound using Web Audio API OscillatorNode.
 * The beep characteristics (frequency and volume) are determined by the sound level.
 * 
 * @param {string} level - Sound level: 'off', 'soft', 'medium', or 'loud'
 * 
 * @example
 * playSound('soft');    // Plays a quiet beep
 * playSound('loud');    // Plays a loud beep
 * playSound('off');     // No sound played
 */
export function playSound(level = 'off') {
  // Normalize level to lowercase
  const normalizedLevel = level.toLowerCase();
  
  // Get sound configuration for the level
  const config = SOUND_LEVELS[normalizedLevel];
  
  if (!config) {
    console.warn(`Unknown sound level: ${level}`);
    return;
  }
  
  // Don't play if level is 'off' or gain is 0
  if (normalizedLevel === 'off' || config.gain === 0) {
    return;
  }
  
  // Get or create audio context
  const ctx = getAudioContext();
  if (!ctx) {
    console.error('AudioContext not available');
    return;
  }
  
  try {
    // Create oscillator node for the beep tone
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine'; // Smooth sine wave for a pleasant beep
    oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
    
    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
    
    // Fade out the sound to avoid clicking
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    // Connect nodes: oscillator -> gain -> speakers
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start and stop the oscillator
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3); // 300ms beep duration
    
    console.log(`Playing beep sound at level: ${level} (freq: ${config.frequency}Hz, gain: ${config.gain})`);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Initializes the audio system in response to user interaction.
 * This should be called early (e.g., on first user click) to ensure
 * the AudioContext is ready when needed.
 * 
 * Call this from your main initialization code to avoid issues with
 * browser autoplay policies.
 */
export function initializeAudio() {
  getAudioContext();
}

/**
 * Gets available sound levels for UI configuration.
 * 
 * @returns {Array<string>} Array of sound level names
 */
export function getSoundLevels() {
  return Object.keys(SOUND_LEVELS);
}
