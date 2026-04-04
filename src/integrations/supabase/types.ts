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
      chat_games: {
        Row: {
          created_at: string
          created_by: string
          game_state: Json
          game_type: string
          id: string
          match_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          game_state?: Json
          game_type: string
          id?: string
          match_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          game_state?: Json
          game_type?: string
          id?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenges: {
        Row: {
          completed: boolean
          created_at: string
          current_progress: number
          description: string
          ends_at: string
          goal_target: number
          goal_type: string
          id: string
          is_active: boolean
          reward_description: string
          reward_icon: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_progress?: number
          description: string
          ends_at: string
          goal_target: number
          goal_type: string
          id?: string
          is_active?: boolean
          reward_description: string
          reward_icon?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_progress?: number
          description?: string
          ends_at?: string
          goal_target?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          reward_description?: string
          reward_icon?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
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
      desire_options: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          requires_education_tier: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          requires_education_tier?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          requires_education_tier?: number | null
          updated_at?: string
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
      education_scenarios: {
        Row: {
          characters: Json
          created_at: string
          difficulty_level: number
          id: string
          image_url: string | null
          module_id: string
          prerequisite_badges: number[] | null
          scenario_slug: string
          scenes: Json
          title: string
          xp_reward: number
        }
        Insert: {
          characters?: Json
          created_at?: string
          difficulty_level?: number
          id?: string
          image_url?: string | null
          module_id: string
          prerequisite_badges?: number[] | null
          scenario_slug: string
          scenes?: Json
          title: string
          xp_reward?: number
        }
        Update: {
          characters?: Json
          created_at?: string
          difficulty_level?: number
          id?: string
          image_url?: string | null
          module_id?: string
          prerequisite_badges?: number[] | null
          scenario_slug?: string
          scenes?: Json
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "education_scenarios_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
        ]
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
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_minimum: number | null
          capacity: number
          created_at: string
          description: string | null
          event_date: string
          event_format: string | null
          event_tier: string
          host_name: string
          id: string
          image_url: string | null
          is_active: boolean
          location_address: string | null
          location_name: string | null
          max_waitlist: number | null
          price_cents: number
          requires_application: boolean | null
          stripe_price_id: string | null
          title: string
        }
        Insert: {
          age_minimum?: number | null
          capacity?: number
          created_at?: string
          description?: string | null
          event_date: string
          event_format?: string | null
          event_tier?: string
          host_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_address?: string | null
          location_name?: string | null
          max_waitlist?: number | null
          price_cents?: number
          requires_application?: boolean | null
          stripe_price_id?: string | null
          title: string
        }
        Update: {
          age_minimum?: number | null
          capacity?: number
          created_at?: string
          description?: string | null
          event_date?: string
          event_format?: string | null
          event_tier?: string
          host_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_address?: string | null
          location_name?: string | null
          max_waitlist?: number | null
          price_cents?: number
          requires_application?: boolean | null
          stripe_price_id?: string | null
          title?: string
        }
        Relationships: []
      }
      external_platform_links: {
        Row: {
          id: string
          linked_at: string | null
          platform: string
          platform_username: string
          status: string
          user_id: string
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          linked_at?: string | null
          platform?: string
          platform_username: string
          status?: string
          user_id: string
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          linked_at?: string | null
          platform?: string
          platform_username?: string
          status?: string
          user_id?: string
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_platform_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      face_verifications: {
        Row: {
          attempt_count: number
          created_at: string
          expires_at: string | null
          id: string
          pose_requested: string
          selfie_url: string | null
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          pose_requested: string
          selfie_url?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          pose_requested?: string
          selfie_url?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
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
      game_questions: {
        Row: {
          created_at: string
          game_type: string
          id: string
          options: Json | null
          question_text: string
        }
        Insert: {
          created_at?: string
          game_type: string
          id?: string
          options?: Json | null
          question_text: string
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          options?: Json | null
          question_text?: string
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_read_at: string
          muted: boolean
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          max_members: number
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_members?: number
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_members?: number
          name?: string
        }
        Relationships: []
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          is_flagged: boolean
          message_type: string
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_flagged?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_flagged?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
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
          reflection_prompt: string | null
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
          reflection_prompt?: string | null
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
          reflection_prompt?: string | null
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
      nps_responses: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          score: number
          trigger_event: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          score: number
          trigger_event: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          trigger_event?: string
          user_id?: string
        }
        Relationships: []
      }
      opening_moves: {
        Row: {
          category: string
          context_note: string | null
          created_at: string
          id: string
          is_active: boolean
          related_badge_slug: string | null
          requires_education_tier: number | null
          text: string
        }
        Insert: {
          category: string
          context_note?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          related_badge_slug?: string | null
          requires_education_tier?: number | null
          text: string
        }
        Update: {
          category?: string
          context_note?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          related_badge_slug?: string | null
          requires_education_tier?: number | null
          text?: string
        }
        Relationships: []
      }
      partner_links: {
        Row: {
          created_at: string
          id: string
          linked_at: string | null
          partner_id: string
          relationship_label: string | null
          requester_id: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_at?: string | null
          partner_id: string
          relationship_label?: string | null
          requester_id: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_at?: string | null
          partner_id?: string
          relationship_label?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      photo_performance: {
        Row: {
          id: string
          impressions: number
          left_swipes: number
          period_start: string
          photo_id: string
          right_swipes: number
          score: number
          super_likes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          impressions?: number
          left_swipes?: number
          period_start?: string
          photo_id: string
          right_swipes?: number
          score?: number
          super_likes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          impressions?: number
          left_swipes?: number
          period_start?: string
          photo_id?: string
          right_swipes?: number
          score?: number
          super_likes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_performance_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "user_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      private_photo_access: {
        Row: {
          granted_at: string
          grantee_id: string
          granter_id: string
          id: string
          revoked_at: string | null
        }
        Insert: {
          granted_at?: string
          grantee_id: string
          granter_id: string
          id?: string
          revoked_at?: string | null
        }
        Update: {
          granted_at?: string
          grantee_id?: string
          granter_id?: string
          id?: string
          revoked_at?: string | null
        }
        Relationships: []
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
      profile_chapters: {
        Row: {
          chapter_type: string
          content: string
          created_at: string
          custom_icon: string | null
          display_order: number
          id: string
          is_visible: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_type: string
          content: string
          created_at?: string
          custom_icon?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_type?: string
          content?: string
          created_at?: string
          custom_icon?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_prompts: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          prompt_question: string
          prompt_response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          prompt_question: string
          prompt_response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          prompt_question?: string
          prompt_response?: string
          updated_at?: string
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
          churn_status: string
          created_at: string
          desires: string[] | null
          display_name: string | null
          earned_frames: string[]
          enm_experience_level: string | null
          experience_level: string | null
          face_verified_at: string | null
          gender: string | null
          gender_preference: string | null
          height_cm: number | null
          id: string
          incognito_exceptions: string[] | null
          incognito_mode: boolean
          incognito_updated_at: string | null
          interests: string[] | null
          is_face_verified: boolean
          is_verified: boolean
          languages: string[] | null
          last_active_at: string | null
          last_daily_reward_date: string | null
          last_daily_spin: string | null
          last_winback_sent_at: string | null
          learning_level: number | null
          lifestyle: Json | null
          location: string | null
          looking_for: string | null
          mystery_reveals_date: string | null
          mystery_reveals_today: number
          name: string
          onboarding_completed: boolean | null
          onboarding_started_at: string | null
          photos: string[] | null
          profile_image: string | null
          pronouns: string | null
          relationship_status: string | null
          relationship_style: string | null
          selected_frame: string
          sexuality: string | null
          sti_last_tested: string | null
          sti_status: string | null
          tutorials_completed: string[]
          updated_at: string
          winback_attempts: number
          zodiac_sign: string | null
        }
        Insert: {
          age: number
          bdsm_test_screenshot?: string | null
          bdsm_test_url?: string | null
          bio?: string | null
          boundaries?: string | null
          churn_status?: string
          created_at?: string
          desires?: string[] | null
          display_name?: string | null
          earned_frames?: string[]
          enm_experience_level?: string | null
          experience_level?: string | null
          face_verified_at?: string | null
          gender?: string | null
          gender_preference?: string | null
          height_cm?: number | null
          id: string
          incognito_exceptions?: string[] | null
          incognito_mode?: boolean
          incognito_updated_at?: string | null
          interests?: string[] | null
          is_face_verified?: boolean
          is_verified?: boolean
          languages?: string[] | null
          last_active_at?: string | null
          last_daily_reward_date?: string | null
          last_daily_spin?: string | null
          last_winback_sent_at?: string | null
          learning_level?: number | null
          lifestyle?: Json | null
          location?: string | null
          looking_for?: string | null
          mystery_reveals_date?: string | null
          mystery_reveals_today?: number
          name: string
          onboarding_completed?: boolean | null
          onboarding_started_at?: string | null
          photos?: string[] | null
          profile_image?: string | null
          pronouns?: string | null
          relationship_status?: string | null
          relationship_style?: string | null
          selected_frame?: string
          sexuality?: string | null
          sti_last_tested?: string | null
          sti_status?: string | null
          tutorials_completed?: string[]
          updated_at?: string
          winback_attempts?: number
          zodiac_sign?: string | null
        }
        Update: {
          age?: number
          bdsm_test_screenshot?: string | null
          bdsm_test_url?: string | null
          bio?: string | null
          boundaries?: string | null
          churn_status?: string
          created_at?: string
          desires?: string[] | null
          display_name?: string | null
          earned_frames?: string[]
          enm_experience_level?: string | null
          experience_level?: string | null
          face_verified_at?: string | null
          gender?: string | null
          gender_preference?: string | null
          height_cm?: number | null
          id?: string
          incognito_exceptions?: string[] | null
          incognito_mode?: boolean
          incognito_updated_at?: string | null
          interests?: string[] | null
          is_face_verified?: boolean
          is_verified?: boolean
          languages?: string[] | null
          last_active_at?: string | null
          last_daily_reward_date?: string | null
          last_daily_spin?: string | null
          last_winback_sent_at?: string | null
          learning_level?: number | null
          lifestyle?: Json | null
          location?: string | null
          looking_for?: string | null
          mystery_reveals_date?: string | null
          mystery_reveals_today?: number
          name?: string
          onboarding_completed?: boolean | null
          onboarding_started_at?: string | null
          photos?: string[] | null
          profile_image?: string | null
          pronouns?: string | null
          relationship_status?: string | null
          relationship_style?: string | null
          selected_frame?: string
          sexuality?: string | null
          sti_last_tested?: string | null
          sti_status?: string | null
          tutorials_completed?: string[]
          updated_at?: string
          winback_attempts?: number
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
          correct_order: Json | null
          exercise_type: string
          explanation: string | null
          explanation_correct: string | null
          explanation_wrong: string | null
          id: string
          is_checkpoint: boolean | null
          match_pairs: Json | null
          module_id: string
          options: Json
          order_index: number
          position_in_section: number | null
          question: string
          section_id: string | null
        }
        Insert: {
          correct_answer: number
          correct_order?: Json | null
          exercise_type?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string
          is_checkpoint?: boolean | null
          match_pairs?: Json | null
          module_id: string
          options: Json
          order_index?: number
          position_in_section?: number | null
          question: string
          section_id?: string | null
        }
        Update: {
          correct_answer?: number
          correct_order?: Json | null
          exercise_type?: string
          explanation?: string | null
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string
          is_checkpoint?: boolean | null
          match_pairs?: Json | null
          module_id?: string
          options?: Json
          order_index?: number
          position_in_section?: number | null
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
      sprint_participants: {
        Row: {
          demotion_zone: boolean
          id: string
          joined_at: string
          lessons_completed: number
          promotion_zone: boolean
          rank: number | null
          scenarios_completed: number
          sprint_id: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          demotion_zone?: boolean
          id?: string
          joined_at?: string
          lessons_completed?: number
          promotion_zone?: boolean
          rank?: number | null
          scenarios_completed?: number
          sprint_id: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          demotion_zone?: boolean
          id?: string
          joined_at?: string
          lessons_completed?: number
          promotion_zone?: boolean
          rank?: number | null
          scenarios_completed?: number
          sprint_id?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "sprint_participants_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "weekly_sprints"
            referencedColumns: ["id"]
          },
        ]
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
          is_permanent: boolean
          pass_count: number
          swiped_id: string
          swiper_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          is_permanent?: boolean
          pass_count?: number
          swiped_id: string
          swiper_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          is_permanent?: boolean
          pass_count?: number
          swiped_id?: string
          swiper_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_astrology: {
        Row: {
          created_at: string
          id: string
          moon_sign: string | null
          rising_sign: string | null
          show_on_profile: boolean
          sun_sign: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moon_sign?: string | null
          rising_sign?: string | null
          show_on_profile?: boolean
          sun_sign?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moon_sign?: string | null
          rising_sign?: string | null
          show_on_profile?: boolean
          sun_sign?: string | null
          updated_at?: string
          user_id?: string
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
      user_desires: {
        Row: {
          created_at: string
          desire_id: string
          id: string
          priority: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          desire_id: string
          id?: string
          priority?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          desire_id?: string
          id?: string
          priority?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_desires_desire_id_fkey"
            columns: ["desire_id"]
            isOneToOne: false
            referencedRelation: "desire_options"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_stats: {
        Row: {
          boost_credits: number | null
          current_level: number
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          streak_freeze_available: boolean
          streak_freeze_used_at: string | null
          streak_freezes: number
          streak_recovered_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_credits?: number | null
          current_level?: number
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_freeze_used_at?: string | null
          streak_freezes?: number
          streak_recovered_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_credits?: number | null
          current_level?: number
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_freeze_used_at?: string | null
          streak_freezes?: number
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
      user_quiz_performance: {
        Row: {
          attempt_number: number
          created_at: string
          id: string
          is_correct: boolean
          module_id: string
          question_id: string
          time_taken_ms: number | null
          user_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          id?: string
          is_correct: boolean
          module_id: string
          question_id: string
          time_taken_ms?: number | null
          user_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          module_id?: string
          question_id?: string
          time_taken_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_performance_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_performance_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_performance_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reflections: {
        Row: {
          created_at: string | null
          id: string
          response_text: string
          section_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          response_text: string
          section_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          response_text?: string
          section_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reflections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "module_sections"
            referencedColumns: ["id"]
          },
        ]
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
      user_scenario_progress: {
        Row: {
          choices_made: Json
          completed: boolean
          completed_at: string | null
          created_at: string
          current_scene: string
          id: string
          max_score: number
          scenario_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          choices_made?: Json
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_scene?: string
          id?: string
          max_score?: number
          scenario_id: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          choices_made?: Json
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_scene?: string
          id?: string
          max_score?: number
          scenario_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scenario_progress_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "education_scenarios"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_sprints: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          league_tier: string
          max_participants: number
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          league_tier?: string
          max_participants?: number
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          league_tier?: string
          max_participants?: number
          week_end?: string
          week_start?: string
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
          explanation_correct: string | null
          explanation_wrong: string | null
          id: string | null
          is_checkpoint: boolean | null
          module_id: string | null
          options: Json | null
          order_index: number | null
          position_in_section: number | null
          question: string | null
          section_id: string | null
        }
        Insert: {
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string | null
          is_checkpoint?: boolean | null
          module_id?: string | null
          options?: Json | null
          order_index?: number | null
          position_in_section?: number | null
          question?: string | null
          section_id?: string | null
        }
        Update: {
          explanation_correct?: string | null
          explanation_wrong?: string | null
          id?: string | null
          is_checkpoint?: boolean | null
          module_id?: string | null
          options?: Json | null
          order_index?: number | null
          position_in_section?: number | null
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
      append_tutorial_completed: { Args: { _key: string }; Returns: undefined }
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
          is_recycled: boolean
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
          selected_frame: string
          zodiac_sign: string
        }[]
      }
      get_funnel_metrics: {
        Args: never
        Returns: {
          onboarded_users: number
          paid_subscribers: number
          total_users: number
          users_in_discovery: number
          users_with_badges: number
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
      get_success_metrics: { Args: never; Returns: Json }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_weekly_leaderboard: {
        Args: never
        Returns: {
          display_name: string
          rank: number
          sections_completed: number
          user_id: string
        }[]
      }
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
      record_pass: {
        Args: { _swiped_id: string; _swiper_id: string }
        Returns: Json
      }
      refresh_daily_super_likes: {
        Args: { _daily_limit?: number; _user_id: string }
        Returns: number
      }
      reset_discovery_feed: { Args: never; Returns: Json }
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
      track_photo_engagement: {
        Args: { _action: string; _photo_id: string; _photo_owner_id: string }
        Returns: undefined
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
