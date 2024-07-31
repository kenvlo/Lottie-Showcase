import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import Lottie from 'react-lottie-player';
import { AnimationItem } from 'lottie-web';
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import fireworksAnimation from "./assets/lottie/fireworks.json";
import achievementSound from "./assets/sound/mixkit-achievement-bell-600.mp3";

interface PrizeRevealProps {
  onBack: () => void;
}

const PrizeReveal: React.FC<PrizeRevealProps> = ({ onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<Howl | null>(null);
  const lottieRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    soundRef.current = new Howl({
      src: [achievementSound],
      mute: isMuted,
    });
  }, [isMuted]);

  const handleReveal = () => setShowModal(true);

  const resetState = useCallback(() => {
    setShowModal(false);
    setIsFlipped(false);
    setShowFireworks(false);
    if (soundRef.current) {
      soundRef.current.stop();
    }
    if (lottieRef.current) {
      lottieRef.current.stop();
    }
  }, []);

  const handleClaim = () => {
    resetState();
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (soundRef.current) {
      soundRef.current.mute(!isMuted);
    }
  };

  const handleCardFlip = useCallback(() => {
    setIsFlipped(true);
    setShowFireworks(true);
    if (!isMuted && soundRef.current) {
      soundRef.current.play();
    }
  }, [isMuted]);

  // Add a delay before flipping the card
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        handleCardFlip();
      }, 500); // Adjust this delay as needed
      return () => clearTimeout(timer);
    }
  }, [showModal, handleCardFlip]);

  return (
    <div className="container">
      <div className="text-center">
        <h2 className="text-white mb-4">You've got a surprise!</h2>
        <Button onClick={handleReveal} className="styled-button me-2">
          Reveal Prize
        </Button>
        <Button onClick={toggleMute} className="styled-button">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </Button>
      </div>

      <Modal
        show={showModal}
        onHide={resetState}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="p-0">
          <div className="card-container">
            <div
              ref={cardRef}
              className={`custom-card ${isFlipped ? "is-flipped" : ""}`}
            >
              <div className="card__face card__face--back">
                <h2>?</h2>
              </div>
              <div className="card__face card__face--front">
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

      {showFireworks && (
        <div id="fireworks-container">
          <Lottie
            ref={lottieRef}
            animationData={fireworksAnimation}
            play
            loop={false}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1051,
            }}
          />
        </div>
      )}

      <button onClick={onBack} className="styled-button back-button">Back to Menu</button>

      <style>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
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

        .back-button {
          margin-top: 20px;
        }

        .modal-backdrop {
          z-index: 1050 !important;
        }

        .modal-dialog {
          z-index: 1052 !important;
          width: 300px !important;
        }

        .modal-content {
          background-color: transparent;
        }

        #fireworks-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1051 !important;
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
        }

        .custom-card.is-flipped {
          transform: rotateY(180deg);
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
        }

        .card__face--back {
          background: linear-gradient(
            45deg,
            #ff9a9e 0%,
            #fad0c4 99%,
            #fad0c4 100%
          );
        }

        .card__face--front {
          background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default PrizeReveal;