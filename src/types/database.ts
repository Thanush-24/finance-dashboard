// Mirrors the schema in supabase/2b_schema.sql. Hand-written rather than
// generated (`supabase gen types typescript`) since the CLI isn't linked to
// the project yet — keep this in sync manually until it is.
export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          type: "income" | "expense";
          description: string | null;
          date: string;
          created_at: string;
          is_recurring: boolean;
          recurring_parent_id: string | null;
          goal_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          type: "income" | "expense";
          description?: string | null;
          date?: string;
          created_at?: string;
          is_recurring?: boolean;
          recurring_parent_id?: string | null;
          goal_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          type?: "income" | "expense";
          description?: string | null;
          date?: string;
          created_at?: string;
          is_recurring?: boolean;
          recurring_parent_id?: string | null;
          goal_id?: string | null;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          monthly_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          target_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
