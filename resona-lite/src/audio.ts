import { File, Paths } from 'expo-file-system';
import type { NoiseType, SoundSettings, Track } from './model';

const sampleRate = 22_050;
const durationSeconds = 8;
const channels = 2;
const bytesPerSample = 2;
let nextFileId = 0;

export async function createTrackFile(track: Track, settings: SoundSettings): Promise<string> {
  const sampleCount = sampleRate * durationSeconds;
  const dataLength = sampleCount * channels * bytesPerSample;
  const bytes = new Uint8Array(44 + dataLength);
  const header = new DataView(bytes.buffer);

  writeText(header, 0, 'RIFF');
  header.setUint32(4, 36 + dataLength, true);
  writeText(header, 8, 'WAVE');
  writeText(header, 12, 'fmt ');
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, channels, true);
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * channels * bytesPerSample, true);
  header.setUint16(32, channels * bytesPerSample, true);
  header.setUint16(34, bytesPerSample * 8, true);
  writeText(header, 36, 'data');
  header.setUint32(40, dataLength, true);

  const samples = makeSamples(track, settings, sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const fade = Math.min(1, index / 660, (sampleCount - index - 1) / 660);
    const offset = 44 + index * channels * bytesPerSample;
    header.setInt16(offset, toPcm(samples.left[index] * fade), true);
    header.setInt16(offset + bytesPerSample, toPcm(samples.right[index] * fade), true);
  }

  const file = new File(Paths.cache, `resona-${track}-${Date.now()}-${nextFileId++}.wav`);
  file.create({ intermediates: true });
  await file.write(bytes);
  return file.uri;
}

function makeSamples(
  track: Track,
  settings: SoundSettings,
  count: number,
): { left: Float32Array; right: Float32Array } {
  if (track === 'binaural') return makeBinauralSamples(settings, count);
  if (track === 'ambient') return makeAmbientSamples(settings, count);
  return makeNoiseSamples(settings.noise, count);
}

function makeBinauralSamples(settings: SoundSettings, count: number) {
  const left = new Float32Array(count);
  const right = new Float32Array(count);
  const center = settings.droneFrequency;
  const leftFrequency = center - settings.beatHz / 2;
  const rightFrequency = center + settings.beatHz / 2;

  for (let index = 0; index < count; index += 1) {
    const time = index / sampleRate;
    left[index] =
      Math.sin(2 * Math.PI * leftFrequency * time) * 0.62 +
      Math.sin(2 * Math.PI * (center / 2) * time) * 0.13 +
      Math.sin(2 * Math.PI * (center * 1.5) * time) * 0.08;
    right[index] =
      Math.sin(2 * Math.PI * rightFrequency * time) * 0.62 +
      Math.sin(2 * Math.PI * (center / 2) * time) * 0.13 +
      Math.sin(2 * Math.PI * (center * 1.5) * time) * 0.08;
  }
  return { left, right };
}

function makeAmbientSamples(settings: SoundSettings, count: number) {
  const left = new Float32Array(count);
  const right = new Float32Array(count);
  const root = settings.droneFrequency;
  const droneLevel = (settings.drone / 100) * 0.22;
  const padLevel = (settings.pads / 100) * 0.075;
  const textureLevel = (settings.textures / 100) * 0.035;
  const melodyLevel = (settings.melody / 100) * 0.055;
  const stereoWidth = settings.spatial / 100;
  let brownNoise = 0;
  let seed = 41;

  for (let index = 0; index < count; index += 1) {
    const time = index / sampleRate;
    seed = (seed * 16_807) % 2_147_483_647;
    const white = (seed / 2_147_483_647) * 2 - 1;
    brownNoise = (brownNoise + 0.018 * white) / 1.018;
    const swell = 0.72 + 0.28 * Math.sin(2 * Math.PI * 0.11 * time);
    const drone = Math.sin(2 * Math.PI * root * time) * droneLevel;
    const lowDrone = Math.sin(2 * Math.PI * (root / 2) * time) * droneLevel * 0.46;
    const pads =
      (Math.sin(2 * Math.PI * root * time) +
        Math.sin(2 * Math.PI * root * 1.25 * time) +
        Math.sin(2 * Math.PI * root * 1.5 * time)) *
      padLevel *
      swell;
    const melody =
      Math.sin(2 * Math.PI * root * 2 * time + Math.sin(time * 0.7) * 0.14) *
      melodyLevel *
      (0.32 + 0.68 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.17 * time)));
    const texture = brownNoise * textureLevel;
    const center = drone + lowDrone + pads + melody;
    left[index] = center + texture + pads * stereoWidth * 0.18;
    right[index] = center + texture * (1 - stereoWidth * 0.15) - pads * stereoWidth * 0.18;
  }
  return { left, right };
}

function makeNoiseSamples(type: NoiseType, count: number) {
  const left = new Float32Array(count);
  const right = new Float32Array(count);
  let leftBrown = 0;
  let rightBrown = 0;
  let leftPink = 0;
  let rightPink = 0;
  let seed = 97;

  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return (seed / 2_147_483_647) * 2 - 1;
  };

  for (let index = 0; index < count; index += 1) {
    const time = index / sampleRate;
    const leftWhite = random();
    const rightWhite = random();
    leftBrown = (leftBrown + 0.018 * leftWhite) / 1.018;
    rightBrown = (rightBrown + 0.018 * rightWhite) / 1.018;
    leftPink = leftPink * 0.97 + leftWhite * 0.03;
    rightPink = rightPink * 0.97 + rightWhite * 0.03;
    left[index] = noiseValue(type, leftWhite, leftPink, leftBrown, time);
    right[index] = noiseValue(type, rightWhite, rightPink, rightBrown, time + 0.03);
  }

  return { left, right };
}

function noiseValue(type: NoiseType, white: number, pink: number, brown: number, time: number) {
  switch (type) {
    case 'white':
      return white * 0.16;
    case 'pink':
      return (white * 0.35 + pink * 1.8) * 0.095;
    case 'brown':
      return brown * 0.48;
    case 'rain':
      return (white * 0.22 + pink * 1.2) * 0.11 + (Math.sin(time * 91) > 0.997 ? white * 0.24 : 0);
    case 'ocean':
      return brown * 0.92 * (0.52 + 0.36 * Math.sin(2 * Math.PI * 0.13 * time));
    case 'forest':
      return (pink * 1.45 + Math.sin(2 * Math.PI * (0.19 + time * 0.009) * time) * 0.08) * 0.11;
  }
}

function toPcm(sample: number) {
  return Math.round(Math.max(-1, Math.min(1, sample)) * 32_767);
}

function writeText(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}
