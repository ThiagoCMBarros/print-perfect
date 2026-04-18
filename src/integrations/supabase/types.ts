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
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          neighborhood: string
          number: string
          recipient: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          neighborhood: string
          number: string
          recipient: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          neighborhood?: string
          number?: string
          recipient?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cart_items: {
        Row: {
          artwork_back_path: string | null
          artwork_path: string | null
          created_at: string
          finish_option_id: string | null
          id: string
          material_option_id: string | null
          print_side_option_id: string | null
          product_id: string
          qty: number
          quantity_option_id: string | null
          size_option_id: string | null
          total_price: number
          unit_price: number
          urgency: string
          user_id: string
        }
        Insert: {
          artwork_back_path?: string | null
          artwork_path?: string | null
          created_at?: string
          finish_option_id?: string | null
          id?: string
          material_option_id?: string | null
          print_side_option_id?: string | null
          product_id: string
          qty?: number
          quantity_option_id?: string | null
          size_option_id?: string | null
          total_price: number
          unit_price: number
          urgency?: string
          user_id: string
        }
        Update: {
          artwork_back_path?: string | null
          artwork_path?: string | null
          created_at?: string
          finish_option_id?: string | null
          id?: string
          material_option_id?: string | null
          print_side_option_id?: string | null
          product_id?: string
          qty?: number
          quantity_option_id?: string | null
          size_option_id?: string | null
          total_price?: number
          unit_price?: number
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_finish_option_id_fkey"
            columns: ["finish_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_material_option_id_fkey"
            columns: ["material_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_print_side_option_id_fkey"
            columns: ["print_side_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
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
            foreignKeyName: "cart_items_quantity_option_id_fkey"
            columns: ["quantity_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_size_option_id_fkey"
            columns: ["size_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          complexity: Database["public"]["Enums"]["product_complexity"]
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          complexity?: Database["public"]["Enums"]["product_complexity"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          complexity?: Database["public"]["Enums"]["product_complexity"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      order_items: {
        Row: {
          artwork_back_filename: string | null
          artwork_back_path: string | null
          artwork_filename: string | null
          artwork_note: string | null
          artwork_path: string | null
          artwork_reviewed_at: string | null
          artwork_status: Database["public"]["Enums"]["artwork_status"]
          artwork_uploaded_at: string | null
          config: Json
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          qty: number
          total_price: number
          unit_price: number
        }
        Insert: {
          artwork_back_filename?: string | null
          artwork_back_path?: string | null
          artwork_filename?: string | null
          artwork_note?: string | null
          artwork_path?: string | null
          artwork_reviewed_at?: string | null
          artwork_status?: Database["public"]["Enums"]["artwork_status"]
          artwork_uploaded_at?: string | null
          config: Json
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          qty: number
          total_price: number
          unit_price: number
        }
        Update: {
          artwork_back_filename?: string | null
          artwork_back_path?: string | null
          artwork_filename?: string | null
          artwork_note?: string | null
          artwork_path?: string | null
          artwork_reviewed_at?: string | null
          artwork_status?: Database["public"]["Enums"]["artwork_status"]
          artwork_uploaded_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          qty?: number
          total_price?: number
          unit_price?: number
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
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_notes: string | null
          estimated_days: number | null
          id: string
          internal_notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping: number
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_notes?: string | null
          estimated_days?: number | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping?: number
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_notes?: string | null
          estimated_days?: number | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping?: number
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          label: string
          numeric_value: number | null
          option_type: Database["public"]["Enums"]["option_type"]
          price_modifier: number
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          numeric_value?: number | null
          option_type: Database["public"]["Enums"]["option_type"]
          price_modifier?: number
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          numeric_value?: number | null
          option_type?: Database["public"]["Enums"]["option_type"]
          price_modifier?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          base_price: number
          bestseller: boolean
          category_id: string
          complexity: Database["public"]["Enums"]["product_complexity"] | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          new_release: boolean
          production_days: number
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price: number
          bestseller?: boolean
          category_id: string
          complexity?: Database["public"]["Enums"]["product_complexity"] | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          new_release?: boolean
          production_days?: number
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          bestseller?: boolean
          category_id?: string
          complexity?: Database["public"]["Enums"]["product_complexity"] | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          new_release?: boolean
          production_days?: number
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
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
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_users_view: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          is_admin: boolean | null
          phone: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_admin: boolean
          orders_count: number
          phone: string
          total_spent: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_admin: {
        Args: { _make_admin: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      artwork_status: "none" | "pending" | "approved" | "rejected"
      option_type: "size" | "material" | "finish" | "quantity" | "print_side"
      order_status:
        | "aguardando_pagamento"
        | "pago"
        | "em_analise"
        | "arte_pendente"
        | "arte_aprovada"
        | "em_producao"
        | "finalizado"
        | "enviado"
        | "entregue"
        | "cancelado"
      payment_method: "pix" | "credit_card" | "boleto"
      product_complexity: "simple" | "complex"
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
      app_role: ["admin", "customer"],
      artwork_status: ["none", "pending", "approved", "rejected"],
      option_type: ["size", "material", "finish", "quantity", "print_side"],
      order_status: [
        "aguardando_pagamento",
        "pago",
        "em_analise",
        "arte_pendente",
        "arte_aprovada",
        "em_producao",
        "finalizado",
        "enviado",
        "entregue",
        "cancelado",
      ],
      payment_method: ["pix", "credit_card", "boleto"],
      product_complexity: ["simple", "complex"],
    },
  },
} as const
