import React, { useState } from 'react';
import lottie from 'lottie-web';

type ExportFormat = 'jpg' | 'png';
type FrameOption = 'first' | 'last' | 'custom';

const LottieExport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lottieData, setLottieData] = useState<any>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
    const [frameOption, setFrameOption] = useState<FrameOption>('first');
    const [customFrame, setCustomFrame] = useState<number>(1);

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

    const exportLottieFrame = () => {
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
            let frameToExport = 0;
            switch (frameOption) {
                case 'first':
                    frameToExport = 0;
                    break;
                case 'last':
                    frameToExport = anim.totalFrames - 1;
                    break;
                case 'custom':
                    frameToExport = Math.min(Math.max(customFrame - 1, 0), anim.totalFrames - 1);
                    break;
            }

            anim.goToAndStop(frameToExport, true);
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
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL(`image/${exportFormat}`);
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `lottie_frame_${frameToExport + 1}.${exportFormat}`;
                    link.click();
                }
                document.body.removeChild(container);
            };
            img.src = URL.createObjectURL(blob);
        });
    };

    return (
        <div className="lottie-export">
            <h2>Lottie Frame Export</h2>
            <input type="file" accept=".json" onChange={handleFileUpload} />
            <div className="export-options">
                <div className="format-selection">
                    <h3>Export Format</h3>
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
                <div className="frame-selection">
                    <h3>Frame Selection</h3>
                    <label>
                        <input
                            type="radio"
                            value="first"
                            checked={frameOption === 'first'}
                            onChange={() => setFrameOption('first')}
                        />
                        First Frame
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="last"
                            checked={frameOption === 'last'}
                            onChange={() => setFrameOption('last')}
                        />
                        Last Frame
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="custom"
                            checked={frameOption === 'custom'}
                            onChange={() => setFrameOption('custom')}
                        />
                        Custom Frame
                    </label>
                    {frameOption === 'custom' && (
                        <input
                            type="number"
                            min="1"
                            value={customFrame}
                            onChange={(e) => setCustomFrame(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    )}
                </div>
            </div>
            <button className="styled-button" onClick={exportLottieFrame}>Export Frame</button>
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
            color: white;
        }
        h2, h3 {
            margin-bottom: 15px;
        }
        input[type="file"] {
            margin-bottom: 20px;
        }
        .export-options {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 20px;
        }
        .format-selection, .frame-selection {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        label {
            margin-bottom: 10px;
        }
        input[type="number"] {
            width: 60px;
            margin-left: 10px;
        }
        .styled-button {
            margin-top: 10px;
        }
      `}</style>
        </div>
    );
};

export default LottieExport;