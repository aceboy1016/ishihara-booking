'use client';

import React from 'react';

interface StoreFilterProps {
  selectedStore: 'ebisu' | 'hanzoomon';
  setSelectedStore: (store: 'ebisu' | 'hanzoomon') => void;
}

const StoreFilter: React.FC<StoreFilterProps> = ({ selectedStore, setSelectedStore }) => {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4 bg-gray-100 p-2 rounded-lg">
      <button 
        onClick={() => setSelectedStore('ebisu')} 
        className={`px-4 py-2 text-sm font-medium rounded-md ${selectedStore === 'ebisu' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
        恵比寿
      </button>
      <button 
        onClick={() => setSelectedStore('hanzoomon')} 
        className={`px-4 py-2 text-sm font-medium rounded-md ${selectedStore === 'hanzoomon' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
        半蔵門
      </button>
    </div>
  );
};

export default StoreFilter;
