// Sound effects manager for the game

type SoundType = 'hit' | 'miss' | 'sunk' | 'victory' | 'defeat' | 'place' | 'rotate' | 'click';

// Web Audio API based sound generation (no external files needed)
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', decay = true) {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    if (decay) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, filterFreq: number = 1000) {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }

  play(sound: SoundType) {
    if (!this.enabled) return;

    switch (sound) {
      case 'hit':
        // Explosion sound - low frequency boom with noise
        this.playTone(80, 0.3, 'sawtooth');
        this.playNoise(0.4, 500);
        setTimeout(() => this.playTone(60, 0.2, 'square'), 100);
        break;
        
      case 'miss':
        // Water splash - white noise with filter sweep
        this.playNoise(0.5, 800);
        this.playTone(200, 0.15, 'sine');
        break;
        
      case 'sunk':
        // Ship sinking - descending tones with explosion
        this.playTone(80, 0.3, 'sawtooth');
        this.playNoise(0.6, 400);
        setTimeout(() => this.playTone(150, 0.2, 'square'), 100);
        setTimeout(() => this.playTone(100, 0.3, 'square'), 200);
        setTimeout(() => this.playTone(60, 0.4, 'sawtooth'), 350);
        break;
        
      case 'victory':
        // Victory fanfare - ascending major chord
        this.playTone(523.25, 0.2, 'square'); // C5
        setTimeout(() => this.playTone(659.25, 0.2, 'square'), 150); // E5
        setTimeout(() => this.playTone(783.99, 0.2, 'square'), 300); // G5
        setTimeout(() => this.playTone(1046.5, 0.5, 'square'), 450); // C6
        break;
        
      case 'defeat':
        // Defeat sound - descending minor
        this.playTone(440, 0.3, 'sawtooth'); // A4
        setTimeout(() => this.playTone(349.23, 0.3, 'sawtooth'), 250); // F4
        setTimeout(() => this.playTone(293.66, 0.4, 'sawtooth'), 500); // D4
        break;
        
      case 'place':
        // Ship placement - positive click
        this.playTone(880, 0.08, 'square');
        setTimeout(() => this.playTone(1100, 0.1, 'square'), 50);
        break;
        
      case 'rotate':
        // Rotation sound - swoosh
        this.playTone(300, 0.1, 'sine');
        setTimeout(() => this.playTone(500, 0.1, 'sine'), 50);
        break;
        
      case 'click':
        // UI click
        this.playTone(600, 0.05, 'square');
        break;
    }
  }
}

export const soundManager = new SoundManager();
