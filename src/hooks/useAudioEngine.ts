import { useCallback, useRef, useState, useEffect } from 'react';
import { Sound, SoundDefinition, SoundKit, SoundKitId, SOUND_KITS, DEFAULT_SOUNDS } from '@/types/drumMachine';

// Create initial sounds from default kit (without buffers)
const createInitialSounds = (kitId: SoundKitId = 'classic'): Sound[] => {
  const kit = SOUND_KITS.find(k => k.id === kitId) || SOUND_KITS[0];
  return kit.sounds.map(s => ({ ...s, buffer: null }));
};

// Sound generation functions for different kits
const generateKick = (ctx: AudioContext, style: 'classic' | '808' | 'acoustic' | 'electronic' | 'lofi'): AudioBuffer => {
  const duration = style === '808' ? 0.8 : 0.5;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      let freq, amp;
      
      switch (style) {
        case '808':
          freq = 60 * Math.exp(-t * 8) + 30;
          amp = Math.exp(-t * 4);
          data[i] = Math.sin(2 * Math.PI * freq * t) * amp;
          break;
        case 'acoustic':
          freq = 120 * Math.exp(-t * 25) + 50;
          amp = Math.exp(-t * 10);
          data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.9;
          if (t < 0.005) data[i] += Math.random() * 0.4 * (1 - t / 0.005);
          break;
        case 'electronic':
          freq = 180 * Math.exp(-t * 30) + 35;
          amp = Math.exp(-t * 6);
          data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.85;
          break;
        case 'lofi':
          freq = 100 * Math.exp(-t * 15) + 40;
          amp = Math.exp(-t * 8) * (0.9 + Math.random() * 0.1);
          data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
          break;
        default:
          freq = 150 * Math.exp(-t * 20) + 40;
          amp = Math.exp(-t * 8);
          data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
          if (t < 0.01) data[i] += Math.random() * 0.3 * (1 - t / 0.01);
      }
    }
  }
  return buffer;
};

const generateSnare = (ctx: AudioContext, style: 'classic' | '808' | 'acoustic' | 'electronic' | 'lofi'): AudioBuffer => {
  const duration = style === 'acoustic' ? 0.4 : 0.3;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      let noise, tone;
      
      switch (style) {
        case '808':
          noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
          tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 25);
          data[i] = (noise * 0.8 + tone * 0.2) * 0.75;
          break;
        case 'acoustic':
          noise = (Math.random() * 2 - 1) * Math.exp(-t * 10);
          tone = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 18);
          data[i] = (noise * 0.6 + tone * 0.4) * 0.85;
          break;
        case 'electronic':
          noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
          tone = Math.sin(2 * Math.PI * 250 * t) * Math.exp(-t * 30);
          data[i] = (noise * 0.85 + tone * 0.15) * 0.8;
          break;
        case 'lofi':
          noise = (Math.random() * 2 - 1) * Math.exp(-t * 10) * (0.85 + Math.random() * 0.15);
          tone = Math.sin(2 * Math.PI * 170 * t) * Math.exp(-t * 15);
          data[i] = (noise * 0.65 + tone * 0.35) * 0.7;
          break;
        default:
          noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
          tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 20);
          data[i] = (noise * 0.7 + tone * 0.3) * 0.8;
      }
    }
  }
  return buffer;
};

const generateHiHat = (ctx: AudioContext, open: boolean, style: 'classic' | '808' | 'acoustic' | 'electronic' | 'lofi'): AudioBuffer => {
  const duration = open ? 0.5 : 0.1;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const decay = open ? 4 : 35;
      let sample;
      
      switch (style) {
        case '808':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * (open ? 3 : 40)) * 0.45;
          break;
        case 'acoustic':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * (open ? 5 : 30)) * 0.5;
          sample += Math.sin(2 * Math.PI * 8000 * t) * 0.05 * Math.exp(-t * 50);
          break;
        case 'electronic':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * (open ? 6 : 50)) * 0.55;
          break;
        case 'lofi':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * (open ? 4 : 25)) * 0.35;
          break;
        default:
          sample = (Math.random() * 2 - 1) * Math.exp(-t * decay) * 0.5;
      }
      data[i] = sample;
    }
  }
  return buffer;
};

