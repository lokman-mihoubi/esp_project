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

// foncier.types.ts
export type FoncierType =
  | "promotion"
  | "investissement"
  | "logement"
  | "favoris";

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

  duac_file?: File | null;
  duac_file_bytes?: string | null;

  dccf_file?: File | null;
  dccf_file_bytes?: string | null;

  domaine_file?: File | null;
  domaine_file_bytes?: string | null;



  duac_file_url?: string | null;
  dccf_file_url?: string | null;
  domaine_file_url?: string | null;
  
  type?: FoncierType;
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
