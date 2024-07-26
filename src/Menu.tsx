import React from 'react';

interface MenuProps {
    onFeatureSelect: (feature: string) => void;
}

const Menu: React.FC<MenuProps> = ({ onFeatureSelect }) => {
    return (
        <nav className="menu">
            <h1>Lottie Showcase Menu</h1>
            <button className="styled-button" onClick={() => onFeatureSelect('/flip-card')}>Flip Card - Old Lottie Player (Current Choice)</button>
            <button className="styled-button" onClick={() => onFeatureSelect('/new-flip-card')}>Flip Card - New Lottie Player</button>
            <button className="styled-button" onClick={() => onFeatureSelect('/gacha-machine')}>Gacha Machine</button>
            <button className="styled-button" onClick={() => onFeatureSelect('/lottie-export')}>Lottie Export</button>
            <style>{`
        .menu {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 {
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
          margin: 10px 2px;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.3s;
          width: 200px;
        }
        .styled-button:hover {
          background-color: #45a049;
        }
      `}</style>
        </nav>
    );
};

export default Menu;