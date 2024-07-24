import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import { DotLottiePlayer, PlayerEvents } from "@dotlottie/react-player";
import { Howl } from "howler";
import { Volume2, VolumeX } from "lucide-react";
import fireworksAnimation from "./assets/fireworks.lottie";
import achievementSound from "./assets/mixkit-achievement-bell-600.mp3";

const PrizeReveal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<Howl | null>(null);
  const lottieRef = useRef<DotLottiePlayer>(null);

  useEffect(() => {
    soundRef.current = new Howl({
      src: [achievementSoaund],
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

  const handleLottieEvent = useCallback(
    (event: PlayerEvents) => {
      if (event === PlayerEvents.Play) {
        setIsFlipped(true);
        if (!isMuted && soundRef.current) {
          soundRef.current.play();
        }
      }
    },
    [isMuted],
  );

  return (
    <div className="container">
      <div className="text-center">
        <h2 className="text-white mb-4">You've got a surprise!</h2>
        <Button onClick={handleReveal} className="me-2">
          Reveal Prize
        </Button>
        <Button onClick={toggleMute} variant="outline-light">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </Button>
      </div>

      <Modal
        show={showModal}
        onHide={resetState}
        onEntering={() => setShowFireworks(true)}
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
                <Button variant="success" onClick={handleClaim}>
                  Claim Prize
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {showFireworks && (
        <div id="fireworks-container">
          <DotLottiePlayer
            ref={lottieRef}
            src={fireworksAnimation}
            autoplay
            loop={false}
            onEvent={handleLottieEvent}
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

      <style>{`
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
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
