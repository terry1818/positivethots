import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CoinTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface StoreItem {
  id: string;
  item_type: string;
  name: string;
  description: string;
  coin_cost: number;
  icon: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonus_coins: number;
  price_usd: number;
  stripe_price_id: string | null;
  is_best_value: boolean;
  display_order: number;
}

export const useCoins = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ["coins-balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("profiles")
        .select("thots_coins_balance")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return (data as any)?.thots_coins_balance ?? 0;
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["coins-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("thots_coins_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CoinTransaction[];
    },
    enabled: !!user,
  });

  const { data: storeItems = [] } = useQuery({
    queryKey: ["coins-store"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thots_coins_store")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as StoreItem[];
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["coin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as CoinPackage[];
    },
  });

  const spendMutation = useMutation({
    mutationFn: async ({ itemType, amount, description }: { itemType: string; amount: number; description: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("debit_coins", {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: "spent",
        p_description: description,
        p_reference_id: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coins-balance"] });
      queryClient.invalidateQueries({ queryKey: ["coins-transactions"] });
    },
    onError: (err: any) => {
      toast.error(err.message?.includes("Insufficient") ? "Not enough coins!" : "Transaction failed");
    },
  });

  const earnMutation = useMutation({
    mutationFn: async ({ amount, type, description }: { amount: number; type: string; description: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("credit_coins", {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: type,
        p_description: description,
        p_reference_id: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coins-balance"] });
      queryClient.invalidateQueries({ queryKey: ["coins-transactions"] });
    },
  });

  return {
    balance,
    balanceLoading,
    transactions,
    txLoading,
    storeItems,
    packages,
    spend: spendMutation.mutateAsync,
    spending: spendMutation.isPending,
    earn: earnMutation.mutateAsync,
    earning: earnMutation.isPending,
  };
};
