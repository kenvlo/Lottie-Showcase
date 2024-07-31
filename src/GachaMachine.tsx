import React, { useState, useEffect, useRef, useCallback, useDeferredValue, useTransition } from 'react';
import Lottie from 'react-lottie-player';
import { AnimationItem } from 'lottie-web';
import { Howl } from "howler";
import { Button, Modal } from "react-bootstrap";
import { Volume2, VolumeX } from "lucide-react";
import achievementSound from "./assets/sound/mixkit-achievement-bell-600.mp3";
import gachaMachineFirstFrame from "./assets/first_frame_image/gacha_machine_first_frame.jpg";
import gachaMachineLottie from "./assets/lottie/gacha_machine.json";

const GachaMachine: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [showStatic, setShowStatic] = useState(true);
    const [showLottie, setShowLottie] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showButton, setShowButton] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isLottieReady, setIsLottieReady] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const deferredShowLottie = useDeferredValue(showLottie);
    const [isPending, startTransition] = useTransition();
    const lottieRef = useRef<AnimationItem | null>(null);
    const soundRef = useRef<Howl | null>(null);
    const soundPlayedRef = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = gachaMachineFirstFrame;
        img.onload = () => setIsLoading(false);

        soundRef.current = new Howl({
            src: [achievementSound],
            onend: () => {
                soundPlayedRef.current = false;
            },
            mute: isMuted
        });

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (soundRef.current) {
                soundRef.current.unload();
            }
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
            }
            observer.disconnect();
        };
    }, [isMuted]);

    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.mute(isMuted);
        }
    }, [isMuted]);

    const checkFrame = useCallback(() => {
        if (lottieRef.current && isVisible) {
            const currentFrame = lottieRef.current.currentFrame;
            if (currentFrame >= 85 && !soundPlayedRef.current) {
                setShowModal(true);
                if (soundRef.current && !isMuted) {
                    soundRef.current.play();
                    soundPlayedRef.current = true;
                }
                if (animationFrameId.current !== null) {
                    cancelAnimationFrame(animationFrameId.current);
                    animationFrameId.current = null;
                }
            } else if (deferredShowLottie) {
                animationFrameId.current = requestAnimationFrame(checkFrame);
            }
        }
    }, [deferredShowLottie, isMuted, isVisible]);

    useEffect(() => {
        if (deferredShowLottie && isLottieReady && isVisible) {
            animationFrameId.current = requestAnimationFrame(checkFrame);
        } else {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        }

        return () => {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [deferredShowLottie, isLottieReady, isVisible, checkFrame]);

    const handleStart = () => {
        setShowButton(false);
        startTransition(() => {
            setShowLottie(true);
            setShowStatic(false);
        });
        soundPlayedRef.current = false;
    };

    const handleLottieLoad = useCallback(() => {
        setIsLottieReady(true);
    }, []);

    const handleClaim = () => {
        setShowModal(false);
        startTransition(() => {
            setShowLottie(false);
            setShowStatic(true);
            setShowButton(true);
        });
        soundPlayedRef.current = false;
        if (lottieRef.current) {
            lottieRef.current.stop();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="gacha-machine">
            <h2>Gacha Machine</h2>

            <div className="gacha-container" ref={containerRef}>
                {isLoading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        <img
                            src={gachaMachineFirstFrame}
                            alt="Gacha Machine"
                            className={`gacha-image ${showStatic ? 'visible' : ''}`}
                        />
                        <Lottie
                            ref={lottieRef}
                            animationData={gachaMachineLottie}
                            play={deferredShowLottie && isVisible}
                            loop={false}
                            onLoad={handleLottieLoad}
                            style={{ width: '100%', height: '100%' }}
                            className={`lottie-player ${showLottie ? 'visible' : ''}`}
                        />
                    </>
                )}
            </div>

            <div className="button-container">
                <Button
                    onClick={handleStart}
                    className={`styled-button mt-3 ${showButton ? '' : 'invisible'}`}
                    disabled={isLoading || isPending}
                >
                    Get with 100 coins
                </Button>
            </div>

            <Button onClick={toggleMute} className="styled-button mute-button">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </Button>

            <Modal
                show={showModal}
                onHide={handleClaim}
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Body className="p-0">
                    <div className="card-container">
                        <div className="custom-card">
                            <div className="card__face">
                                <h2>Congratulations!</h2>
                                <p>You've won a special prize!</p>
                                <Button variant="success" onClick={handleClaim} className="styled-button">
                                    Claim Prize
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <button onClick={onBack} className="styled-button back-button mt-3">Back to Menu</button>

            <style>{`
                .gacha-machine {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                    width: 100%;
                    width: 600px;
                    margin: 0 auto;
                }
                .gacha-container {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                .gacha-image, .lottie-player {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: absolute;
                    top: 0;
                    left: 0;
                    opacity: 0;
                }
                .gacha-image.visible, .lottie-player.visible {
                    opacity: 1;
                }
                .button-container {
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .loading {
                    color: white;
                    font-size: 18px;
                }
                h2 {
                    color: white;
                    margin-bottom: 20px;
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
                .styled-button.invisible {
                    opacity: 0;
                    pointer-events: none;
                }
                .mute-button {
                    position: absolute;
                    top: -70px;
                    right: 0;
                    padding: 10px;
                }
                .modal-dialog {
                    width: 300px;
                }
                .modal-content {
                    background-color: transparent;
                }
                .card-container {
                    perspective: 1000px;
                    width: 300px;
                    height: 400px;
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
                @keyframes popUp {
                    0% { transform: scale(0.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default GachaMachine;