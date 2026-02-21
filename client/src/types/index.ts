export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  category: 'personal' | 'business' | 'both';
  notes?: string;
  linkedin_url?: string;
  avatar_initials: string;
  avatar_color: string;
  strength: number;
  last_contact?: string;
  created_at: string;
  updated_at: string;
  x_pos: number;
  y_pos: number;
  tags: string[];
  metadata: Record<string, string>;
}

export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  strength: number;
  notes?: string;
  source_name?: string;
  target_name?: string;
  source_company?: string;
  target_company?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'opportunity' | 'reminder' | 'insight' | 'alert';
  title: string;
  message: string;
  contact_ids: string[];
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  action_label?: string;
  action_data?: string;
  created_at: string;
}

export interface ProcessResult {
  success: boolean;
  summary: string;
  contacts: (Contact & { isNew: boolean })[];
  relationships: Partial<Relationship>[];
  opportunities: Array<{
    title: string;
    description: string;
    contact_names: string[];
    priority: string;
    action_label?: string;
  }>;
  notifications_created: number;
}
