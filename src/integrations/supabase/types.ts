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
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          completed: boolean
          created_at: string
          current_progress: number
          id: string
          target_value: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          challenge_date?: string
          challenge_type: string
          completed?: boolean
          created_at?: string
          current_progress?: number
          id?: string
          target_value?: number
          user_id: string
          xp_reward?: number
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          completed?: boolean
          created_at?: string
          current_progress?: number
          id?: string
          target_value?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_modules: {
        Row: {
          badge_number: number | null
          content: string
          created_at: string
          description: string
          estimated_minutes: number | null
          id: string
          is_optional: boolean | null
          is_required: boolean
          order_index: number
          prerequisite_badges: string[] | null
          slug: string
          tier: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          badge_number?: number | null
          content: string
          created_at?: string
          description: string
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean | null
          is_required?: boolean
          order_index?: number
          prerequisite_badges?: string[] | null
          slug: string
          tier?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          badge_number?: number | null
          content?: string
          created_at?: string
          description?: string
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean | null
          is_required?: boolean
          order_index?: number
          prerequisite_badges?: string[] | null
          slug?: string
          tier?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          purchased_at: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          event_date: string
          host_name: string
          id: string
          image_url: string | null
          is_active: boolean
          price_cents: number
          stripe_price_id: string | null
          title: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          event_date: string
          host_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_cents?: number
          stripe_price_id?: string | null
          title: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          event_date?: string
          host_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_cents?: number
          stripe_price_id?: string | null
          title?: string
        }
        Relationships: []
      }
      flagged_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      linked_profiles: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          status: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          status?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          status?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      module_sections: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          estimated_minutes: number | null
          id: string
          module_id: string
          section_number: number
          title: string
        }
        Insert: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          module_id: string
          section_number: number
          title: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          module_id?: string
          section_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_sections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_boosts: {
        Row: {
          activated_at: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          bdsm_test_screenshot: string | null
          bdsm_test_url: string | null
          bio: string | null
          boundaries: string | null
          created_at: string
          desires: string[] | null
          display_name: string | null
          experience_level: string | null
          gender: string | null
          gender_preference: string | null
          height_cm: number | null
          id: string
          interests: string[] | null
          is_verified: boolean
          languages: string[] | null
          lifestyle: Json | null
          location: string | null
          looking_for: string | null
          name: string
          onboarding_completed: boolean | null
          photos: string[] | null
          profile_image: string | null
          pronouns: string | null
          relationship_status: string | null
          relationship_style: string | null
          sexuality: string | null
          sti_last_tested: string | null
          sti_status: string | null
          updated_at: string
          zodiac_sign: string | null
        }
        Insert: {
          age: number
          bdsm_test_screenshot?: string | null
          bdsm_test_url?: string | null
          bio?: string | null
          boundaries?: string | null
          created_at?: string
          desires?: string[] | null
          display_name?: string | null
          experience_level?: string | null
          gender?: string | null
          gender_preference?: string | null
          height_cm?: number | null
          id: string
          interests?: string[] | null
          is_verified?: boolean
          languages?: string[] | null
          lifestyle?: Json | null
          location?: string | null
          looking_for?: string | null
          name: string
          onboarding_completed?: boolean | null
          photos?: string[] | null
          profile_image?: string | null
          pronouns?: string | null
          relationship_status?: string | null
          relationship_style?: string | null
          sexuality?: string | null
          sti_last_tested?: string | null
          sti_status?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Update: {
          age?: number
          bdsm_test_screenshot?: string | null
          bdsm_test_url?: string | null
          bio?: string | null
          boundaries?: string | null
          created_at?: string
          desires?: string[] | null
          display_name?: string | null
          experience_level?: string | null
          gender?: string | null
          gender_preference?: string | null
          height_cm?: number | null
          id?: string
          interests?: string[] | null
          is_verified?: boolean
          languages?: string[] | null
          lifestyle?: Json | null
          location?: string | null
          looking_for?: string | null
          name?: string
          onboarding_completed?: boolean | null
          photos?: string[] | null
          profile_image?: string | null
          pronouns?: string | null
          relationship_status?: string | null
          relationship_style?: string | null
          sexuality?: string | null
          sti_last_tested?: string | null
          sti_status?: string | null
          updated_at?: string
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          referred_subscribed: boolean
          reward_granted: boolean
          tier: string | null
          trial_days: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          referred_subscribed?: boolean
          reward_granted?: boolean
          tier?: string | null
          trial_days?: number
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          referred_subscribed?: boolean
          reward_granted?: boolean
          tier?: string | null
          trial_days?: number
          type?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          id: string
          module_id: string
          options: Json
          order_index: number
          question: string
          section_id: string | null
        }
        Insert: {
          correct_answer: number
          id?: string
          module_id: string
          options: Json
          order_index?: number
          question: string
          section_id?: string | null
        }
        Update: {
          correct_answer?: number
          id?: string
          module_id?: string
          options?: Json
          order_index?: number
          question?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "module_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          order_index: number
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          order_index?: number
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          order_index?: number
          title?: string
          url?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_like_balance: {
        Row: {
          balance: number
          last_daily_refresh: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          last_daily_refresh?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          last_daily_refresh?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_like_purchases: {
        Row: {
          id: string
          pack_size: number
          purchased_at: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          pack_size: number
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          pack_size?: number
          purchased_at?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      super_likes: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          attempt_count: number | null
          earned_at: string
          id: string
          last_attempt_at: string | null
          module_id: string
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          earned_at?: string
          id?: string
          last_attempt_at?: string | null
          module_id: string
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          earned_at?: string
          id?: string
          last_attempt_at?: string | null
          module_id?: string
          quiz_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_stats: {
        Row: {
          current_level: number
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          streak_freeze_available: boolean
          streak_recovered_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_recovered_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_recovered_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          expires_at: string
          id: string
          is_sharing: boolean
          latitude: number
          longitude: number
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string
          id?: string
          is_sharing?: boolean
          latitude: number
          longitude: number
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          is_sharing?: boolean
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string
          id: string
          moderation_reason: string | null
          moderation_status: string
          order_index: number
          photo_url: string
          storage_path: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: string
          order_index?: number
          photo_url: string
          storage_path: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: string
          order_index?: number
          photo_url?: string
          storage_path?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_section_progress: {
        Row: {
          completed: boolean | null
          id: string
          last_accessed: string | null
          section_id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_accessed?: string | null
          section_id: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_accessed?: string | null
          section_id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_section_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "module_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reviewed_at: string | null
          selfie_path: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          selfie_path: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          selfie_path?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      quiz_questions_public: {
        Row: {
          id: string | null
          module_id: string | null
          options: Json | null
          order_index: number | null
          question: string | null
          section_id: string | null
        }
        Insert: {
          id?: string | null
          module_id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
          section_id?: string | null
        }
        Update: {
          id?: string | null
          module_id?: string | null
          options?: Json | null
          order_index?: number | null
          question?: string | null
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "module_sections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_vip_boost: { Args: never; Returns: undefined }
      award_badge: {
        Args: { _module_id: string; _quiz_score: number }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _amount: number
          _source: string
          _source_id?: string
          _user_id: string
        }
        Returns: Json
      }
      check_match: { Args: { user1: string; user2: string }; Returns: string }
      decrement_super_like: { Args: { _user_id: string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_discovery_profiles: {
        Args: { _exclude_ids: string[] }
        Returns: {
          age: number
          bio: string
          display_name: string
          experience_level: string
          gender: string
          height_cm: number
          id: string
          interests: string[]
          is_verified: boolean
          languages: string[]
          location: string
          looking_for: string
          name: string
          photos: string[]
          profile_image: string
          pronouns: string
          relationship_status: string
          relationship_style: string
          zodiac_sign: string
        }[]
      }
      get_likers_for_user: {
        Args: { _user_id: string }
        Returns: {
          age: number
          bio: string
          id: string
          is_premium: boolean
          is_super_like: boolean
          liker_count: number
          location: string
          name: string
          profile_image: string
        }[]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          age: number
          bio: string
          display_name: string
          experience_level: string
          gender: string
          height_cm: number
          id: string
          interests: string[]
          is_verified: boolean
          languages: string[]
          location: string
          looking_for: string
          name: string
          onboarding_completed: boolean
          photos: string[]
          profile_image: string
          pronouns: string
          relationship_status: string
          relationship_style: string
          zodiac_sign: string
        }[]
      }
      get_sent_likes: {
        Args: { _user_id: string }
        Returns: {
          age: number
          id: string
          location: string
          name: string
          profile_image: string
          swiped_at: string
        }[]
      }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      grant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refresh_daily_super_likes: {
        Args: { _daily_limit?: number; _user_id: string }
        Returns: number
      }
      revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      submit_quiz: {
        Args: { _answers: Json; _module_id: string }
        Returns: Json
      }
      validate_quiz_answer: {
        Args: { _question_id: string; _selected_answer: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
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
      app_role: ["admin", "moderator", "user", "owner"],
    },
  },
} as const
