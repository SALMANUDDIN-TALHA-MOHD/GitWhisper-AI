export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          provider: string | null
          free_used: number
          total_logins: number
          created_at: string
          last_seen: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          free_used?: number
          total_logins?: number
          created_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          free_used?: number
          total_logins?: number
          created_at?: string
          last_seen?: string
        }
      }
      repo_analyses: {
        Row: {
          id: string
          user_id: string | null
          owner: string
          repo_name: string
          repo_url: string | null
          language: string | null
          stars: number
          analysed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          owner: string
          repo_name: string
          repo_url?: string | null
          language?: string | null
          stars?: number
          analysed_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          owner?: string
          repo_name?: string
          repo_url?: string | null
          language?: string | null
          stars?: number
          analysed_at?: string
        }
      }
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          subject: string | null
          message: string
          submitted_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject?: string | null
          message: string
          submitted_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string | null
          message?: string
          submitted_at?: string
        }
      }
      login_history: {
        Row: {
          id: string
          user_id: string
          email: string
          provider: string
          logged_in_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          provider?: string
          logged_in_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          provider?: string
          logged_in_at?: string
        }
      }
    }
    Functions: {
      increment_logins: {
        Args: { uid: string }
        Returns: undefined
      }
    }
  }
}
