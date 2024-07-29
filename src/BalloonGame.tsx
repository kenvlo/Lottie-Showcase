import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { DotLottiePlayer, DotLottieCommonPlayer, PlayerEvents } from "@dotlottie/react-player";
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import balloonPopSound from './assets/sound/balloon-pop.mp3';
import achievementSound from './assets/sound/mixkit-achievement-bell-600.mp3';
import backgroundImage from './assets/images/sky_background.jpg';
import balloonImage from './assets/first_frame_image/floating_balloon_first_frame.png';
import { BalloonState, BalloonData, LottieResource } from './types';

// Define a big JSON for managing Lottie resources
const lottieResources: Record<string, LottieResource> = {
    deflatedBalloon: {
        path: './assets/lottie/deflated_balloon.lottie',
        specificFrames: {
            start: 0,
            end: 30
        }
    },
    explodedBalloon: {
        path: './assets/lottie/exploded_balloon.lottie',
        specificFrames: {
            start: 0,
            end: 20
        }
    },
    // Add more Lottie resources as needed
};

interface BalloonGameProps {
    onBack: () => void;
}

const MAX_BALLOONS = 10;

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

    const spawnBalloons = useCallback(() => {
        if (!gameStarted) return;

        setBalloons(prevBalloons => {
            if (prevBalloons.length >= MAX_BALLOONS) {
                return prevBalloons;
            }

            const newBalloon: BalloonData = {
                id: Date.now(),
                x: Math.random() * (gameAreaRef.current?.clientWidth ?? 0),
                y: -50,
                speed: 1 + Math.random(),
                state: BalloonState.Falling,
            };

            return [...prevBalloons, newBalloon];
        });

        setTimeout(spawnBalloons, 1000 + Math.random() * 2000);
    }, [gameStarted]);

    useEffect(() => {
        if (gameStarted) {
            spawnBalloons();
        }
    }, [gameStarted, spawnBalloons]);

    const updateBalloonPositions = useCallback(() => {
        setBalloons(prevBalloons =>
            prevBalloons.filter(balloon => {
                if (balloon.state === BalloonState.Falling) {
                    const newY = balloon.y + balloon.speed;
                    if (newY > (gameAreaRef.current?.clientHeight ?? 0)) {
                        return false; // Remove balloon if it's off-screen
                    }
                    return { ...balloon, y: newY };
                }
                return balloon.state !== BalloonState.Exploded; // Remove exploded balloons
            })
        );

        animationFrameId.current = requestAnimationFrame(updateBalloonPositions);
    }, []);

    useEffect(() => {
        if (gameStarted) {
            animationFrameId.current = requestAnimationFrame(updateBalloonPositions);
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
              font-size: 24px;
            }
          `}</style>
        </div>
    );
};

interface BalloonProps {
    data: BalloonData;
    onClick: () => void;
}

const Balloon: React.FC<BalloonProps> = React.memo(({ data, onClick }) => {
    const lottieRef = useRef<DotLottieCommonPlayer>(null);

    const handleLottieEvent = (event: PlayerEvents) => {
        if (event === PlayerEvents.Complete) {
            // Remove the balloon from the game area
        }
    };

    if (data.state === BalloonState.Falling) {
        return (
            <img
                src={balloonImage}
                alt="Balloon"
                className="balloon"
                style={{ left: data.x, top: data.y }}
                onClick={onClick}
            />
        );
    } else {
        const lottieResource = data.state === BalloonState.Deflated
            ? lottieResources.deflatedBalloon
            : lottieResources.explodedBalloon;

        return (
            <DotLottiePlayer
                ref={lottieRef}
                src={lottieResource.path}
                autoplay
                loop={false}
                onEvent={handleLottieEvent}
                style={{
                    position: 'absolute',
                    left: data.x,
                    top: data.y,
                    width: '50px',
                    height: '50px',
                }}
            />
        );
    }
});

export default BalloonGame;