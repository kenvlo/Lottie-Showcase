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
import threeStarsLottie from './assets/lottie/three_stars.json';
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
    },
    threeStars: {
        // path: './assets/lottie/three_stars.json',
        path: threeStarsLottie
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
    const [showStars, setShowStars] = useState(false);
    const [playStars, setPlayStars] = useState(false);
    const cardAnimationTimeout = useRef<number | null>(null);
    const starsLottieRef = useRef<AnimationItem | null>(null);

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

        // Reset stars animation states
        setShowStars(false);
        setPlayStars(false);

        // Set a timeout to show the stars after the card animation
        cardAnimationTimeout.current = setTimeout(() => {
            setShowStars(true);
            setPlayStars(true);
        }, 500); // 500ms matches the popUp animation duration
    };

    // Clear the timeout when the component unmounts
    useEffect(() => {
        return () => {
            if (cardAnimationTimeout.current !== null) {
                clearTimeout(cardAnimationTimeout.current);
            }
        };
    }, []);

    const handleClaimPrize = () => {
        setShowModal(false);
        setShowStars(false);
        setPlayStars(false);
        if (starsLottieRef.current) {
            starsLottieRef.current.goToAndStop(0, true);
        }
    };

    const handleStarsAnimationComplete = () => {
        setPlayStars(false);
        if (starsLottieRef.current) {
            starsLottieRef.current.goToAndStop(starsLottieRef.current.totalFrames - 1, true);
        }
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
                    <Button onClick={startGame} className="styled-button start-button">
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

            <Modal show={showModal} onHide={handleClaimPrize} centered keyboard={false}>
                <Modal.Body className="p-0">
                    <div className="card-container" onClick={(e) => e.stopPropagation()}>
                        <div className="custom-card">
                            <div className="card__face">
                                <h2>Congratulations!</h2>
                                <p>You've popped a balloon and won a prize!</p>
                                <Button onClick={handleClaimPrize} className="styled-button">Claim Prize</Button>
                            </div>
                        </div>
                        <div className={`stars-container ${showStars ? 'visible' : ''}`}>
                            <Lottie
                                ref={starsLottieRef}
                                animationData={lottieResources.threeStars.path}
                                play={playStars}
                                loop={false}
                                onComplete={handleStarsAnimationComplete}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="score">Score: {score}</div>

            <Button onClick={onBack} className="styled-button back-button">Back to Menu</Button>

            <Button onClick={toggleMute} className="styled-button mute-button">
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
                .styled-button {
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: background-color 0.3s, opacity 0.3s;
                }
                .styled-button:hover {
                    background-color: #45a049;
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
                    padding: 10px;
                }
                .modal-dialog {
                    width: 300px;
                }
                .modal-content {
                    background-color: transparent;
                    border: none;
                }
                .card-container {
                    perspective: 1000px;
                    width: 300px;
                    height: 400px;
                    position: relative;
                }
                .custom-card {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 0.6s;
                    margin: 0;
                    background-color: transparent;
                    border: none;
                    animation: popUp 0.5s ease-out;
                }
                .card__face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    padding: 20px;
                    background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
                }
                .stars-container {
                    position: absolute;
                    top: -50px;
                    left: 0;
                    width: 100%;
                    height: 100px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    transform: scale(2.5);
                }
                .stars-container.visible {
                    opacity: 1;
                }
                @keyframes popUp {
                    0% { transform: scale(0.1); }
                    100% { transform: scale(1); }
                }
                .modal-backdrop {
                    background-color: rgba(0, 0, 0, 0.5);
                }
                .modal-backdrop.show {
                    opacity: 1;
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