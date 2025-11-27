
export interface FormField {
  name: string; // The key for the data (e.g., "dietary", "age")
  label: string; // Display label (e.g., "Dietary Restrictions")
  type: 'text' | 'tel' | 'email' | 'number' | 'select';
  required: boolean;
  options?: string[]; // For select inputs
}

export interface HousingEvent {
  id: string;
  title: string;
  date: string; // Event date YYYY-MM-DD
  time: string;
  location: string;
  imageUrl: string;
  description: string;
  
  // New features
  deadline: string; // Registration deadline YYYY-MM-DD
  maxParticipants: number;
  formFields: FormField[];
  isOpen: boolean; // Manual toggle for registration status
}

export interface Registration {
  id: string;
  eventId: string; // Single event link
  formData: Record<string, string>; // Dynamic form data (name, email, phone, etc.)
  timestamp: number;
}

export type ViewMode = 'USER' | 'ADMIN';
