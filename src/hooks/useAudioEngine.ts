import { useCallback, useRef, useState } from 'react';
import { Sound, DEFAULT_SOUNDS } from '@/types/drumMachine';

// Initial sounds without buffers - used for display before audio init
const initialSounds: Sound[] = DEFAULT_SOUNDS.map((s) => ({ ...s, buffer: null }));

// Generate synthetic drum sounds
const generateKick = (ctx: AudioContext): AudioBuffer => {
  const duration = 0.5;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 150 * Math.exp(-t * 20) + 40;
      const amp = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
      // Add click
      if (t < 0.01) {
        data[i] += Math.random() * 0.3 * (1 - t / 0.01);
      }
    }
  }
  return buffer;
};

const generateSnare = (ctx: AudioContext): AudioBuffer => {
  const duration = 0.3;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
      const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 20);
      data[i] = (noise * 0.7 + tone * 0.3) * 0.8;
    }
  }
  return buffer;
};

const generateHiHat = (ctx: AudioContext, open: boolean): AudioBuffer => {
  const duration = open ? 0.5 : 0.1;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const decay = open ? 6 : 30;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay) * 0.5;
    }
  }
  return buffer;
};

const generateClap = (ctx: AudioContext): AudioBuffer => {
  const duration = 0.25;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      let amp = 0;
      // Multiple attacks for clap effect
      for (let j = 0; j < 4; j++) {
        const offset = j * 0.01;
        if (t > offset && t < offset + 0.02) {
          amp += (Math.random() * 2 - 1) * 0.4;
        }
      }
      // Body
      amp += (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.6;
      data[i] = amp;
    }
  }
  return buffer;
};

const generateTom = (ctx: AudioContext, freq: number): AudioBuffer => {
  const duration = 0.4;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const f = freq * Math.exp(-t * 5);
      data[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 8) * 0.7;
    }
  }
  return buffer;
};

const generateCymbal = (ctx: AudioContext, long: boolean): AudioBuffer => {
  const duration = long ? 2 : 1;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const decay = long ? 1.5 : 3;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * decay);
      const shimmer = Math.sin(2 * Math.PI * 5000 * t) * 0.1 * Math.exp(-t * 5);
      data[i] = (noise * 0.8 + shimmer) * 0.4;
    }
  }
  return buffer;
};

const generatePerc = (ctx: AudioContext, freq: number): AudioBuffer => {
  const duration = 0.15;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30);
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.3;
      data[i] = (tone + noise) * 0.6;
    }
  }
  return buffer;
};

const generateShaker = (ctx: AudioContext): AudioBuffer => {
  const duration = 0.15;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.3;
    }
  }
  return buffer;
};

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const soundsRef = useRef<Sound[]>(initialSounds);
  const [sounds, setSounds] = useState<Sound[]>(initialSounds);
  const [isInitialized, setIsInitialized] = useState(false);

  const initAudio = useCallback(async () => {
    if (audioContextRef.current) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Generate all sounds
    const generatedSounds: Sound[] = DEFAULT_SOUNDS.map((s) => {
      let buffer: AudioBuffer;
      
      switch (s.id) {
        case 'kick':
          buffer = generateKick(ctx);
          break;
        case 'snare':
          buffer = generateSnare(ctx);
          break;
        case 'hihat-closed':
          buffer = generateHiHat(ctx, false);
          break;
        case 'hihat-open':
          buffer = generateHiHat(ctx, true);
          break;
        case 'clap':
          buffer = generateClap(ctx);
          break;
        case 'tom-hi':
          buffer = generateTom(ctx, 300);
          break;
        case 'tom-mid':
          buffer = generateTom(ctx, 200);
          break;
        case 'tom-low':
          buffer = generateTom(ctx, 120);
          break;
        case 'crash':
          buffer = generateCymbal(ctx, true);
          break;
        case 'ride':
          buffer = generateCymbal(ctx, false);
          break;
        case 'perc-1':
          buffer = generatePerc(ctx, 800);
          break;
        case 'perc-2':
          buffer = generatePerc(ctx, 600);
          break;
        case 'rim':
          buffer = generatePerc(ctx, 1200);
          break;
        case 'cowbell':
          buffer = generatePerc(ctx, 560);
          break;
        case 'shaker':
          buffer = generateShaker(ctx);
          break;
        case 'tambourine':
          buffer = generateShaker(ctx);
          break;
        default:
          buffer = generatePerc(ctx, 440);
      }
      
      return { ...s, buffer };
    });

    soundsRef.current = generatedSounds;
    setSounds(generatedSounds);
    setIsInitialized(true);
  }, []);

  const playSound = useCallback((soundId: string, velocity: number = 1) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;

    const sound = sounds.find((s) => s.id === soundId);
    if (!sound?.buffer) return;

    // Resume context if suspended
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

  const exportAudio = useCallback(async (
    renderCallback: (playStep: (step: number) => void) => Promise<void>,
    durationSeconds: number
  ): Promise<Blob> => {
    const offlineCtx = new OfflineAudioContext(2, 44100 * durationSeconds, 44100);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(offlineCtx.destination);

    // This would need the full pattern/arrangement data to render
    // For now, return an empty audio blob
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convert to WAV
    const wav = audioBufferToWav(renderedBuffer);
    return new Blob([wav], { type: 'audio/wav' });
  }, []);

  return {
    isInitialized,
    sounds,
    initAudio,
    playSound,
    setMasterVolume,
    exportAudio,
    audioContext: audioContextRef.current,
  };
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