const generateClap = (ctx: AudioContext, style: string): AudioBuffer => {
  const duration = 0.25;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      let amp = 0;
      
      for (let j = 0; j < 4; j++) {
        const offset = j * 0.01;
        if (t > offset && t < offset + 0.02) {
          amp += (Math.random() * 2 - 1) * 0.4;
        }
      }
      amp += (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.6;
      data[i] = amp * (style === 'lofi' ? 0.7 : 0.85);
    }
  }
  return buffer;
};

const generateTom = (ctx: AudioContext, freq: number, style: string): AudioBuffer => {
  const duration = style === '808' ? 0.6 : 0.4;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const decay = style === '808' ? 3 : 5;
      const f = freq * Math.exp(-t * decay);
      data[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * (style === '808' ? 5 : 8)) * 0.7;
    }
  }
  return buffer;
};

const generateCymbal = (ctx: AudioContext, long: boolean, style: string): AudioBuffer => {
  const duration = long ? 2 : 1;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const decay = long ? 1.5 : 3;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * decay);
      const shimmer = Math.sin(2 * Math.PI * 5000 * t) * 0.1 * Math.exp(-t * 5);
      data[i] = (noise * 0.8 + shimmer) * (style === 'lofi' ? 0.3 : 0.4);
    }
  }
  return buffer;
};

const generatePerc = (ctx: AudioContext, freq: number, decay: number = 30): AudioBuffer => {
  const duration = 0.2;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * decay);
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.2;
      data[i] = (tone + noise) * 0.6;
    }
  }
  return buffer;
};

const generateNoise = (ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay) * 0.5;
    }
  }
  return buffer;
};

