import React, { useState } from 'react';
import lottie from 'lottie-web';

type ExportFormat = 'jpg' | 'png';

const LottieExport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lottieData, setLottieData] = useState<any>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    setLottieData(json);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    alert('Invalid Lottie JSON file');
                }
            };
            reader.readAsText(file);
        }
    };

    const exportLottieFirstFrame = () => {
        if (!lottieData) {
            alert('Please upload a Lottie JSON file first');
            return;
        }

        const container = document.createElement('div');
        document.body.appendChild(container);

        const anim = lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: lottieData
        });

        anim.addEventListener('DOMLoaded', () => {
            anim.goToAndStop(0, true);
            const svgContent = container.innerHTML;
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = lottieData.w;
                canvas.height = lottieData.h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    if (exportFormat === 'png') {
                        // Set the background to transparent for PNG
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    } else {
                        // Set white background for JPG
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL(`image/${exportFormat}`);
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `lottie_first_frame.${exportFormat}`;
                    link.click();
                }
                document.body.removeChild(container);
            };
            img.src = URL.createObjectURL(blob);
        });
    };

    return (
        <div className="lottie-export">
            <h2>Lottie First Frame Export</h2>
            <input type="file" accept=".json" onChange={handleFileUpload} />
            <div className="format-selection">
                <label>
                    <input
                        type="radio"
                        value="png"
                        checked={exportFormat === 'png'}
                        onChange={() => setExportFormat('png')}
                    />
                    PNG (Transparent Background)
                </label>
                <label>
                    <input
                        type="radio"
                        value="jpg"
                        checked={exportFormat === 'jpg'}
                        onChange={() => setExportFormat('jpg')}
                    />
                    JPG (White Background)
                </label>
            </div>
            <button className="styled-button" onClick={exportLottieFirstFrame}>Export First Frame</button>
            <button className="styled-button" onClick={onBack}>Back to Menu</button>
            <style>{`
        .lottie-export {
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
        input[type="file"] {
          margin-bottom: 20px;
        }
        .format-selection {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 20px;
          color: white;
        }
        .format-selection label {
          margin-bottom: 10px;
        }
      `}</style>
        </div>
    );
};

export default LottieExport;