import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Info } from 'lucide-react';
import EmptyState from './EmptyState';

interface Announcement {
  id: number;
  facultyName: string;
  facultyAvatar?: string;
  content: string;
  timeAgo: string;
}

interface AnnouncementListProps {
  announcements: Announcement[];
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({ announcements }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 mt-8">
        <h3 className="text-xl font-bold text-slate-900">Announcements</h3>
        <Info className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <EmptyState message="No announcements yet." icon={<Info className="h-8 w-8 text-slate-400" />} />
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8 border border-gray-100">
                    <AvatarImage src={announcement.facultyAvatar} />
                    <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-bold">
                      {announcement.facultyName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-bold text-blue-700">{announcement.facultyName} • {announcement.timeAgo}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementList;