const generateSynth = (ctx: AudioContext, freq: number, duration: number, waveform: 'sine' | 'square' | 'sawtooth' = 'sine'): AudioBuffer => {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const phase = 2 * Math.PI * freq * t;
      let sample;
      switch (waveform) {
        case 'square':
          sample = Math.sign(Math.sin(phase));
          break;
        case 'sawtooth':
          sample = 2 * ((freq * t) % 1) - 1;
          break;
        default:
          sample = Math.sin(phase);
      }
      data[i] = sample * Math.exp(-t * 10) * 0.5;
    }
  }
  return buffer;
};

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [sounds, setSounds] = useState<Sound[]>(() => createInitialSounds('classic'));
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentKit, setCurrentKit] = useState<SoundKitId>('classic');

  const generateSoundsForKit = useCallback((ctx: AudioContext, kitId: SoundKitId): Sound[] => {
    const kit = SOUND_KITS.find(k => k.id === kitId) || SOUND_KITS[0];
    const style = kitId as 'classic' | '808' | 'acoustic' | 'electronic' | 'lofi';
    
    return kit.sounds.map((def) => {
      let buffer: AudioBuffer;
      const id = def.id;
      
      // Generate appropriate sound based on ID pattern
      if (id.includes('kick') || id.includes('bass')) {
        buffer = generateKick(ctx, style);
      } else if (id.includes('snare') || id.includes('snr')) {
        buffer = generateSnare(ctx, style);
      } else if (id.includes('hat-c') || id.includes('hat-cls') || id === 'hihat-closed') {
        buffer = generateHiHat(ctx, false, style);
      } else if (id.includes('hat-o') || id.includes('hat-opn') || id === 'hihat-open') {
        buffer = generateHiHat(ctx, true, style);
      } else if (id.includes('clap') || id.includes('snap') || id.includes('stick')) {
        buffer = generateClap(ctx, style);
      } else if (id.includes('tom-h') || id.includes('tom-hi') || id === 'tom-hi') {
        buffer = generateTom(ctx, 300, style);
      } else if (id.includes('tom-m') || id.includes('tom-mid') || id === 'tom-mid') {
        buffer = generateTom(ctx, 200, style);
      } else if (id.includes('tom-l') || id.includes('tom-low') || id.includes('tom-f') || id === 'tom-low') {
        buffer = generateTom(ctx, 120, style);
      } else if (id.includes('crash') || id.includes('cym')) {
        buffer = generateCymbal(ctx, true, style);
      } else if (id.includes('ride') || id.includes('bell')) {
        buffer = generateCymbal(ctx, false, style);
      } else if (id.includes('rim') || id.includes('cross')) {
        buffer = generatePerc(ctx, 1200, 40);
      } else if (id.includes('cow')) {
        buffer = generatePerc(ctx, 560, 20);
      } else if (id.includes('shak') || id.includes('marac') || id.includes('brush')) {
        buffer = generateNoise(ctx, 0.15, 20);
      } else if (id.includes('tamb') || id.includes('clav')) {
        buffer = generateNoise(ctx, 0.1, 30);
      } else if (id.includes('conga-h') || id.includes('perc1') || id.includes('perc-1')) {
        buffer = generatePerc(ctx, 800, 25);
      } else if (id.includes('conga-l') || id.includes('perc2') || id.includes('perc-2')) {
        buffer = generatePerc(ctx, 600, 25);
      } else if (id.includes('noise') || id.includes('crackle') || id.includes('hiss')) {
        buffer = generateNoise(ctx, 0.3, 5);
      } else if (id.includes('laser') || id.includes('zap')) {
        buffer = generateSynth(ctx, 1000, 0.15, 'sawtooth');
      } else if (id.includes('beep') || id.includes('blip')) {
        buffer = generateSynth(ctx, 880, 0.1, 'sine');
      } else if (id.includes('buzz') || id.includes('glitch')) {
        buffer = generateSynth(ctx, 220, 0.15, 'square');
      } else if (id.includes('metal')) {
        buffer = generatePerc(ctx, 3000, 15);
      } else if (id.includes('click') || id.includes('tap')) {
        buffer = generatePerc(ctx, 2000, 60);
      } else if (id.includes('chime')) {
        buffer = generateSynth(ctx, 1200, 0.4, 'sine');
      } else if (id.includes('sweep')) {
        buffer = generateSynth(ctx, 400, 0.3, 'sawtooth');
      } else if (id.includes('splash')) {
        buffer = generateCymbal(ctx, false, style);
      } else if (id.includes('flam')) {
        buffer = generateSnare(ctx, style);
      } else {
        buffer = generatePerc(ctx, 440, 30);
      }
      
      return { ...def, buffer };
    });
  }, []);

  const initAudio = useCallback(async (kitId: SoundKitId = 'classic') => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;
    }

    const ctx = audioContextRef.current;
    const generatedSounds = generateSoundsForKit(ctx, kitId);
    setSounds(generatedSounds);
    setCurrentKit(kitId);
    setIsInitialized(true);
  }, [generateSoundsForKit]);

  const switchKit = useCallback(async (kitId: SoundKitId) => {
    // Update sounds immediately for display (without buffers)
    setSounds(createInitialSounds(kitId));
    setCurrentKit(kitId);
    
    if (!audioContextRef.current) {
      // Will generate actual sounds when audio is initialized
      return;
    }
    
    const generatedSounds = generateSoundsForKit(audioContextRef.current, kitId);
    setSounds(generatedSounds);
  }, [generateSoundsForKit]);

  const playSound = useCallback((soundId: string, velocity: number = 1) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;

    const sound = sounds.find((s) => s.id === soundId);
    if (!sound?.buffer) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = sound.buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = sound.volume * velocity;

    const panNode = ctx.createStereoPanner();
    panNode.pan.value = sound.pan;

    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(masterGain);

    source.start();
  }, [sounds]);

  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  return {
    isInitialized,
    sounds,
    currentKit,
    initAudio,
    switchKit,
    playSound,
    setMasterVolume,
    audioContext: audioContextRef.current,
  };
};
