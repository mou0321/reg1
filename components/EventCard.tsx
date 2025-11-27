
import React from 'react';
import { HousingEvent } from '../types';
import { Calendar, MapPin, Clock, Users, AlertCircle, FileText, Ban } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface EventCardProps {
  event: HousingEvent;
  onClick?: () => void;
  onViewRegistrations?: () => void; // New prop for admin action
  actionLabel?: string;
  isAdminView?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onClick, 
  onViewRegistrations,
  actionLabel = "立即報名",
  isAdminView = false
}) => {
  const { getEventStatus } = useApp();
  const { isFull, isExpired, isClosed, remainingSpots } = getEventStatus(event);
  
  const isDisabled = !isAdminView && (isFull || isExpired || isClosed);

  return (
    <div 
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 flex flex-col h-full ${isDisabled ? 'opacity-80 grayscale-[0.3]' : 'hover:shadow-xl hover:translate-y-[-2px]'}`}
    >
      <div className="relative h-48 w-full overflow-hidden group">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
           {!isAdminView && isClosed && (
            <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              暫停報名
            </span>
          )}
           {!isAdminView && !isClosed && isExpired && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              已截止
            </span>
          )}
          {!isAdminView && !isClosed && isFull && !isExpired && (
            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              已額滿
            </span>
          )}
          {!isFull && !isExpired && !isClosed && (
             <span className="bg-teal-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
             報名中
           </span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight">{event.title}</h3>
          
          <div className="space-y-2.5 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            {!isAdminView && (
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-teal-600 shrink-0" />
                <span className={`${remainingSpots < 5 ? 'text-orange-600 font-bold' : ''}`}>
                  剩餘名額: {remainingSpots} / {event.maxParticipants}
                </span>
              </div>
            )}
             <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>截止日期: {event.deadline}</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
            {event.description}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          {onClick && (
            <button 
              onClick={isDisabled ? undefined : onClick}
              disabled={isDisabled}
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2
                ${isDisabled 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg active:scale-95'
                }`}
            >
              {isAdminView ? actionLabel : (
                isClosed ? "暫停報名" : isExpired ? "報名已截止" : isFull ? "名額已滿" : actionLabel
              )}
            </button>
          )}

          {isAdminView && onViewRegistrations && (
            <button 
              onClick={onViewRegistrations}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
            >
              <FileText className="w-4 h-4" />
              查看報名者
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
