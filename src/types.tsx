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

export interface LottieResource {
    path: string;
    specificFrames: {
        start: number;
        end: number;
    };
}