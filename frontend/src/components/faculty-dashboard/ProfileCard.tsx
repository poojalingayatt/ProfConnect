import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileCardProps {
  name: string;
  role: string;
  department?: string;
  office?: string;
  avatar?: string;
  tags?: string[];
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  role,
  department = 'Department not set',
  office = 'Office not set',
  avatar,
  tags = ['AI Ethics', 'Neural Networks', 'Machine Learning'],
  onEditProfile,
}) => {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        <Avatar className="w-24 h-24 rounded-2xl mb-4 border border-gray-100 shadow-sm">
          <AvatarImage src={avatar} className="object-cover rounded-2xl" />
          <AvatarFallback className="rounded-2xl text-2xl font-semibold bg-blue-50 text-blue-600">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-slate-900">Dr. {name}</h2>
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
            {role.replace('_', ' ')}
          </Badge>
        </div>

        <p className="text-slate-600 font-medium text-sm mb-5">
          {department} <span className="text-slate-300 mx-1">|</span> {office}
        </p>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full cursor-default hover:bg-slate-200 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        )}

        <Button 
          onClick={onEditProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold transition-all duration-200"
        >
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
