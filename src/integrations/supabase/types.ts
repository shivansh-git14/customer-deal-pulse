export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          active_status: boolean
          contact_id: number
          contact_name: string
          contact_score: number | null
          created_at: string
          customer_id: number
          is_dm: boolean
          registration_dt: string
          updated_at: string
        }
        Insert: {
          active_status?: boolean
          contact_id: number
          contact_name: string
          contact_score?: number | null
          created_at?: string
          customer_id: number
          is_dm?: boolean
          registration_dt: string
          updated_at?: string
        }
        Update: {
          active_status?: boolean
          contact_id?: number
          contact_name?: string
          contact_score?: number | null
          created_at?: string
          customer_id?: number
          is_dm?: boolean
          registration_dt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_stage_historical: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          customer_id: number
          historical_id: number
          life_cycle_stage: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          customer_id: number
          historical_id: number
          life_cycle_stage: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          customer_id?: number
          historical_id?: number
          life_cycle_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_stage_historical_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          assignment_dt: string
          created_at: string
          customer_id: number
          customer_industry: string
          customer_lifecycle_stage: string
          customer_name: string
          decision_maker: string
          first_participation_date: string | null
          updated_at: string
        }
        Insert: {
          assignment_dt: string
          created_at?: string
          customer_id: number
          customer_industry: string
          customer_lifecycle_stage: string
          customer_name: string
          decision_maker: string
          first_participation_date?: string | null
          updated_at?: string
        }
        Update: {
          assignment_dt?: string
          created_at?: string
          customer_id?: number
          customer_industry?: string
          customer_lifecycle_stage?: string
          customer_name?: string
          decision_maker?: string
          first_participation_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deal_historical: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          customer_id: number
          deal_id: number
          deal_stage: string
          deal_value: number | null
          historical_id: number
          sales_rep_id: number
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          customer_id: number
          deal_id: number
          deal_stage: string
          deal_value?: number | null
          historical_id: number
          sales_rep_id: number
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          customer_id?: number
          deal_id?: number
          deal_stage?: string
          deal_value?: number | null
          historical_id?: number
          sales_rep_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_historical_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "deal_historical_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals_current"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "deal_historical_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
      deals_current: {
        Row: {
          created_at: string
          customer_id: number
          deal_id: number
          deal_stage: string
          is_high_risk: string | null
          max_deal_potential: number | null
          participation_propensity: number | null
          sales_rep_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: number
          deal_id: number
          deal_stage: string
          is_high_risk?: string | null
          max_deal_potential?: number | null
          participation_propensity?: number | null
          sales_rep_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: number
          deal_id?: number
          deal_stage?: string
          is_high_risk?: string | null
          max_deal_potential?: number | null
          participation_propensity?: number | null
          sales_rep_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_current_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "deals_current_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
      events: {
        Row: {
          contact_id: number | null
          created_at: string
          customer_id: number | null
          event_id: number
          event_summary: string | null
          event_timestamp: string
          event_type: string
          sales_rep_id: number | null
          sales_rep_notes: string | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string
          customer_id?: number | null
          event_id: number
          event_summary?: string | null
          event_timestamp: string
          event_type: string
          sales_rep_id?: number | null
          sales_rep_notes?: string | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string
          customer_id?: number | null
          event_id?: number
          event_summary?: string | null
          event_timestamp?: string
          event_type?: string
          sales_rep_id?: number | null
          sales_rep_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "events_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
      revenue: {
        Row: {
          created_at: string
          customer_id: number
          participation_dt: string
          revenue: number
          revenue_category: string
          revenue_id: number
          sales_rep: number
        }
        Insert: {
          created_at?: string
          customer_id: number
          participation_dt: string
          revenue: number
          revenue_category: string
          revenue_id: number
          sales_rep: number
        }
        Update: {
          created_at?: string
          customer_id?: number
          participation_dt?: string
          revenue?: number
          revenue_category?: string
          revenue_id?: number
          sales_rep?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "revenue_sales_rep_fkey"
            columns: ["sales_rep"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
      sales_reps: {
        Row: {
          created_at: string
          hire_date: string
          is_active: boolean
          sales_rep_id: number
          sales_rep_manager_id: number | null
          sales_rep_name: string
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hire_date: string
          is_active?: boolean
          sales_rep_id: number
          sales_rep_manager_id?: number | null
          sales_rep_name: string
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hire_date?: string
          is_active?: boolean
          sales_rep_id?: number
          sales_rep_manager_id?: number | null
          sales_rep_name?: string
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_reps_sales_rep_manager_id_fkey"
            columns: ["sales_rep_manager_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
      targets: {
        Row: {
          created_at: string
          sales_rep_id: number
          target_id: number
          target_month: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          sales_rep_id: number
          target_id: number
          target_month: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          sales_rep_id?: number
          target_id?: number
          target_month?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "targets_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["sales_rep_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
