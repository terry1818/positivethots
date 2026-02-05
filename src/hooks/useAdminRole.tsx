 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export const useAdminRole = () => {
   const [isAdmin, setIsAdmin] = useState(false);
   const [loading, setLoading] = useState(true);
   const [userId, setUserId] = useState<string | null>(null);
 
   useEffect(() => {
     checkAdminRole();
   }, []);
 
   const checkAdminRole = async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) {
         setLoading(false);
         return;
       }
       
       setUserId(session.user.id);
 
       const { data, error } = await supabase
         .from("user_roles")
         .select("role")
         .eq("user_id", session.user.id)
         .eq("role", "admin")
         .maybeSingle();
 
       if (error) throw error;
       setIsAdmin(!!data);
     } catch (error) {
       console.error("Error checking admin role:", error);
       setIsAdmin(false);
     } finally {
       setLoading(false);
     }
   };
 
   return { isAdmin, loading, userId, refetch: checkAdminRole };
 };