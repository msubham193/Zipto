import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scaleW = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleH = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const ms = (size: number, factor = 0.5) => size + (scaleW(size) - size) * factor;
const fs = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

const isSmallDevice = SCREEN_WIDTH <= 360;
const isLargeDevice = SCREEN_WIDTH >= 768;

export { SCREEN_WIDTH, SCREEN_HEIGHT, scaleW, scaleH, ms, fs, isSmallDevice, isLargeDevice };
