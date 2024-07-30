import { AnimationSegment } from 'lottie-web';

export enum BalloonState {
    Falling,
    Exploded,
    Deflated
}

export interface BalloonData {
    id: number;
    x: number;
    y: number;
    speed: number;
    state: BalloonState;
}

export interface LottieSegments {
    [key: string]: AnimationSegment;
}

export interface LottieResource {
    path: string;
    segments?: LottieSegments;
}