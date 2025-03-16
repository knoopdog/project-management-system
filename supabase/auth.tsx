import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  clientCompanyId?: string;
  signIn: (email: string, password: string) => Promise<{ user: User | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  makeUserAdmin: (userId: string) => Promise<void>;
  assignUserToCompany: (
    userId: string,
    companyId: string,
    isClient?: boolean,
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [clientCompanyId, setClientCompanyId] = useState<string | undefined>(
    undefined,
  );

  // Function to check user roles and company
  const checkUserRoles = async (userId: string) => {
    if (!userId) {
      setIsAdmin(false);
      setIsClient(false);
      setClientCompanyId(undefined);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("is_admin, is_client, company_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking user roles:", error);
      setIsAdmin(false);
      setIsClient(false);
      setClientCompanyId(undefined);
      return;
    }

    setIsAdmin(data?.is_admin || false);
    setIsClient(data?.is_client || false);
    setClientCompanyId(data?.company_id);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkUserRoles(currentUser.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkUserRoles(currentUser.id);
      } else {
        setIsAdmin(false);
        setIsClient(false);
        setClientCompanyId(undefined);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Function to make a user an admin
  const makeUserAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("users")
      .update({ is_admin: true })
      .eq("id", userId);

    if (error) {
      console.error("Error making user admin:", error);
      throw error;
    }

    // If the current user is being made admin, update the state
    if (user && user.id === userId) {
      setIsAdmin(true);
    }
  };

  // Function to assign a user to a company and optionally make them a client
  const assignUserToCompany = async (
    userId: string,
    companyId: string,
    isClient: boolean = true,
  ) => {
    const { error } = await supabase
      .from("users")
      .update({
        company_id: companyId,
        is_client: isClient,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error assigning user to company:", error);
      throw error;
    }

    // If the current user is being assigned, update the state
    if (user && user.id === userId) {
      setIsClient(isClient);
      setClientCompanyId(companyId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isClient,
        clientCompanyId,
        signIn,
        signUp,
        signOut,
        makeUserAdmin,
        assignUserToCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
