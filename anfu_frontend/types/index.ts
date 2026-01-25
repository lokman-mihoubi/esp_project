// types/index.ts

export type User = {
  id: number;
  username: string;
  email: string;
};

export type Usage = {
  id: number;
  name: string;
  parent_type?: string;
};

export type Foncier = {
  id: number;
  code: string;
  commune: string;
  description: string;

  wilaya?: string; 
  region?: string; 

  coordinates?: string;
  coordinates_dms?: string;   
  geojson_file?: File | string | null;

  usage?: string;

  // ✅ NEW FIELD
  mode?: "lecture" | "ecriture";

  progress_viabilisation?: number;
  surface?: number;                    // Surface en m²

  is_transmis?: boolean;               // Si transmis
  date_transmission?: string | null;   // Format: "YYYY-MM-DD"
  is_completed?: boolean; 

  POS?: string;
  Ref_Cadastre_Section?: string;
  Ref_Cadastre_Ilot?: string;

  is_published?: boolean;
  is_favorited?: boolean;

  // ✅ CONFIRMATION FIELDS (nullable)
  is_confirmed_by_duac?: boolean | null;
  is_confirmed_by_DCCF?: boolean | null;
  is_confirmed_by_Domaine?: boolean | null;
};


export type Document = {
  id: number;
  file: string;
  uploaded_at: string;
  file_name: string;
};

export type Task = {
  id: number;
  title: string;
  is_done: boolean;
  priority: 'low' | 'medium' | 'high';
  documents?: Document[];
  assigned_users?: User[];
};

export type StepType = {
  id: number;
  title: string;
  order: number;
  is_completed: boolean;
  tasks: Task[];
};
