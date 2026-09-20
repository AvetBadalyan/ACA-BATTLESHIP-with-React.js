/**
 * @fileoverview Sound effects using the browser's Audio API.
 *
 * Sounds are short pre-recorded files in src/assets/sounds. We import each
 * file so Vite bundles and cache-hashes it, then keep one Audio object per
 * sound and a small playSound() function that plays the requested one.
 * currentTime is reset first so the same sound can retrigger immediately
 * (e.g. rapid shots).
 *
 * INTERVIEW NOTES:
 * - No classes / no `this`: just an object of Audio instances + functions.
 * - Files are imported (not hardcoded URLs) so the bundler resolves the
 *   correct hashed path at build time.
 * - play() can reject (e.g. before the first user interaction); we swallow
 *   that rejection so it never crashes the game.
 */

import clickUrl from '@/assets/sounds/click.mp3';
import defeatUrl from '@/assets/sounds/defeat.mp3';
import hitUrl from '@/assets/sounds/hit.mp3';
import missUrl from '@/assets/sounds/miss.mp3';
import placeUrl from '@/assets/sounds/place.mp3';
import rotateUrl from '@/assets/sounds/rotate.mp3';
import sunkUrl from '@/assets/sounds/sunk.mp3';
import victoryUrl from '@/assets/sounds/victory.mp3';

export type SoundName =
  'hit' | 'miss' | 'sunk' | 'victory' | 'defeat' | 'place' | 'rotate' | 'click';

/** One Audio object per sound, created once and reused. */
const sounds: Record<SoundName, HTMLAudioElement> = {
  hit: new Audio(hitUrl),
  miss: new Audio(missUrl),
  sunk: new Audio(sunkUrl),
  victory: new Audio(victoryUrl),
  defeat: new Audio(defeatUrl),
  place: new Audio(placeUrl),
  rotate: new Audio(rotateUrl),
  click: new Audio(clickUrl),
};

/** Master volume for all effects (0-1). */
Object.values(sounds).forEach((audio) => {
  audio.volume = 0.5;
});

let soundEnabled = true;

/**
 * Plays a sound effect by name.
 * Resets currentTime so a repeated sound restarts instead of being ignored.
 */
export function playSound(name: SoundName) {
  if (!soundEnabled) return;

  const audio = sounds[name];
  audio.currentTime = 0;

  // play() returns a Promise that can reject (autoplay policy, missing file).
  // Ignore the rejection so a failed sound never breaks gameplay.
  void audio.play().catch(() => {});
}

/** Enables or disables all sound effects. */
export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}
