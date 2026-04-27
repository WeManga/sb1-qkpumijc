export interface Database {
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          title: string;
          host_names: string;
          event_date: string;
          event_address: string;
          event_program: ProgramItem[];
          calligraphy_style: string;
          envelope_color: string;
          date_icon: string;
          main_photo_url: string | null;
          photo_url_2: string | null; // AJOUTÉ
          photo_url_3: string | null; // AJOUTÉ
          opening_type: string | null; // AJOUTÉ
          music_url: string | null;
          slug: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type?: string;
          title?: string;
          host_names?: string;
          event_date?: string;
          event_address?: string;
          event_program?: ProgramItem[];
          calligraphy_style?: string;
          envelope_color?: string;
          date_icon?: string;
          main_photo_url?: string | null;
          photo_url_2?: string | null; // AJOUTÉ
          photo_url_3?: string | null; // AJOUTÉ
          opening_type?: string | null; // AJOUTÉ
          music_url?: string | null;
          slug: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          title?: string;
          host_names?: string;
          event_date?: string;
          event_address?: string;
          event_program?: ProgramItem[];
          calligraphy_style?: string;
          envelope_color?: string;
          date_icon?: string;
          main_photo_url?: string | null;
          photo_url_2?: string | null; // AJOUTÉ
          photo_url_3?: string | null; // AJOUTÉ
          opening_type?: string | null; // AJOUTÉ
          music_url?: string | null;
          slug?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitation_photos: {
        Row: {
          id: string;
          invitation_id: string;
          photo_url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          photo_url: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          photo_url?: string;
          position?: number;
          created_at?: string;
        };
      };
      rsvp_responses: {
        Row: {
          id: string;
          invitation_id: string;
          guest_name: string;
          email: string | null;
          phone: string | null;
          attending: boolean;
          number_of_guests: number;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          guest_name: string;
          email?: string | null;
          phone?: string | null;
          attending: boolean;
          number_of_guests?: number;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          guest_name?: string;
          email?: string | null;
          phone?: string | null;
          attending?: boolean;
          number_of_guests?: number;
          message?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export interface ProgramItem {
  time: string;
  activity: string;
}