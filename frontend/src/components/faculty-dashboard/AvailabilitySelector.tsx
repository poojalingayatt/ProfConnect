import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Ban } from 'lucide-react';

interface AvailabilitySelectorProps {
  onAddSlot: () => void;
  onBlockBreak: () => void;
}

const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({
  onAddSlot,
  onBlockBreak,
}) => {
  // Generate some dummy dates for UI visual representation
  const today = new Date();
  const days = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-900">Availability Management</h3>
        <div className="flex gap-2">
          <Button onClick={onAddSlot} size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-none border-none">
            <Plus className="mr-1.5 h-4 w-4" /> Add Slot
          </Button>
          <Button onClick={onBlockBreak} size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-none border-none">
            <Ban className="mr-1.5 h-4 w-4" /> Block Break
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {days.map((date, idx) => {
          const isSelected = idx === 0;
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          const dayNum = date.getDate();

          return (
            <div
              key={idx}
              className={`min-w-[70px] sm:min-w-[80px] flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600 shadow-md text-white' 
                  : 'bg-white border-gray-100 text-slate-500 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <span className={`text-xs font-bold mb-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {dayName}
              </span>
              <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailabilitySelector;
