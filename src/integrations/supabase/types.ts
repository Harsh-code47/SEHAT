export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string
          google_calendar_event_id: string | null
          google_meet_link: string | null
          id: string
          notes: string | null
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id: string
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bmi_records: {
        Row: {
          age: number
          bmi: number
          category: string
          created_at: string | null
          gender: string
          height: number
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          age: number
          bmi: number
          category: string
          created_at?: string | null
          gender: string
          height: number
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          age?: number
          bmi?: number
          category?: string
          created_at?: string | null
          gender?: string
          height?: number
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number
          created_at: string
          display_name: string | null
          experience_years: number
          id: string
          is_available: boolean
          rating: number | null
          specialty: string
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          display_name?: string | null
          experience_years?: number
          id?: string
          is_available?: boolean
          rating?: number | null
          specialty?: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          display_name?: string | null
          experience_years?: number
          id?: string
          is_available?: boolean
          rating?: number | null
          specialty?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_reminders: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          start_date: string
          times_of_day: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          start_date?: string
          times_of_day?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          start_date?: string
          times_of_day?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          phone: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          phone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          id: string
          reminder_id: string
          taken_at: string
          taken_date: string
          time_slot: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_id: string
          taken_at?: string
          taken_date?: string
          time_slot: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_id?: string
          taken_at?: string
          taken_date?: string
          time_slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medication_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      report_analyses: {
        Row: {
          abnormal_values: Json | null
          analysis_result: Json
          created_at: string | null
          file_path: string | null
          id: string
          report_type: string
          user_id: string
        }
        Insert: {
          abnormal_values?: Json | null
          analysis_result: Json
          created_at?: string | null
          file_path?: string | null
          id?: string
          report_type: string
          user_id: string
        }
        Update: {
          abnormal_values?: Json | null
          analysis_result?: Json
          created_at?: string | null
          file_path?: string | null
          id?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "doctor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "doctor"],
    },
  },
} as const
