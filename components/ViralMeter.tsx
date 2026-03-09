
import React from 'react';
import { SparklesIcon } from './Icons';

interface ViralMeterProps {
  score: number;
}

const ViralMeter: React.FC<ViralMeterProps> = ({ score }) => {
  let colorClass = 'text-gray-400 border-gray-400';
  let label = 'LOW';
  
  if (score > 85) {
    colorClass = 'text-brand-gold border-brand-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]';
    label = 'VIRAL';
  } else if (score > 60) {
    colorClass = 'text-whatsapp-bright border-whatsapp-bright';
    label = 'HIGH';
  } else if (score > 40) {
    colorClass = 'text-whatsapp-green border-whatsapp-green';
    label = 'MED';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center border-4 rounded-full w-16 h-16 bg-oak-brown/80 backdrop-blur-md ${colorClass} transition-all duration-500`}>
      <div className="flex items-center space-x-0.5">
         <span className="font-black text-xl">{score}</span>
      </div>
      <span className="text-[0.5rem] font-black tracking-widest uppercase">{label}</span>
      {score > 85 && (
        <div className="absolute -top-1 -right-1 text-brand-gold animate-bounce">
            <SparklesIcon />
        </div>
      )}
    </div>
  );
};

export default ViralMeter;
