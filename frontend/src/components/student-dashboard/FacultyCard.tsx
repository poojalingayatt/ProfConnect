import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Faculty } from '@/types/faculty';
import { useNavigate } from 'react-router-dom';

interface FacultyCardProps {
  faculty: Faculty;
}

const FacultyCard: React.FC<FacultyCardProps> = ({ faculty }) => {
  const navigate = useNavigate();
  
  const getAvatarUrl = (f: Faculty) => {
    if (f.avatar) {
      if (f.avatar.startsWith('http')) return f.avatar;
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${baseUrl}${f.avatar}`;
    }
    return undefined;
  };

  const tags = faculty.facultyProfile?.specializations?.length 
    ? faculty.facultyProfile.specializations.slice(0, 2).map((s: any) => s.name)
    : ['General'];

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="flex gap-4 mb-4">
          <Avatar className="h-14 w-14 rounded-xl border border-gray-100 shadow-sm shrink-0">
            <AvatarImage src={getAvatarUrl(faculty)} className="object-cover rounded-xl" />
            <AvatarFallback className="rounded-xl font-bold bg-blue-50 text-blue-700">
              {faculty.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-lg truncate leading-tight">{faculty.name}</h4>
            <p className="text-sm font-semibold text-blue-600 truncate">{faculty.department || 'Department not set'}</p>
            {faculty.facultyProfile?.rating !== undefined && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-700">{faculty.facultyProfile.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-medium">({faculty.facultyProfile.reviewCount || 0} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, idx) => (
             <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
               {tag}
             </span>
          ))}
        </div>

        {/* Availability */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Available Slot</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">Check profile for slots</p>
        </div>

        {/* Button */}
        <Button 
          onClick={() => navigate('/student/faculty')}
          variant="outline" 
          className="w-full rounded-xl border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors mt-auto"
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default FacultyCard;
