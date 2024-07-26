import React, { useState } from 'react';
import PrizeReveal from './PrizeReveal';
import Menu from './Menu';
import LottieExport from './LottieExport';
import GachaMachine from './GachaMachine';

const App: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState('/');

  const handleFeatureChange = (feature: string) => {
    setCurrentFeature(feature);
  };

  return (
    <div className="App">
      {currentFeature === '/' && (
        <Menu onFeatureSelect={handleFeatureChange} />
      )}
      {currentFeature === '/flip-card' && (
        <PrizeReveal onBack={() => handleFeatureChange('/')} />
      )}
      {currentFeature === '/gacha-machine' && (
        <GachaMachine onBack={() => handleFeatureChange('/')} />
      )}
      {currentFeature === '/lottie-export' && (
        <LottieExport onBack={() => handleFeatureChange('/')} />
      )}
      <style>{`
        .App {
          display: flex;
          justify-content: center;
          align-items: center;
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
      `}</style>
    </div>
  );
};

export default App;