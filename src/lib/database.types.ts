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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string
          profile_id: string
          state: string
          updated_at: string
        }
        Insert: {
          address_line1?: string
          address_line2?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string
          profile_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string
          profile_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          id: string
          profile_id: string | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id?: string | null
          session_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          customization_notes: string
          customization_text: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          customization_notes?: string
          customization_text?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          customization_notes?: string
          customization_text?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          currency: string
          EUR: number
          id: string
          USD: number
        }
        Insert: {
          created_at?: string
          currency: string
          EUR: number
          id?: string
          USD: number
        }
        Update: {
          created_at?: string
          currency?: string
          EUR?: number
          id?: string
          USD?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          customization_notes: string
          customization_text: string
          id: string
          order_id: string
          paid_subtotal: number
          paid_unit_price: number
          product_id: string
          product_image_url: string
          product_name: string
          product_sku: string
          quantity: number
          selected_options: Json
          subtotal: number
          unit_price: number
          variant_id: string | null
          variant_sku: string
        }
        Insert: {
          created_at?: string
          customization_notes?: string
          customization_text?: string
          id?: string
          order_id: string
          paid_subtotal?: number
          paid_unit_price?: number
          product_id: string
          product_image_url?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          selected_options?: Json
          subtotal?: number
          unit_price?: number
          variant_id?: string | null
          variant_sku?: string
        }
        Update: {
          created_at?: string
          customization_notes?: string
          customization_text?: string
          id?: string
          order_id?: string
          paid_subtotal?: number
          paid_unit_price?: number
          product_id?: string
          product_image_url?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          selected_options?: Json
          subtotal?: number
          unit_price?: number
          variant_id?: string | null
          variant_sku?: string
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string
          created_at: string
          customer_notes: string
          delivered_at: string | null
          discount: number
          id: string
          issuer_bank: string
          order_number: string
          paid_at: string | null
          paid_total: number
          payment_currency: string
          payment_exchange_rate: number
          payment_method_id: string | null
          payment_proof_url: string
          payment_reference: string
          payment_status: string
          profile_id: string
          shipped_at: string | null
          shipping_address_line1: string
          shipping_address_line2: string
          shipping_city: string
          shipping_cost: number
          shipping_country: string
          shipping_delivery_mode: string
          shipping_full_name: string
          shipping_phone: string
          shipping_postal_code: string
          shipping_state: string
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          customer_notes?: string
          delivered_at?: string | null
          discount?: number
          id?: string
          issuer_bank?: string
          order_number?: string
          paid_at?: string | null
          paid_total?: number
          payment_currency?: string
          payment_exchange_rate?: number
          payment_method_id?: string | null
          payment_proof_url?: string
          payment_reference?: string
          payment_status?: string
          profile_id: string
          shipped_at?: string | null
          shipping_address_line1?: string
          shipping_address_line2?: string
          shipping_city?: string
          shipping_cost?: number
          shipping_country?: string
          shipping_delivery_mode?: string
          shipping_full_name?: string
          shipping_phone?: string
          shipping_postal_code?: string
          shipping_state?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          customer_notes?: string
          delivered_at?: string | null
          discount?: number
          id?: string
          issuer_bank?: string
          order_number?: string
          paid_at?: string | null
          paid_total?: number
          payment_currency?: string
          payment_exchange_rate?: number
          payment_method_id?: string | null
          payment_proof_url?: string
          payment_reference?: string
          payment_status?: string
          profile_id?: string
          shipped_at?: string | null
          shipping_address_line1?: string
          shipping_address_line2?: string
          shipping_city?: string
          shipping_cost?: number
          shipping_country?: string
          shipping_delivery_mode?: string
          shipping_full_name?: string
          shipping_phone?: string
          shipping_postal_code?: string
          shipping_state?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          payment_details: Json
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_details?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_details?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_option_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          display_order: number
          id: string
          option_type_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          option_type_id: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          option_type_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_type_id_fkey"
            columns: ["option_type_id"]
            isOneToOne: false
            referencedRelation: "product_option_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stats: {
        Row: {
          average_rating: number
          product_id: string
          total_revenue: number
          total_reviews: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          product_id: string
          total_revenue?: number
          total_reviews?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          product_id?: string
          total_revenue?: number
          total_reviews?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          allow_backorder: boolean
          compare_at_price: number
          cost: number
          created_at: string
          id: string
          images: Json
          is_active: boolean
          low_stock_threshold: number
          price: number
          product_id: string
          reserved_quantity: number
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          allow_backorder?: boolean
          compare_at_price?: number
          cost?: number
          created_at?: string
          id?: string
          images?: Json
          is_active?: boolean
          low_stock_threshold?: number
          price?: number
          product_id: string
          reserved_quantity?: number
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          allow_backorder?: boolean
          compare_at_price?: number
          cost?: number
          created_at?: string
          id?: string
          images?: Json
          is_active?: boolean
          low_stock_threshold?: number
          price?: number
          product_id?: string
          reserved_quantity?: number
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          brand_id: string | null
          category_id: string | null
          compare_at_price: number
          condition: string
          created_at: string
          description: string
          id: string
          images: Json
          is_active: boolean
          is_digital: boolean
          is_featured: boolean
          meta_description: string
          meta_title: string
          name: string
          price: number
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          attributes?: Json
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          is_digital?: boolean
          is_featured?: boolean
          meta_description?: string
          meta_title?: string
          name?: string
          price?: number
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          attributes?: Json
          brand_id?: string | null
          category_id?: string | null
          compare_at_price?: number
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          is_digital?: boolean
          is_featured?: boolean
          meta_description?: string
          meta_title?: string
          name?: string
          price?: number
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          is_admin: boolean
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          id: string
          is_admin?: boolean
          phone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          order_id: string | null
          product_id: string
          profile_id: string
          rating: number
          title: string
          updated_at: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id: string
          profile_id: string
          rating: number
          title?: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id?: string
          profile_id?: string
          rating?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          canonical_base_url: string
          created_at: string
          currency: string
          default_locale: string
          favicon_url: string
          footer_text: string
          id: string
          logo_url: string
          meta_description: string
          meta_title: string
          og_image_url: string
          robots_index: boolean
          singleton: boolean
          site_name: string
          site_tagline: string
          social_facebook: string
          social_instagram: string
          social_tiktok: string
          support_email: string
          support_phone: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          canonical_base_url?: string
          created_at?: string
          currency?: string
          default_locale?: string
          favicon_url?: string
          footer_text?: string
          id?: string
          logo_url?: string
          meta_description?: string
          meta_title?: string
          og_image_url?: string
          robots_index?: boolean
          singleton?: boolean
          site_name?: string
          site_tagline?: string
          social_facebook?: string
          social_instagram?: string
          social_tiktok?: string
          support_email?: string
          support_phone?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          canonical_base_url?: string
          created_at?: string
          currency?: string
          default_locale?: string
          favicon_url?: string
          footer_text?: string
          id?: string
          logo_url?: string
          meta_description?: string
          meta_title?: string
          og_image_url?: string
          robots_index?: boolean
          singleton?: boolean
          site_name?: string
          site_tagline?: string
          social_facebook?: string
          social_instagram?: string
          social_tiktok?: string
          support_email?: string
          support_phone?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_order: {
        Args: { p_actor_user_id: string; p_order_id: string }
        Returns: {
          id: string
          order_number: string
        }[]
      }
      confirm_order_payment: {
        Args: { p_admin_user_id: string; p_order_id: string }
        Returns: {
          id: string
          order_number: string
        }[]
      }
      create_order_from_cart: {
        Args: { p_order_number: string; p_user_id: string }
        Returns: {
          id: string
          order_number: string
        }[]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      expire_pending_orders: { Args: { p_hours?: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      set_order_shipping: {
        Args: {
          p_address_id?: string
          p_mode: string
          p_order_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      submit_order_payment: {
        Args: {
          p_issuer_bank: string
          p_order_id: string
          p_payment_date: string
          p_payment_method_id: string
          p_payment_proof_url?: string
          p_payment_reference: string
          p_user_id: string
        }
        Returns: {
          id: string
          order_number: string
        }[]
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
  public: {
    Enums: {},
  },
} as const
