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
          query?: string
          variables?: Json
          extensions?: Json
          operationName?: string
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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          site_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          site_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          site_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
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
          search_vector: unknown | null
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
          search_vector?: unknown | null
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
          search_vector?: unknown | null
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
      content_backup_20250910: {
        Row: {
          author_id: string | null
          backup_created_at: string | null
          content: Json | null
          content_type: string | null
          created_at: string | null
          id: string | null
          is_featured: boolean | null
          is_published: boolean | null
          meta_data: Json | null
          published_at: string | null
          search_vector: unknown | null
          site_id: string | null
          slug: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          backup_created_at?: string | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          search_vector?: unknown | null
          site_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          backup_created_at?: string | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          search_vector?: unknown | null
          site_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_backup_20251009: {
        Row: {
          author_id: string | null
          backup_created_at: string | null
          content: Json | null
          content_type: string | null
          created_at: string | null
          id: string | null
          is_featured: boolean | null
          is_published: boolean | null
          meta_data: Json | null
          published_at: string | null
          search_vector: unknown | null
          site_id: string | null
          slug: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          backup_created_at?: string | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          search_vector?: unknown | null
          site_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          backup_created_at?: string | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_data?: Json | null
          published_at?: string | null
          search_vector?: unknown | null
          site_id?: string | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_migration_log: {
        Row: {
          backup_table_name: string
          created_at: string | null
          id: string
          migration_name: string
          migration_status: string | null
          record_count: number
        }
        Insert: {
          backup_table_name: string
          created_at?: string | null
          id?: string
          migration_name: string
          migration_status?: string | null
          record_count: number
        }
        Update: {
          backup_table_name?: string
          created_at?: string | null
          id?: string
          migration_name?: string
          migration_status?: string | null
          record_count?: number
        }
        Relationships: []
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
          cdn_url: string | null
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          migrated_at: string | null
          s3_bucket: string | null
          s3_key: string | null
          site_id: string
          storage_type: string | null
          upload_metadata: Json | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          cdn_url?: string | null
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          migrated_at?: string | null
          s3_bucket?: string | null
          s3_key?: string | null
          site_id: string
          storage_type?: string | null
          upload_metadata?: Json | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          cdn_url?: string | null
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          migrated_at?: string | null
          s3_bucket?: string | null
          s3_key?: string | null
          site_id?: string
          storage_type?: string | null
          upload_metadata?: Json | null
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
      migration_history: {
        Row: {
          checksum: string
          executed_at: string | null
          executed_by: string
          execution_time_ms: number | null
          filename: string
          id: string
        }
        Insert: {
          checksum: string
          executed_at?: string | null
          executed_by: string
          execution_time_ms?: number | null
          filename: string
          id?: string
        }
        Update: {
          checksum?: string
          executed_at?: string | null
          executed_by?: string
          execution_time_ms?: number | null
          filename?: string
          id?: string
        }
        Relationships: []
      }
      migration_locks: {
        Row: {
          id: string
          instance_id: string
          locked_at: string | null
          migration_batch: string
        }
        Insert: {
          id?: string
          instance_id: string
          locked_at?: string | null
          migration_batch: string
        }
        Update: {
          id?: string
          instance_id?: string
          locked_at?: string | null
          migration_batch?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          digest_frequency: string
          email_marketing: boolean
          email_updates: boolean
          id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_frequency?: string
          email_marketing?: boolean
          email_updates?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_frequency?: string
          email_marketing?: boolean
          email_updates?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          data: Json | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          priority: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          site_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category: string
          created_at?: string
          data?: Json | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          priority?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          site_id: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          priority?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          site_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notifications_with_user"
            referencedColumns: ["profile_user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          tax_amount: number | null
          total_price: number
          unit_price: number
          variant_info: Json | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          tax_amount?: number | null
          total_price: number
          unit_price: number
          variant_info?: Json | null
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          tax_amount?: number | null
          total_price?: number
          unit_price?: number
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_id: string
          payment_method: string
          processed_at: string | null
          provider_response: Json | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          payment_method: string
          processed_at?: string | null
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          processed_at?: string | null
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          currency: string | null
          customer_email: string
          customer_id: string
          customer_name: string
          delivered_at: string | null
          discount_amount: number | null
          id: string
          internal_notes: string | null
          items_count: number
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          refunded_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          site_id: string
          status: string
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email: string
          customer_id: string
          customer_name: string
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          items_count?: number
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          site_id: string
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string
          customer_id?: string
          customer_name?: string
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          items_count?: number
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          site_id?: string
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_cdn_url: string | null
          image_migrated_at: string | null
          image_s3_bucket: string | null
          image_s3_key: string | null
          image_storage_type: string | null
          image_url: string | null
          is_active: boolean | null
          level: number
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          path: string
          site_id: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_cdn_url?: string | null
          image_migrated_at?: string | null
          image_s3_bucket?: string | null
          image_s3_key?: string | null
          image_storage_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          level?: number
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          path: string
          site_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_cdn_url?: string | null
          image_migrated_at?: string | null
          image_s3_bucket?: string | null
          image_s3_key?: string | null
          image_storage_type?: string | null
          image_url?: string | null
          is_active?: boolean | null
          level?: number
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          path?: string
          site_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_product_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_categories_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_category_assignments: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_product_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_category_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_category_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          profile_id: string
          site_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          profile_id: string
          site_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          profile_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_favorites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          cdn_url: string | null
          created_at: string
          height: number | null
          id: string
          is_primary: boolean | null
          migrated_at: string | null
          position: number | null
          product_id: string
          s3_bucket: string | null
          s3_key: string | null
          site_id: string
          size_bytes: number | null
          storage_type: string | null
          updated_at: string
          upload_metadata: Json | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          cdn_url?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean | null
          migrated_at?: string | null
          position?: number | null
          product_id: string
          s3_bucket?: string | null
          s3_key?: string | null
          site_id: string
          size_bytes?: number | null
          storage_type?: string | null
          updated_at?: string
          upload_metadata?: Json | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          cdn_url?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean | null
          migrated_at?: string | null
          position?: number | null
          product_id?: string
          s3_bucket?: string | null
          s3_key?: string | null
          site_id?: string
          size_bytes?: number | null
          storage_type?: string | null
          updated_at?: string
          upload_metadata?: Json | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          product_id: string
          profile_id: string
          rating: number
          site_id: string
          title: string | null
          updated_at: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          product_id: string
          profile_id: string
          rating: number
          site_id: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          product_id?: string
          profile_id?: string
          rating?: number
          site_id?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_site_id_fkey"
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
          compare_at_price: number | null
          created_at: string
          description: string | null
          favorite_count: number | null
          id: string
          images: Json | null
          import_batch_id: string | null
          import_source: string | null
          in_stock: boolean | null
          inventory_count: number | null
          is_active: boolean | null
          is_featured: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          name: string
          price: number | null
          primary_category_id: string | null
          rating: number | null
          review_count: number | null
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
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          favorite_count?: number | null
          id?: string
          images?: Json | null
          import_batch_id?: string | null
          import_source?: string | null
          in_stock?: boolean | null
          inventory_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          name: string
          price?: number | null
          primary_category_id?: string | null
          rating?: number | null
          review_count?: number | null
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
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          favorite_count?: number | null
          id?: string
          images?: Json | null
          import_batch_id?: string | null
          import_source?: string | null
          in_stock?: boolean | null
          inventory_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          name?: string
          price?: number | null
          primary_category_id?: string | null
          rating?: number | null
          review_count?: number | null
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
            foreignKeyName: "products_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "category_product_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["category_id"]
          },
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
          avatar_cdn_url: string | null
          avatar_migrated_at: string | null
          avatar_s3_bucket: string | null
          avatar_s3_key: string | null
          avatar_storage_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_cdn_url?: string | null
          avatar_migrated_at?: string | null
          avatar_s3_bucket?: string | null
          avatar_s3_key?: string | null
          avatar_storage_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_cdn_url?: string | null
          avatar_migrated_at?: string | null
          avatar_s3_bucket?: string | null
          avatar_s3_key?: string | null
          avatar_storage_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      site_generation_jobs: {
        Row: {
          business_info: Json
          completed_at: string | null
          cost_cents: number
          created_at: string
          error_code: string | null
          error_message: string | null
          generated_data: Json | null
          id: string
          progress: number
          site_id: string | null
          status: string
          token_usage: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_info: Json
          completed_at?: string | null
          cost_cents?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          generated_data?: Json | null
          id?: string
          progress?: number
          site_id?: string | null
          status: string
          token_usage?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_info?: Json
          completed_at?: string | null
          cost_cents?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          generated_data?: Json | null
          id?: string
          progress?: number
          site_id?: string | null
          status?: string
          token_usage?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_generation_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "customer_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notifications_with_user"
            referencedColumns: ["profile_user_id"]
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
          metric_date?: string
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
          logo_cdn_url: string | null
          logo_migrated_at: string | null
          logo_s3_bucket: string | null
          logo_s3_key: string | null
          logo_storage_type: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          primary_color: string | null
          subdomain: string
          theme_settings: Json | null
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
          logo_cdn_url?: string | null
          logo_migrated_at?: string | null
          logo_s3_bucket?: string | null
          logo_s3_key?: string | null
          logo_storage_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          primary_color?: string | null
          subdomain: string
          theme_settings?: Json | null
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
          logo_cdn_url?: string | null
          logo_migrated_at?: string | null
          logo_s3_bucket?: string | null
          logo_s3_key?: string | null
          logo_storage_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          primary_color?: string | null
          subdomain?: string
          theme_settings?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      storage_migration_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: number
          new_storage_type: string
          new_url: string | null
          old_storage_type: string
          old_url: string | null
          record_id: string
          s3_key: string | null
          started_at: string | null
          status: string
          table_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          new_storage_type: string
          new_url?: string | null
          old_storage_type: string
          old_url?: string | null
          record_id: string
          s3_key?: string | null
          started_at?: string | null
          status?: string
          table_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          new_storage_type?: string
          new_url?: string | null
          old_storage_type?: string
          old_url?: string | null
          record_id?: string
          s3_key?: string | null
          started_at?: string | null
          status?: string
          table_name?: string
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
      category_product_counts: {
        Row: {
          active_product_count: number | null
          id: string | null
          is_active: boolean | null
          level: number | null
          name: string | null
          parent_id: string | null
          path: string | null
          product_count: number | null
          site_id: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_product_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_categories_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_stats: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string | null
          last_order_date: string | null
          name: string | null
          orders_count: number | null
          status: string | null
          total_spent: number | null
        }
        Relationships: []
      }
      notification_summary: {
        Row: {
          category: string | null
          high_priority_count: number | null
          latest_notification: string | null
          site_id: string | null
          total_count: number | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notifications_with_user"
            referencedColumns: ["profile_user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications_with_user: {
        Row: {
          action_url: string | null
          avatar_url: string | null
          category: string | null
          created_at: string | null
          data: Json | null
          email: string | null
          full_name: string | null
          id: string | null
          is_archived: boolean | null
          is_read: boolean | null
          message: string | null
          priority: string | null
          profile_user_id: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          site_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notifications_with_user"
            referencedColumns: ["profile_user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_stats_by_site: {
        Row: {
          average_order_value: number | null
          cancelled_orders: number | null
          delivered_orders: number | null
          last_order_date: string | null
          orders_last_24h: number | null
          orders_last_30d: number | null
          orders_last_7d: number | null
          paid_orders: number | null
          paid_revenue: number | null
          pending_orders: number | null
          processing_orders: number | null
          refunded_orders: number | null
          shipped_orders: number | null
          site_id: string | null
          total_orders: number | null
          total_revenue: number | null
          unpaid_orders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_with_details: {
        Row: {
          billing_address: Json | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          customer_avatar_url: string | null
          customer_email: string | null
          customer_email_verified: string | null
          customer_full_name: string | null
          customer_id: string | null
          customer_name: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string | null
          internal_notes: string | null
          items_count: number | null
          latest_status: string | null
          notes: string | null
          order_number: string | null
          order_state: string | null
          payment_method: string | null
          payment_status: string | null
          refunded_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          site_domain: string | null
          site_id: string | null
          site_name: string | null
          status: string | null
          status_changes_count: number | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          total_items: number | null
          unique_items_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories_expanded: {
        Row: {
          category_id: string | null
          category_name: string | null
          category_path: string | null
          category_slug: string | null
          is_primary: boolean | null
          product_id: string | null
          product_name: string | null
          site_id: string | null
          sku: string | null
          sort_order: number | null
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
      unread_notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          custom_domain: string | null
          data: Json | null
          id: string | null
          is_archived: boolean | null
          is_read: boolean | null
          message: string | null
          priority: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          site_id: string | null
          site_name: string | null
          subdomain: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "notifications_with_user"
            referencedColumns: ["profile_user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_media_files_compatible: {
        Row: {
          alt_text: string | null
          cdn_url: string | null
          created_at: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string | null
          s3_key: string | null
          site_id: string | null
          storage_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          cdn_url?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: never
          id?: string | null
          s3_key?: string | null
          site_id?: string | null
          storage_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          cdn_url?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: never
          id?: string | null
          s3_key?: string | null
          site_id?: string | null
          storage_type?: string | null
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
      v_product_images_compatible: {
        Row: {
          alt_text: string | null
          caption: string | null
          cdn_url: string | null
          created_at: string | null
          id: string | null
          is_primary: boolean | null
          position: number | null
          product_id: string | null
          s3_key: string | null
          site_id: string | null
          storage_type: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          cdn_url?: string | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          position?: number | null
          product_id?: string | null
          s3_key?: string | null
          site_id?: string | null
          storage_type?: string | null
          updated_at?: string | null
          url?: never
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          cdn_url?: string | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          position?: number | null
          product_id?: string | null
          s3_key?: string | null
          site_id?: string | null
          storage_type?: string | null
          updated_at?: string | null
          url?: never
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_categories_expanded"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acquire_migration_lock: {
        Args: { p_migration_batch: string; p_instance_id: string }
        Returns: boolean
      }
      admin_bulk_update_content: {
        Args: {
          bulk_updates: Json
          admin_notes?: string
          content_ids: string[]
        }
        Returns: Json
      }
      admin_bulk_update_products: {
        Args: {
          product_ids: string[]
          bulk_updates: Json
          admin_notes?: string
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
        Args: { start_date?: string; site_uuid: string; end_date?: string }
        Returns: Json
      }
      admin_get_site_content: {
        Args: {
          site_uuid: string
          search_query?: string
          content_type_filter?: string
          status_filter?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: Json
      }
      admin_get_site_products: {
        Args: {
          search_query?: string
          limit_count?: number
          status_filter?: string
          site_uuid: string
          offset_count?: number
          category_filter?: string
        }
        Returns: Json
      }
      admin_update_content: {
        Args: {
          content_uuid: string
          content_updates: Json
          admin_notes?: string
        }
        Returns: Json
      }
      admin_update_product: {
        Args: {
          admin_notes?: string
          product_updates: Json
          product_uuid: string
        }
        Returns: Json
      }
      admin_update_site_status: {
        Args: {
          new_is_published?: boolean
          site_uuid: string
          new_is_active?: boolean
          notes?: string
        }
        Returns: boolean
      }
      calculate_metric_trend: {
        Args: { current_value: number; previous_value: number }
        Returns: string
      }
      can_upload_product_image: {
        Args: { site_id_param: string; user_id_param: string }
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
      cleanup_old_generation_jobs: {
        Args: { days_to_keep?: number }
        Returns: {
          oldest_deletion_date: string
          deleted_count: number
        }[]
      }
      cleanup_temp_product_images: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_initial_admin: {
        Args: { admin_full_name?: string; target_user_id: string }
        Returns: boolean
      }
      create_plant_page_content: {
        Args: { layout_type?: string; page_type: string }
        Returns: Json
      }
      create_site_with_template: {
        Args: {
          site_subdomain: string
          site_name: string
          template_slug: string
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
      exec_sql: {
        Args: { sql: string }
        Returns: string
      }
      generate_impersonation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: { site_prefix?: string }
        Returns: string
      }
      generate_s3_key: {
        Args: {
          filename: string
          resource_type: string
          resource_id: string
          site_id: string
        }
        Returns: string
      }
      generate_unique_slug: {
        Args: { p_name: string; p_exclude_id?: string; p_site_id: string }
        Returns: string
      }
      get_active_impersonation_sessions: {
        Args: {
          limit_count?: number
          admin_user_uuid?: string
          site_uuid?: string
        }
        Returns: Json
      }
      get_admin_action_logs: {
        Args: {
          site_uuid?: string
          admin_user_uuid?: string
          action_type_filter?: string
          target_type_filter?: string
          start_date?: string
          end_date?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: Json
      }
      get_all_sites_with_stats: {
        Args: {
          limit_count?: number
          status_filter?: string
          search_query?: string
          offset_count?: number
        }
        Returns: Json
      }
      get_category_ancestors: {
        Args: { p_category_id: string }
        Returns: {
          id: string
          parent_id: string
          name: string
          slug: string
          level: number
        }[]
      }
      get_category_tree: {
        Args: { p_site_id: string }
        Returns: {
          children_count: number
          name: string
          id: string
          parent_id: string
          slug: string
          description: string
          image_url: string
          icon: string
          color: string
          path: string
          level: number
          sort_order: number
          is_active: boolean
          product_count: number
        }[]
      }
      get_image_url: {
        Args: { storage_type: string; cdn_url: string; supabase_url: string }
        Returns: string
      }
      get_impersonation_context: {
        Args: { token: string }
        Returns: Json
      }
      get_job_statistics: {
        Args: { p_user_id?: string }
        Returns: {
          avg_completion_time_seconds: number
          total_cost_cents: number
          failed_jobs: number
          completed_jobs: number
          processing_jobs: number
          pending_jobs: number
          total_jobs: number
        }[]
      }
      get_migration_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pending_records: number
          table_name: string
          total_records: number
          migrated_records: number
          failed_records: number
          migration_percentage: number
        }[]
      }
      get_order_summary_stats: {
        Args: { p_site_id: string; p_date_range?: unknown }
        Returns: {
          total_orders: number
          delivered_orders: number
          shipped_orders: number
          processing_orders: number
          pending_orders: number
          conversion_rate: number
          average_order_value: number
          total_revenue: number
        }[]
      }
      get_platform_analytics_summary: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_product_stats: {
        Args: { p_site_id: string }
        Returns: {
          total_products: number
          active_products: number
          low_stock: number
          average_rating: number
          out_of_stock: number
          total_reviews: number
        }[]
      }
      get_site_analytics: {
        Args: { site_uuid: string; period_type?: string; days_back?: number }
        Returns: Json
      }
      get_site_health_summary: {
        Args: { days_back?: number; site_uuid: string }
        Returns: Json
      }
      get_site_summary_stats: {
        Args: { site_uuid: string }
        Returns: Json
      }
      get_site_templates: {
        Args: { active_only?: boolean; category_filter?: string }
        Returns: Json
      }
      get_unread_notification_count: {
        Args: { p_site_id: string }
        Returns: number
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
          ip_addr?: unknown
          user_agent_val?: string
          action_type_val: string
          admin_id: string
          site_uuid: string
          target_type_val: string
          target_uuid?: string
          old_vals?: Json
          new_vals?: Json
          details?: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { p_site_id: string }
        Returns: number
      }
      mark_image_migrated: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_s3_key: string
          p_s3_bucket: string
          p_cdn_url: string
        }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      migrate_existing_categories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reassign_category_products: {
        Args: { p_category_id: string; p_new_category_id?: string }
        Returns: number
      }
      release_migration_lock: {
        Args: { p_instance_id: string; p_migration_batch: string }
        Returns: boolean
      }
      rollback_image_migration: {
        Args: { p_table_name: string; p_record_id: string }
        Returns: boolean
      }
      run_platform_health_checks: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sanitize_slug: {
        Args: { input_text: string }
        Returns: string
      }
      search_content_global: {
        Args: {
          search_query: string
          site_id_param: string
          result_limit?: number
        }
        Returns: {
          is_published: boolean
          id: string
          title: string
          content_type: string
          slug: string
          excerpt: string
          relevance: number
          updated_at: string
        }[]
      }
      search_orders: {
        Args: {
          p_limit?: number
          p_site_id: string
          p_search_term?: string
          p_status?: string
          p_payment_status?: string
          p_offset?: number
        }
        Returns: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          status: string
          payment_status: string
          total_amount: number
          created_at: string
        }[]
      }
      start_admin_impersonation: {
        Args: {
          duration_hours?: number
          user_agent_val?: string
          ip_addr?: unknown
          site_uuid: string
          impersonated_user_uuid?: string
          purpose_text?: string
          allowed_actions_list?: string[]
        }
        Returns: Json
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_product_inventory: {
        Args: { p_change: number; p_product_id: string }
        Returns: {
          attributes: Json | null
          care_instructions: string | null
          category: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          favorite_count: number | null
          id: string
          images: Json | null
          import_batch_id: string | null
          import_source: string | null
          in_stock: boolean | null
          inventory_count: number | null
          is_active: boolean | null
          is_featured: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          name: string
          price: number | null
          primary_category_id: string | null
          rating: number | null
          review_count: number | null
          sale_price: number | null
          site_id: string
          sku: string | null
          slug: string | null
          stock_status: string | null
          subcategory: string | null
          unit_of_measure: string | null
          updated_at: string
        }
      }
      user_has_site_access: {
        Args: { p_site_id: string; p_role?: string }
        Returns: boolean
      }
      validate_plant_content: {
        Args: { content_data: Json }
        Returns: boolean
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

