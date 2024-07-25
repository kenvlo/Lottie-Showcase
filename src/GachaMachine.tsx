import React from 'react';

const GachaMachine: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="gacha-machine">
            <h2>Gacha Machine Content</h2>
            {/* Add your Gacha Machine content here */}
            <button className="styled-button" onClick={onBack}>Back to Menu</button>
            <style>{`
        .gacha-machine {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h2 {
          color: white;
          margin-bottom: 20px;
        }
      `}</style>
        </div>
    );
};

export default GachaMachine;