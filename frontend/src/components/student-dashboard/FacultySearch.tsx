import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FacultyCard from './FacultyCard';
import { Faculty } from '@/types/faculty';
import EmptyState from './EmptyState';

interface FacultySearchProps {
  facultyList: Faculty[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (val: string) => void;
  departments: string[];
  isLoading: boolean;
}

const FacultySearch: React.FC<FacultySearchProps> = ({
  facultyList,
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  departments,
  isLoading,
}) => {
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-2xl font-bold text-slate-900">Find Faculty</h3>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-xl sm:rounded-full border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or keyword..."
            className="pl-12 border-none shadow-none text-base h-12 focus-visible:ring-0 bg-transparent rounded-full"
          />
        </div>
        
        <div className="h-px sm:h-8 w-full sm:w-px bg-gray-100 sm:self-center" />

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-64 border-none shadow-none h-12 focus:ring-0 text-slate-700 font-medium">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-px sm:h-8 w-full sm:w-px bg-gray-100 sm:self-center" />

        <Select disabled>
           <SelectTrigger className="w-full sm:w-64 border-none shadow-none h-12 focus:ring-0 text-slate-700 font-medium opacity-70">
             <SelectValue placeholder="Specialization" />
           </SelectTrigger>
        </Select>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        ) : facultyList.length === 0 ? (
          <EmptyState message="No faculty found. Try adjusting filters." icon={<Search className="h-8 w-8 text-slate-400" />} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {facultyList.map((faculty) => (
              <FacultyCard key={faculty.id} faculty={faculty} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FacultySearch;
