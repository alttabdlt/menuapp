import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ id, checked, onCheckedChange }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
}