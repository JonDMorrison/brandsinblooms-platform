export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          variables?: Json
          operationName?: string
          query?: string
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_details: string | null
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          site_id: string
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_details?: string | null
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          site_id: string
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_details?: string | null
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          site_id?: string
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_sessions: {
        Row: {
          admin_user_id: string
          allowed_actions: string[] | null
          created_at: string
          end_reason: string | null
          ended_at: string | null
          ended_by_admin_id: string | null
          expires_at: string
          id: string
          impersonated_user_id: string | null
          ip_address: unknown | null
          is_active: boolean
          last_used_at: string | null
          purpose: string | null
          restrictions: Json | null
          session_token: string
          session_token_hash: string
          site_id: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          allowed_actions?: string[] | null
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          ended_by_admin_id?: string | null
          expires_at: string
          id?: string
          impersonated_user_id?: string | null
          ip_address?: unknown | null
          is_active?: boolean
          last_used_at?: string | null
          purpose?: string | null
          restrictions?: Json | null
          session_token: string
          session_token_hash: string
          site_id: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          allowed_actions?: string[] | null
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          ended_by_admin_id?: string | null
          expires_at?: string
          id?: string
          impersonated_user_id?: string | null
          ip_address?: unknown | null
          is_active?: boolean
          last_used_at?: string | null
          purpose?: string | null
          restrictions?: Json | null
          session_token?: string
          session_token_hash?: string
          site_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          inquiry_type: string | null
          message: string
          name: string
          phone: string | null
          related_content_id: string | null
          related_product_id: string | null
          responded_at: string | null
          responded_by: string | null
          site_id: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string | null
          message: string
          name: string
          phone?: string | null
          related_content_id?: string | null
          related_product_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          site_id: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string | null
          message?: string
          name?: string
          phone?: string | null
          related_content_id?: string | null
          related_product_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          site_id?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_related_content_id_fkey"
            columns: ["related_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_inquiries_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_inquiries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          author_id: string | null
          content: Json
          content_type: string
          created_at: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_data: Json | null
          published_at: string | null
          site_id: string
          slug: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: Json
          content_type: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          site_id: string
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          site_id?: string
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_rows: number | null
          file_name: string | null
          file_type: string | null
          id: string
          imported_by: string | null
          site_id: string
          status: string | null
          successful_rows: number | null
          total_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          imported_by?: string | null
          site_id: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_rows?: number | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          imported_by?: string | null
          site_id?: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          site_id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          site_id: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          site_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          care_instructions: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          import_batch_id: string | null
          import_source: string | null
          in_stock: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          meta_description: string | null
          name: string
          price: number | null
          sale_price: number | null
          site_id: string
          sku: string | null
          slug: string | null
          stock_status: string | null
          subcategory: string | null
          unit_of_measure: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          care_instructions?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          import_batch_id?: string | null
          import_source?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          name: string
          price?: number | null
          sale_price?: number | null
          site_id: string
          sku?: string | null
          slug?: string | null
          stock_status?: string | null
          subcategory?: string | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          care_instructions?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          import_batch_id?: string | null
          import_source?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          meta_description?: string | null
          name?: string
          price?: number | null
          sale_price?: number | null
          site_id?: string
          sku?: string | null
          slug?: string | null
          stock_status?: string | null
          subcategory?: string | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      site_health_checks: {
        Row: {
          check_data: Json | null
          check_location: string | null
          check_type: string
          checked_at: string
          created_at: string
          cumulative_layout_shift: number | null
          dns_resolution_ms: number | null
          error_message: string | null
          first_contentful_paint_ms: number | null
          http_status_code: number | null
          id: string
          is_healthy: boolean | null
          largest_contentful_paint_ms: number | null
          page_load_time_ms: number | null
          response_time_ms: number | null
          site_id: string
          ssl_expiry_date: string | null
          status: string
          user_agent: string | null
          warning_message: string | null
        }
        Insert: {
          check_data?: Json | null
          check_location?: string | null
          check_type: string
          checked_at?: string
          created_at?: string
          cumulative_layout_shift?: number | null
          dns_resolution_ms?: number | null
          error_message?: string | null
          first_contentful_paint_ms?: number | null
          http_status_code?: number | null
          id?: string
          is_healthy?: boolean | null
          largest_contentful_paint_ms?: number | null
          page_load_time_ms?: number | null
          response_time_ms?: number | null
          site_id: string
          ssl_expiry_date?: string | null
          status?: string
          user_agent?: string | null
          warning_message?: string | null
        }
        Update: {
          check_data?: Json | null
          check_location?: string | null
          check_type?: string
          checked_at?: string
          created_at?: string
          cumulative_layout_shift?: number | null
          dns_resolution_ms?: number | null
          error_message?: string | null
          first_contentful_paint_ms?: number | null
          http_status_code?: number | null
          id?: string
          is_healthy?: boolean | null
          largest_contentful_paint_ms?: number | null
          page_load_time_ms?: number | null
          response_time_ms?: number | null
          site_id?: string
          ssl_expiry_date?: string | null
          status?: string
          user_agent?: string | null
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_health_checks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_memberships_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_metrics: {
        Row: {
          content_count: number | null
          created_at: string
          id: string
          inquiry_count: number | null
          metric_date: string
          page_views: number | null
          product_count: number | null
          site_id: string
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          content_count?: number | null
          created_at?: string
          id?: string
          inquiry_count?: number | null
          metric_date: string
          page_views?: number | null
          product_count?: number | null
          site_id: string
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          content_count?: number | null
          created_at?: string
          id?: string
          inquiry_count?: number | null
          metric_date?: string
          page_views?: number | null
          product_count?: number | null
          site_id?: string
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_performance_metrics: {
        Row: {
          active_content_items: number | null
          avg_cumulative_layout_shift: number | null
          avg_first_contentful_paint_ms: number | null
          avg_first_input_delay_ms: number | null
          avg_largest_contentful_paint_ms: number | null
          avg_page_load_time_ms: number | null
          avg_search_position: number | null
          avg_server_response_time_ms: number | null
          avg_session_duration_seconds: number | null
          bandwidth_used_bytes: number | null
          bounce_rate: number | null
          browser_breakdown: Json | null
          cdn_cache_hit_rate: number | null
          contact_inquiries: number | null
          created_at: string
          device_breakdown: Json | null
          error_rate: number | null
          form_submissions: number | null
          id: string
          page_views: number | null
          period_end: string | null
          period_start: string | null
          period_type: string | null
          product_views: number | null
          raw_data: Json | null
          recorded_at: string
          search_clicks: number | null
          search_impressions: number | null
          sessions: number | null
          site_id: string
          storage_used_bytes: number | null
          top_countries: Json | null
          top_pages: Json | null
          top_referrers: Json | null
          total_content_items: number | null
          total_products: number | null
          total_requests: number | null
          unique_visitors: number | null
        }
        Insert: {
          active_content_items?: number | null
          avg_cumulative_layout_shift?: number | null
          avg_first_contentful_paint_ms?: number | null
          avg_first_input_delay_ms?: number | null
          avg_largest_contentful_paint_ms?: number | null
          avg_page_load_time_ms?: number | null
          avg_search_position?: number | null
          avg_server_response_time_ms?: number | null
          avg_session_duration_seconds?: number | null
          bandwidth_used_bytes?: number | null
          bounce_rate?: number | null
          browser_breakdown?: Json | null
          cdn_cache_hit_rate?: number | null
          contact_inquiries?: number | null
          created_at?: string
          device_breakdown?: Json | null
          error_rate?: number | null
          form_submissions?: number | null
          id?: string
          page_views?: number | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          product_views?: number | null
          raw_data?: Json | null
          recorded_at?: string
          search_clicks?: number | null
          search_impressions?: number | null
          sessions?: number | null
          site_id: string
          storage_used_bytes?: number | null
          top_countries?: Json | null
          top_pages?: Json | null
          top_referrers?: Json | null
          total_content_items?: number | null
          total_products?: number | null
          total_requests?: number | null
          unique_visitors?: number | null
        }
        Update: {
          active_content_items?: number | null
          avg_cumulative_layout_shift?: number | null
          avg_first_contentful_paint_ms?: number | null
          avg_first_input_delay_ms?: number | null
          avg_largest_contentful_paint_ms?: number | null
          avg_page_load_time_ms?: number | null
          avg_search_position?: number | null
          avg_server_response_time_ms?: number | null
          avg_session_duration_seconds?: number | null
          bandwidth_used_bytes?: number | null
          bounce_rate?: number | null
          browser_breakdown?: Json | null
          cdn_cache_hit_rate?: number | null
          contact_inquiries?: number | null
          created_at?: string
          device_breakdown?: Json | null
          error_rate?: number | null
          form_submissions?: number | null
          id?: string
          page_views?: number | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          product_views?: number | null
          raw_data?: Json | null
          recorded_at?: string
          search_clicks?: number | null
          search_impressions?: number | null
          sessions?: number | null
          site_id?: string
          storage_used_bytes?: number | null
          top_countries?: Json | null
          top_pages?: Json | null
          top_referrers?: Json | null
          total_content_items?: number | null
          total_products?: number | null
          total_requests?: number | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "site_performance_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          default_business_hours: Json | null
          default_content: Json | null
          default_products: Json | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          slug: string
          template_config: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_business_hours?: Json | null
          default_content?: Json | null
          default_products?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          slug: string
          template_config: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_business_hours?: Json | null
          default_content?: Json | null
          default_products?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          slug?: string
          template_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          admin_notes: string | null
          business_address: string | null
          business_email: string | null
          business_hours: Json | null
          business_name: string | null
          business_phone: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
          last_activity_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          primary_color: string | null
          subdomain: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          last_activity_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          primary_color?: string | null
          subdomain: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
          last_activity_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          primary_color?: string | null
          subdomain?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      taggings: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          taggable_id?: string
          taggable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          site_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          site_id: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          site_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_bulk_update_content: {
        Args: {
          bulk_updates: Json
          content_ids: string[]
          admin_notes?: string
        }
        Returns: Json
      }
      admin_bulk_update_products: {
        Args: {
          admin_notes?: string
          product_ids: string[]
          bulk_updates: Json
        }
        Returns: Json
      }
      admin_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      admin_get_content_analytics: {
        Args: { start_date?: string; site_uuid: string; end_date?: string }
        Returns: Json
      }
      admin_get_product_analytics: {
        Args: { end_date?: string; site_uuid: string; start_date?: string }
        Returns: Json
      }
      admin_get_site_content: {
        Args: {
          limit_count?: number
          site_uuid: string
          search_query?: string
          content_type_filter?: string
          status_filter?: string
          offset_count?: number
        }
        Returns: Json
      }
      admin_get_site_products: {
        Args: {
          category_filter?: string
          site_uuid: string
          search_query?: string
          status_filter?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: Json
      }
      admin_update_content: {
        Args: {
          content_updates: Json
          content_uuid: string
          admin_notes?: string
        }
        Returns: Json
      }
      admin_update_product: {
        Args: {
          product_uuid: string
          product_updates: Json
          admin_notes?: string
        }
        Returns: Json
      }
      admin_update_site_status: {
        Args: {
          site_uuid: string
          new_is_active?: boolean
          new_is_published?: boolean
          notes?: string
        }
        Returns: boolean
      }
      check_site_health: {
        Args: { site_uuid: string }
        Returns: Json
      }
      check_subdomain_availability: {
        Args: { subdomain_to_check: string }
        Returns: boolean
      }
      cleanup_expired_impersonation_sessions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_initial_admin: {
        Args: { target_user_id: string; admin_full_name?: string }
        Returns: boolean
      }
      create_site_with_template: {
        Args: {
          template_slug: string
          site_name: string
          site_subdomain: string
          owner_email: string
          business_info?: Json
        }
        Returns: Json
      }
      end_impersonation_session: {
        Args: {
          session_token_param?: string
          session_id_param?: string
          end_reason_param?: string
        }
        Returns: Json
      }
      generate_impersonation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_impersonation_sessions: {
        Args: {
          admin_user_uuid?: string
          site_uuid?: string
          limit_count?: number
        }
        Returns: Json
      }
      get_admin_action_logs: {
        Args: {
          limit_count?: number
          site_uuid?: string
          admin_user_uuid?: string
          action_type_filter?: string
          target_type_filter?: string
          start_date?: string
          end_date?: string
          offset_count?: number
        }
        Returns: Json
      }
      get_all_sites_with_stats: {
        Args: {
          search_query?: string
          status_filter?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: Json
      }
      get_impersonation_context: {
        Args: { token: string }
        Returns: Json
      }
      get_platform_analytics_summary: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_site_analytics: {
        Args: { period_type?: string; site_uuid: string; days_back?: number }
        Returns: Json
      }
      get_site_health_summary: {
        Args: { site_uuid: string; days_back?: number }
        Returns: Json
      }
      get_site_summary_stats: {
        Args: { site_uuid: string }
        Returns: Json
      }
      get_site_templates: {
        Args: { category_filter?: string; active_only?: boolean }
        Returns: Json
      }
      hash_impersonation_token: {
        Args: { token: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_type_val: string
          target_type_val: string
          target_uuid?: string
          old_vals?: Json
          new_vals?: Json
          details?: string
          user_agent_val?: string
          ip_addr?: unknown
          admin_id: string
          site_uuid: string
        }
        Returns: string
      }
      run_platform_health_checks: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      start_admin_impersonation: {
        Args: {
          ip_addr?: unknown
          site_uuid: string
          impersonated_user_uuid?: string
          purpose_text?: string
          duration_hours?: number
          allowed_actions_list?: string[]
          user_agent_val?: string
        }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

