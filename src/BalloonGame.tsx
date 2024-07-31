import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import Lottie from 'react-lottie-player'
import { AnimationItem, AnimationSegment } from 'lottie-web';
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import balloonPopSound from './assets/sound/balloon-pop.mp3';
import achievementSound from './assets/sound/mixkit-achievement-bell-600.mp3';
import backgroundImage from './assets/images/sky_background.jpg';
import explodingPigeonLottie from './assets/lottie/exploding_pigeon.json';
import { BalloonState, BalloonData, LottieResource } from './types';

// Constants
const MAX_BALLOONS = 10;
const BALLOON_SIZE = 200;
const COLUMNS = 8;
const SPAWN_ATTEMPTS = 10;

// Define Lottie resources
const DEFAULT_SEGMENT: AnimationSegment = [0, 1];

const lottieResources: Record<string, LottieResource> = {
    explodingPigeon: {
        // path:  './assets/lottie/exploding_pigeon.json',
        path: explodingPigeonLottie,
        segments: {
            bird: [1, 23],
            explosion: [24, 34],
            feathers: [35, 96]
        }
    }
};

interface BalloonGameProps {
    onBack: () => void;
}

const BalloonGame: React.FC<BalloonGameProps> = ({ onBack }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [balloons, setBalloons] = useState<BalloonData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [score, setScore] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const popSoundRef = useRef<Howl | null>(null);
    const achievementSoundRef = useRef<Howl | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const balloonsRef = useRef<BalloonData[]>([]);
    const balloonIdCounter = useRef(0);

    useEffect(() => {
        balloonsRef.current = balloons;
    }, [balloons]);

    useEffect(() => {
        popSoundRef.current = new Howl({ src: [balloonPopSound], mute: isMuted });
        achievementSoundRef.current = new Howl({ src: [achievementSound], mute: isMuted });

        return () => {
            popSoundRef.current?.unload();
            achievementSoundRef.current?.unload();
        };
    }, [isMuted]);

    useEffect(() => {
        if (popSoundRef.current) {
            popSoundRef.current.mute(isMuted);
        }
        if (achievementSoundRef.current) {
            achievementSoundRef.current.mute(isMuted);
        }
    }, [isMuted]);

    const startGame = () => {
        setGameStarted(true);
        setScore(0);
        spawnBalloons();
    };

    const getUniqueId = useCallback(() => {
        balloonIdCounter.current += 1;
        return balloonIdCounter.current;
    }, []);

    const spawnBalloon = useCallback((): BalloonData | null => {
        const gameWidth = gameAreaRef.current?.clientWidth ?? 0;
        const columnWidth = gameWidth / COLUMNS;

        let attempts = 0;
        while (attempts < SPAWN_ATTEMPTS) {
            const column = Math.floor(Math.random() * COLUMNS);
            const x = column * columnWidth + (columnWidth - BALLOON_SIZE) / 2;
            const candidate: BalloonData = {
                id: getUniqueId(),
                x,
                y: -BALLOON_SIZE,
                speed: 1 + Math.random(),
                state: BalloonState.Falling,
            };

            const hasCollision = balloonsRef.current.some(balloon =>
                Math.abs(balloon.x - candidate.x) < BALLOON_SIZE &&
                Math.abs(balloon.y - candidate.y) < BALLOON_SIZE
            );

            if (!hasCollision) {
                return candidate;
            }

            attempts++;
        }
        return null;
    }, [getUniqueId]);

    const spawnBalloons = useCallback(() => {
        if (!gameStarted) return;

        setBalloons(prevBalloons => {
            if (prevBalloons.length >= MAX_BALLOONS) {
                return prevBalloons;
            }

            const newBalloon = spawnBalloon();
            return newBalloon ? [...prevBalloons, newBalloon] : prevBalloons;
        });

        setTimeout(spawnBalloons, 1000 + Math.random() * 2000);
    }, [gameStarted, spawnBalloon]);

    useEffect(() => {
        if (gameStarted) {
            spawnBalloons();
        }
    }, [gameStarted, spawnBalloons]);

    const updateBalloonPositions = useCallback(() => {
        setBalloons(prevBalloons => {
            const gameHeight = gameAreaRef.current?.clientHeight ?? 0;
            const updatedBalloons = prevBalloons.map(balloon => {
                if (balloon.state === BalloonState.Falling) {
                    const newY = balloon.y + balloon.speed;
                    if (newY > gameHeight - BALLOON_SIZE) {
                        return { ...balloon, state: BalloonState.Deflated, y: gameHeight - BALLOON_SIZE };
                    }
                    return { ...balloon, y: newY };
                }
                return balloon;
            });

            return updatedBalloons;
        });

        animationFrameId.current = requestAnimationFrame(updateBalloonPositions);
    }, []);

    useEffect(() => {
        if (gameStarted) {
            animationFrameId.current = requestAnimationFrame(updateBalloonPositions);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameStarted, updateBalloonPositions]);

    const handleBalloonClick = (id: number) => {
        setBalloons(prevBalloons =>
            prevBalloons.map(balloon =>
                balloon.id === id ? { ...balloon, state: BalloonState.Exploded } : balloon
            )
        );
        popSoundRef.current?.play();
        setScore(prevScore => prevScore + 1);
        setShowModal(true);
        achievementSoundRef.current?.play();
    };

    const handleClaimPrize = () => {
        setShowModal(false);
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <div className="balloon-game">
            <div
                ref={gameAreaRef}
                className="game-area"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                {!gameStarted && (
                    <Button onClick={startGame} className="start-button">
                        Start Game
                    </Button>
                )}
                {balloons.map(balloon => (
                    <Balloon
                        key={balloon.id}
                        data={balloon}
                        onClick={() => handleBalloonClick(balloon.id)}
                        onAnimationComplete={() => {
                            setBalloons(prevBalloons =>
                                prevBalloons.filter(b => b.id !== balloon.id)
                            );
                        }}
                    />
                ))}
            </div>

            <Modal show={showModal} onHide={handleClaimPrize} centered>
                <Modal.Body>
                    <div className="prize-card">
                        <h2>Congratulations!</h2>
                        <p>You've popped a balloon and won a prize!</p>
                        <Button onClick={handleClaimPrize}>Claim Prize</Button>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="score">Score: {score}</div>

            <Button onClick={onBack} className="back-button">Back to Menu</Button>

            <Button onClick={toggleMute} className="mute-button">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </Button>

            <style>{`
                .balloon-game {
                    width: 1500px;
                    height: 1000px;
                    position: relative;
                    overflow: hidden;
                }
                .game-area {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                }
                .balloon {
                    width: ${BALLOON_SIZE}px;
                    height: ${BALLOON_SIZE}px;
                    position: absolute;
                    cursor: pointer;
                    transition: transform 0.1s ease-in-out;
                }
                .balloon:hover {
                    transform: scale(1.05);
                }
                .start-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                .score {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 24px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.5);
                    padding: 5px 10px;
                    border-radius: 5px;
                }
                .prize-card {
                    text-align: center;
                }
                .back-button {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                }
                .mute-button {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 15px;
                }
            `}</style>
        </div>
    );
};

interface BalloonProps {
    data: BalloonData;
    onClick: () => void;
    onAnimationComplete: () => void;
}

const Balloon: React.FC<BalloonProps> = ({ data, onClick, onAnimationComplete }) => {
    const [animationData, setAnimationData] = useState<object | null>(null);
    const [currentSegment, setCurrentSegment] = useState<AnimationSegment>(
        lottieResources.explodingPigeon.segments?.bird || DEFAULT_SEGMENT
    );
    const lottieRef = useRef<AnimationItem | null>(null);

    useEffect(() => {
        // import(lottieResources.explodingPigeon.path).then(setAnimationData);
        setAnimationData(lottieResources.explodingPigeon.path);
    }, []);

    const handleComplete = useCallback(() => {
        if (data.state === BalloonState.Exploded || data.state === BalloonState.Deflated) {
            onAnimationComplete();
        }
    }, [data.state, onAnimationComplete]);

    const getSegment = (segmentName: string): AnimationSegment => {
        return lottieResources.explodingPigeon.segments?.[segmentName] || DEFAULT_SEGMENT;
    };

    useEffect(() => {
        if (lottieRef.current) {
            let segment: AnimationSegment;
            switch (data.state) {
                case BalloonState.Falling:
                    segment = getSegment('bird');
                    break;
                case BalloonState.Exploded:
                    segment = getSegment('explosion');
                    break;
                case BalloonState.Deflated:
                    segment = getSegment('feathers');
                    break;
                default:
                    segment = DEFAULT_SEGMENT;
            }
            setCurrentSegment(segment);
            lottieRef.current.playSegments(segment, true);
        }
    }, [data.state]);

    if (!animationData) {
        return <div>Loading...</div>;
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: data.x,
                top: data.y,
                width: '200px',
                height: '200px',
                transition: data.state === BalloonState.Falling ? 'none' : 'opacity 1s',
                opacity: data.state === BalloonState.Falling ? 1 : 0,
                cursor: data.state === BalloonState.Falling ? 'pointer' : 'default',
            }}
            onClick={data.state === BalloonState.Falling ? onClick : undefined}
        >
            <Lottie
                ref={lottieRef}
                animationData={animationData}
                play={true}
                segments={currentSegment}
                loop={data.state === BalloonState.Falling}
                onComplete={handleComplete}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default BalloonGame;