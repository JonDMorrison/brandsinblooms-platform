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
          operationName?: string
          variables?: Json
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
          role: string | null
          updated_at: string
          user_id: string
          user_type: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
          user_type: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          username?: string | null
        }
        Relationships: []
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
        ]
      }
      sites: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_hours: Json | null
          business_name: string | null
          business_phone: string | null
          created_at: string
          custom_domain: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_published: boolean | null
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
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
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
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_published?: boolean | null
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
      admin_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_initial_admin: {
        Args: {
          target_user_id: string
          admin_full_name?: string
        }
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

// Type aliases for easier use
export type Site = Database['public']['Tables']['sites']['Row']
export type SiteInsert = Database['public']['Tables']['sites']['Insert']
export type SiteUpdate = Database['public']['Tables']['sites']['Update']

export type SiteMembership = Database['public']['Tables']['site_memberships']['Row']
export type SiteMembershipInsert = Database['public']['Tables']['site_memberships']['Insert']
export type SiteMembershipUpdate = Database['public']['Tables']['site_memberships']['Update']

export type Content = Database['public']['Tables']['content']['Row']
export type ContentInsert = Database['public']['Tables']['content']['Insert']
export type ContentUpdate = Database['public']['Tables']['content']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type Tagging = Database['public']['Tables']['taggings']['Row']
export type TaggingInsert = Database['public']['Tables']['taggings']['Insert']
export type TaggingUpdate = Database['public']['Tables']['taggings']['Update']

export type ContactInquiry = Database['public']['Tables']['contact_inquiries']['Row']
export type ContactInquiryInsert = Database['public']['Tables']['contact_inquiries']['Insert']
export type ContactInquiryUpdate = Database['public']['Tables']['contact_inquiries']['Update']

export type MediaFile = Database['public']['Tables']['media_files']['Row']
export type MediaFileInsert = Database['public']['Tables']['media_files']['Insert']
export type MediaFileUpdate = Database['public']['Tables']['media_files']['Update']

export type ImportBatch = Database['public']['Tables']['import_batches']['Row']
export type ImportBatchInsert = Database['public']['Tables']['import_batches']['Insert']
export type ImportBatchUpdate = Database['public']['Tables']['import_batches']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Enum types (these would be defined if enums existed)
export type UserType = 'admin' | 'site_owner' | 'customer'
export type SiteMembershipRole = 'owner' | 'editor' | 'viewer'
export type ContentType = 'page' | 'blog_post' | 'event'
export type FileType = 'image' | 'video' | 'document'
export type InquiryStatus = 'new' | 'read' | 'responded'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
export type TaggableType = 'content' | 'product'

// Extended types with relationships
export type SiteWithMemberships = Site & {
  memberships?: SiteMembership[]
}

export type SiteWithContent = Site & {
  content?: Content[]
}

export type SiteWithProducts = Site & {
  products?: Product[]
}

export type ContentWithAuthor = Content & {
  author?: Profile
}

export type ProductWithTags = Product & {
  tags?: Tag[]
}

