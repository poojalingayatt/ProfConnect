import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderGreetingProps {
  name: string;
  pendingRequests: number;
  appointmentsCount: number;
  isInOffice: boolean;
  onToggleOfficeOptions: (checked: boolean) => void;
}

const HeaderGreeting: React.FC<HeaderGreetingProps> = ({
  name,
  pendingRequests,
  appointmentsCount,
  isInOffice,
  onToggleOfficeOptions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Good morning, Dr. {name}
        </h1>
        <p className="text-blue-600 mt-2 font-medium">
          You have {pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'} and {appointmentsCount} upcoming {appointmentsCount === 1 ? 'appointment' : 'appointments'} today.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <Label htmlFor="office-mode" className="text-sm font-semibold text-slate-700 cursor-pointer">
          Currently in office
        </Label>
        <Switch
          id="office-mode"
          checked={isInOffice}
          onCheckedChange={onToggleOfficeOptions}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    </div>
  );
};

export default HeaderGreeting;
