import React, { useState, useEffect, useRef } from 'react';
import { DotLottieCommonPlayer, DotLottiePlayer, PlayerEvents } from "@dotlottie/react-player";
import { Howl } from "howler";
import { Button, Modal } from "react-bootstrap";
import achievementSound from "./assets/sound/mixkit-achievement-bell-600.mp3";
import gachaMachineFirstFrame from "./assets/first_frame_image/gacha_machine_first_frame.jpg";
import gachaMachineLottie from "./assets/lottie/gacha_machine.lottie";

const GachaMachine: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [showStatic, setShowStatic] = useState(true);
    const [showLottie, setShowLottie] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showButton, setShowButton] = useState(true);
    const lottieRef = useRef<DotLottieCommonPlayer | null>(null);
    const soundRef = useRef<Howl | null>(null);

    useEffect(() => {
        soundRef.current = new Howl({
            src: [achievementSound],
        });
    }, []);

    const handleStart = () => {
        setShowButton(false);
        setShowLottie(true);
        if (lottieRef.current) {
            lottieRef.current.play();
        }
    };

    const handleLottieEvent = (event: PlayerEvents) => {
        if (event === PlayerEvents.Play) {
            setShowStatic(false);
        }
        if (event === PlayerEvents.Frame && lottieRef.current) {
            const animationInstance = lottieRef.current.getAnimationInstance();
            if (animationInstance) {
                const currentFrame = animationInstance.currentFrame;
                if (currentFrame >= 85) {
                    setShowModal(true);
                    if (soundRef.current) {
                        soundRef.current.play();
                    }
                }
            }
        }
    };

    const handleClaim = () => {
        setShowModal(false);
        setShowLottie(false);
        setShowStatic(true);
        setShowButton(true);
        if (lottieRef.current) {
            lottieRef.current.stop();
        }
    };

    return (
        <div className="gacha-machine">
            <h2>Gacha Machine</h2>

            <div className="gacha-container">
                {showStatic && (
                    <img
                        src={gachaMachineFirstFrame}
                        alt="Gacha Machine"
                        className="gacha-image"
                    />
                )}

                <DotLottiePlayer
                    ref={lottieRef}
                    src={gachaMachineLottie}
                    autoplay={false}
                    loop={false}
                    onEvent={handleLottieEvent}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: showLottie ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                    }}
                />
            </div>

            {showButton && (
                <Button onClick={handleStart} className="styled-button mt-3">
                    Get with 100 coins
                </Button>
            )}

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
                    max-width: 400px;
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
                .gacha-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: absolute;
                    top: 0;
                    left: 0;
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
                    transition: background-color 0.3s;
                }
                .styled-button:hover {
                    background-color: #45a049;
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