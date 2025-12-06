import React from 'react';
import { InventoryItem } from '../types';

interface InventoryProps {
  items: InventoryItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ items }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 border-2 border-gray-600 rounded-lg p-2 flex gap-4 shadow-xl z-50">
      {items.map((item) => (
        <div key={item.id} className="group relative flex flex-col items-center justify-center w-16 h-16 bg-gray-800 rounded border border-gray-700 hover:border-yellow-500 hover:bg-gray-700 transition-colors cursor-pointer">
          <span className="text-3xl filter drop-shadow-md">{item.icon}</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black text-white text-xs p-2 rounded z-50 pointer-events-none">
            <p className="font-bold text-yellow-500">{item.type}</p>
            <p className="text-gray-300">{item.description}</p>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-gray-500 text-sm italic p-2">Empty Pockets...</div>
      )}
    </div>
  );
};
