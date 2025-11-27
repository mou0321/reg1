
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HousingEvent, Registration } from '../types';

interface AppContextType {
  events: HousingEvent[];
  registrations: Registration[];
  addEvent: (event: HousingEvent) => void;
  updateEvent: (id: string, updates: Partial<HousingEvent>) => void;
  addEventsBatch: (newEvents: HousingEvent[]) => void;
  deleteEvent: (id: string) => void;
  deleteEventsBatch: (ids: string[]) => void;
  registerUser: (eventId: string, formData: Record<string, string>) => Promise<void>;
  
  // Auth
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  // Helpers
  getEventStatus: (event: HousingEvent) => { isFull: boolean; isExpired: boolean; isClosed: boolean; remainingSpots: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAMPLE_EVENTS: HousingEvent[] = [
  {
    id: '1',
    title: '社區中秋聯歡晚會',
    date: '2023-09-29',
    time: '18:00 - 21:00',
    location: 'A棟 1F 交誼廳',
    description: '歡迎所有住戶參加，現場備有烤肉與茶點，請自備環保餐具。',
    imageUrl: 'https://picsum.photos/seed/bbq/600/400',
    deadline: '2023-09-25',
    maxParticipants: 50,
    isOpen: true,
    formFields: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'phone', label: '聯絡電話', type: 'tel', required: true },
      { name: 'email', label: '電子信箱', type: 'email', required: true },
      { name: 'dietary', label: '飲食習慣 (葷/素)', type: 'text', required: false }
    ]
  },
  {
    id: '2',
    title: '週末瑜珈工作坊',
    date: '2023-10-07',
    time: '09:00 - 11:00',
    location: 'B棟 頂樓花園',
    description: '放鬆身心，適合初學者的瑜珈課程，請穿著輕便服裝。',
    imageUrl: 'https://picsum.photos/seed/yoga/600/400',
    deadline: '2023-10-06',
    maxParticipants: 10,
    isOpen: true,
    formFields: [
       { name: 'name', label: '姓名', type: 'text', required: true },
       { name: 'phone', label: '聯絡電話', type: 'tel', required: true },
       { name: 'email', label: '電子信箱', type: 'email', required: true },
       { name: 'experience', label: '瑜珈經驗 (年)', type: 'number', required: false }
    ]
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from local storage or fallbacks
  const [events, setEvents] = useState<HousingEvent[]>(() => {
    const saved = localStorage.getItem('housing_events_v2');
    const parsed = saved ? JSON.parse(saved) : SAMPLE_EVENTS;
    // Ensure legacy data has isOpen property
    return parsed.map((e: any) => ({ ...e, isOpen: e.isOpen ?? true }));
  });

  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('housing_registrations_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdmin, setIsAdmin] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('housing_events_v2', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('housing_registrations_v2', JSON.stringify(registrations));
  }, [registrations]);

  const addEvent = (event: HousingEvent) => {
    setEvents(prev => [...prev, event]);
  };
  
  const updateEvent = (id: string, updates: Partial<HousingEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addEventsBatch = (newEvents: HousingEvent[]) => {
    setEvents(prev => [...prev, ...newEvents]);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const deleteEventsBatch = (ids: string[]) => {
    setEvents(prev => prev.filter(e => !ids.includes(e.id)));
  };

  const registerUser = async (eventId: string, formData: Record<string, string>) => {
    // Simulate network delay for email sending
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRegistration: Registration = {
      id: Math.random().toString(36).substr(2, 9),
      eventId,
      formData,
      timestamp: Date.now()
    };
    setRegistrations(prev => [newRegistration, ...prev]);
  };

  const loginAdmin = (password: string) => {
    if (password === 'admin') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => setIsAdmin(false);

  const getEventStatus = (event: HousingEvent) => {
    const count = registrations.filter(r => r.eventId === event.id).length;
    const isFull = count >= event.maxParticipants;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadlineDate = new Date(event.deadline);
    const isExpired = today > deadlineDate;

    // Manual close logic
    const isClosed = !event.isOpen;

    return {
      isFull,
      isExpired,
      isClosed,
      remainingSpots: Math.max(0, event.maxParticipants - count)
    };
  };

  return (
    <AppContext.Provider value={{ 
      events, 
      registrations, 
      addEvent,
      updateEvent,
      addEventsBatch, 
      deleteEvent,
      deleteEventsBatch,
      registerUser,
      isAdmin,
      loginAdmin,
      logoutAdmin,
      getEventStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
