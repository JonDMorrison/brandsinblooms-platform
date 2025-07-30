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
          user_type?: string
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
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sites: {
        Row: {
          id: string
          subdomain: string
          custom_domain: string | null
          name: string
          description: string | null
          logo_url: string | null
          primary_color: string | null
          business_name: string | null
          business_email: string | null
          business_phone: string | null
          business_address: string | null
          business_hours: Json | null
          latitude: number | null
          longitude: number | null
          timezone: string | null
          is_active: boolean | null
          is_published: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subdomain: string
          custom_domain?: string | null
          name: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          business_name?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_address?: string | null
          business_hours?: Json | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subdomain?: string
          custom_domain?: string | null
          name?: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          business_name?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_address?: string | null
          business_hours?: Json | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          is_active?: boolean | null
          is_published?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_memberships: {
        Row: {
          id: string
          user_id: string
          site_id: string
          role: string
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site_id: string
          role: string
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          site_id?: string
          role?: string
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_memberships_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
        ]
      }
      content: {
        Row: {
          id: string
          site_id: string
          author_id: string | null
          content_type: string
          title: string
          slug: string
          content: Json
          meta_data: Json | null
          is_published: boolean | null
          is_featured: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          site_id: string
          author_id?: string | null
          content_type: string
          title: string
          slug: string
          content: Json
          meta_data?: Json | null
          is_published?: boolean | null
          is_featured?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          site_id?: string
          author_id?: string | null
          content_type?: string
          title?: string
          slug?: string
          content?: Json
          meta_data?: Json | null
          is_published?: boolean | null
          is_featured?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          site_id: string
          sku: string | null
          name: string
          description: string | null
          care_instructions: string | null
          category: string | null
          subcategory: string | null
          price: number | null
          sale_price: number | null
          unit_of_measure: string | null
          is_active: boolean | null
          is_featured: boolean | null
          in_stock: boolean | null
          stock_status: string | null
          slug: string | null
          meta_description: string | null
          attributes: Json | null
          images: Json | null
          import_source: string | null
          import_batch_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          sku?: string | null
          name: string
          description?: string | null
          care_instructions?: string | null
          category?: string | null
          subcategory?: string | null
          price?: number | null
          sale_price?: number | null
          unit_of_measure?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          in_stock?: boolean | null
          stock_status?: string | null
          slug?: string | null
          meta_description?: string | null
          attributes?: Json | null
          images?: Json | null
          import_source?: string | null
          import_batch_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          sku?: string | null
          name?: string
          description?: string | null
          care_instructions?: string | null
          category?: string | null
          subcategory?: string | null
          price?: number | null
          sale_price?: number | null
          unit_of_measure?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          in_stock?: boolean | null
          stock_status?: string | null
          slug?: string | null
          meta_description?: string | null
          attributes?: Json | null
          images?: Json | null
          import_source?: string | null
          import_batch_id?: string | null
          created_at?: string
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
          {
            foreignKeyName: "products_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          site_id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
        ]
      }
      taggings: {
        Row: {
          id: string
          tag_id: string
          taggable_id: string
          taggable_type: string
          created_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          taggable_id: string
          taggable_type: string
          created_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          taggable_id?: string
          taggable_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_inquiries: {
        Row: {
          id: string
          site_id: string
          inquiry_type: string | null
          related_product_id: string | null
          related_content_id: string | null
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          status: string | null
          responded_at: string | null
          responded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          inquiry_type?: string | null
          related_product_id?: string | null
          related_content_id?: string | null
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          status?: string | null
          responded_at?: string | null
          responded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          inquiry_type?: string | null
          related_product_id?: string | null
          related_content_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          subject?: string | null
          message?: string
          status?: string | null
          responded_at?: string | null
          responded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
            foreignKeyName: "contact_inquiries_related_content_id_fkey"
            columns: ["related_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_inquiries_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      media_files: {
        Row: {
          id: string
          site_id: string
          uploaded_by: string | null
          file_name: string
          file_url: string
          file_type: string | null
          file_size_bytes: number | null
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          uploaded_by?: string | null
          file_name: string
          file_url: string
          file_type?: string | null
          file_size_bytes?: number | null
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          uploaded_by?: string | null
          file_name?: string
          file_url?: string
          file_type?: string | null
          file_size_bytes?: number | null
          alt_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      import_batches: {
        Row: {
          id: string
          site_id: string
          imported_by: string | null
          file_name: string | null
          file_type: string | null
          total_rows: number | null
          successful_rows: number | null
          failed_rows: number | null
          error_log: Json | null
          status: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          site_id: string
          imported_by?: string | null
          file_name?: string | null
          file_type?: string | null
          total_rows?: number | null
          successful_rows?: number | null
          failed_rows?: number | null
          error_log?: Json | null
          status?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          site_id?: string
          imported_by?: string | null
          file_name?: string | null
          file_type?: string | null
          total_rows?: number | null
          successful_rows?: number | null
          failed_rows?: number | null
          error_log?: Json | null
          status?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      user_type: "admin" | "site_owner" | "customer"
      site_membership_role: "owner" | "editor" | "viewer"
      content_type: "page" | "blog_post" | "event"
      file_type: "image" | "video" | "document"
      inquiry_status: "new" | "read" | "responded"
      stock_status: "in_stock" | "low_stock" | "out_of_stock" | "discontinued"
      taggable_type: "content" | "product"
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
    Enums: {
      user_type: ["admin", "site_owner", "customer"],
      site_membership_role: ["owner", "editor", "viewer"],
      content_type: ["page", "blog_post", "event"],
      file_type: ["image", "video", "document"],
      inquiry_status: ["new", "read", "responded"],
      stock_status: ["in_stock", "low_stock", "out_of_stock", "discontinued"],
      taggable_type: ["content", "product"],
    },
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

// Enum types
export type UserType = Database['public']['Enums']['user_type']
export type SiteMembershipRole = Database['public']['Enums']['site_membership_role']
export type ContentType = Database['public']['Enums']['content_type']
export type FileType = Database['public']['Enums']['file_type']
export type InquiryStatus = Database['public']['Enums']['inquiry_status']
export type StockStatus = Database['public']['Enums']['stock_status']
export type TaggableType = Database['public']['Enums']['taggable_type']

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

