import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import Lottie from 'react-lottie-player'
import { AnimationItem, AnimationSegment } from 'lottie-web';
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import balloonPopSound from './assets/sound/balloon-pop.mp3';
import achievementSound from './assets/sound/mixkit-achievement-bell-600.mp3';
import backgroundImage from './assets/images/sky_background.jpg';
import threeStarsLastFrame from './assets/frame_image/three_stars_last_frame.png';
import droppingCoinsLastFrame from './assets/frame_image/dropping_coins_last_frame.png';
import explodingPigeonLottie from './assets/lottie/exploding_pigeon.json';
import threeStarsLottie from './assets/lottie/three_stars.json';
import droppingCoinsLottie from './assets/lottie/dropping_coins.json';
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
        path: threeStarsLottie,
        staticFrame: threeStarsLastFrame
    },
    droppingCoins: {
        // path: './assets/lottie/dropping_coins.json'
        path: droppingCoinsLottie,
        speed: 2,
        segments: {
            droppingCoins: [79, 115]
        },
        staticFrame: droppingCoinsLastFrame
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
    const [showStaticStars, setShowStaticStars] = useState(false);
    const cardAnimationTimeout = useRef<number | null>(null);
    const starsLottieRef = useRef<AnimationItem | null>(null);
    const [showCoins, setShowCoins] = useState(false);
    const [playCoins, setPlayCoins] = useState(false);
    const [showStaticCoins, setShowStaticCoins] = useState(false);
    const coinsLottieRef = useRef<AnimationItem | null>(null);
    const coinAnimationFrameId = useRef<number | null>(null);
    const [coinReward, setCoinReward] = useState(0);
    const [coinCount, setCoinCount] = useState(0);
    const coinAnimationStartTimeRef = useRef<number | null>(null);

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

        // Generate random coin reward
        const newCoinReward = generateRandomCoinReward();
        setCoinReward(newCoinReward);

        // Reset states
        setShowStars(false);
        setPlayStars(false);
        setShowStaticStars(false);
        setShowCoins(false);
        setPlayCoins(false);
        setShowStaticCoins(false);
        setCoinCount(0);

        setShowModal(true);

        // Set a timeout to show the animations after the card animation
        cardAnimationTimeout.current = setTimeout(() => {
            setShowStars(true);
            setPlayStars(true);
            setShowCoins(true);
            setPlayCoins(true);
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

    const generateRandomCoinReward = useCallback(() => {
        return Math.floor(Math.random() * (2000 - 100 + 1)) + 100;
    }, []);

    const animateCoinCounter = useCallback(() => {
        const { droppingCoins } = lottieResources.droppingCoins.segments!;
        const [startFrame, endFrame] = droppingCoins;
        const totalFrames = endFrame - startFrame;
        const animationDuration = (totalFrames / 60) * 1000; // Assuming 60fps, convert to milliseconds

        // So, while the animationDuration calculation doesn't explicitly account for the speed:
        // animationDuration = (totalFrames / 60) * 1000; // Assuming 60fps, convert to milliseconds
        // It doesn't actually matter because:

        // The visual animation runs at 2x speed due to the Lottie component settings.
        // The coin counter animation is synchronized with the visual animation through requestAnimationFrame.
        // Both animations complete at the same time due to the onComplete handler.

        const updateCoinCounter = (timestamp: number) => {
            if (!coinAnimationStartTimeRef.current) {
                coinAnimationStartTimeRef.current = timestamp;
            }
            const elapsed = timestamp - coinAnimationStartTimeRef.current;
            const progress = Math.min(elapsed / animationDuration, 1);
            const newCoinCount = Math.floor(progress * coinReward);
            setCoinCount(newCoinCount);

            if (progress < 1) {
                coinAnimationFrameId.current = requestAnimationFrame(updateCoinCounter);
            } else {
                setCoinCount(coinReward);
                handleCoinsAnimationComplete();
            }
        };

        // Ensure we start from 0 on the first frame
        setCoinCount(0);
        coinAnimationFrameId.current = requestAnimationFrame(updateCoinCounter);
    }, [coinReward, setCoinCount]);

    useEffect(() => {
        if (showModal && playCoins) {
            // Reset the animation start time
            coinAnimationStartTimeRef.current = null;
            // Start the animation
            animateCoinCounter();
        }
    }, [showModal, playCoins, animateCoinCounter]);

    const handleClaimPrize = () => {
        setShowModal(false);
        setShowStars(false);
        setPlayStars(false);
        setShowStaticStars(false);
        setShowCoins(false);
        setPlayCoins(false);
        setShowStaticCoins(false);
        if (coinAnimationFrameId.current) {
            cancelAnimationFrame(coinAnimationFrameId.current);
        }
    };

    const handleStarsAnimationComplete = () => {
        setPlayStars(false);
        setShowStaticStars(true);
    };

    const handleCoinsAnimationComplete = () => {
        setPlayCoins(false);
        setShowStaticCoins(true);
        if (coinAnimationFrameId.current) {
            cancelAnimationFrame(coinAnimationFrameId.current);
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
                                <div className="prize-container">
                                    <div className={`coins-container ${showCoins ? 'visible' : ''}`}>
                                        <div className={`lottie-coins ${!showStaticCoins ? 'visible' : ''}`}>
                                            <Lottie
                                                ref={coinsLottieRef}
                                                animationData={lottieResources.droppingCoins.path}
                                                play={playCoins}
                                                loop={false}
                                                segments={lottieResources.droppingCoins.segments?.droppingCoins}
                                                speed={lottieResources.droppingCoins.speed}
                                                onComplete={handleCoinsAnimationComplete}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </div>
                                        <img
                                            className={`static-coins ${showStaticCoins ? 'visible' : ''}`}
                                            src={lottieResources.droppingCoins.staticFrame}
                                            alt="Dropping Coins"
                                        />
                                    </div>
                                    <div className="coin-counter">+{coinCount}</div>
                                </div>
                                <Button onClick={handleClaimPrize} className="styled-button claim-prize-btn">Claim Prize</Button>
                            </div>
                        </div>
                        <div className={`stars-container ${showStars ? 'visible' : ''}`}>
                            <div className={`lottie-stars ${!showStaticStars ? 'visible' : ''}`}>
                                <Lottie
                                    ref={starsLottieRef}
                                    animationData={lottieResources.threeStars.path}
                                    play={playStars}
                                    loop={false}
                                    onComplete={handleStarsAnimationComplete}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <img
                                className={`static-stars ${showStaticStars ? 'visible' : ''}`}
                                src={lottieResources.threeStars.staticFrame}
                                alt="Three Stars"
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
                .claim-prize-btn {
                    z-index: 2;
                }
                .stars-container {
                    position: absolute;
                    top: -50px;
                    left: 0;
                    width: 100%;
                    height: 100px;
                    pointer-events: none;
                    opacity: 0;
                    transform: scale(2.5);
                }
                .stars-container.visible {
                    opacity: 1;
                }
                .lottie-stars, .static-stars {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                }
                .lottie-stars.visible, .static-stars.visible {
                    opacity: 1;
                }
                .static-stars {
                    object-fit: contain;
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
                .prize-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                .coins-container {
                    width: 100px;
                    height: 100px;
                    position: relative;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    transform: scale(3);
                    z-index: 1;
                }
                .coins-container.visible {
                    opacity: 1;
                }
                .lottie-coins, .static-coins {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                }
                .lottie-coins.visible, .static-coins.visible {
                    opacity: 1;
                }
                .static-coins {
                    object-fit: contain;
                }
                .coin-counter {
                    font-size: 24px;
                    font-weight: bold;
                    margin-left: 20px;
                    color: #FFD700;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
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