import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ClientProjectList from "./ClientProjectList";
import ClientTaskList from "./ClientTaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FolderKanban, BookOpen } from "lucide-react";
import ClientKnowledgeBase from "./ClientKnowledgeBase";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientCompany, setClientCompany] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientCompany = async () => {
      if (!user) return;

      try {
        // First get the user's client company association
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        if (userData?.company_id) {
          // Then get the company details
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("*")
            .eq("id", userData.company_id)
            .single();

          if (companyError) throw companyError;
          setClientCompany(companyData);
        }
      } catch (error) {
        console.error("Error fetching client company:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientCompany();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!clientCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to ProjectFlow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Your account has not been assigned to a company yet. Please
              contact your administrator to get access to your company
              dashboard.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full"
              variant="outline"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="font-medium text-xl">ProjectFlow</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              {clientCompany.name} Dashboard
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                supabase.auth.signOut();
                navigate("/login");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">
            Here you can view all your projects and tasks assigned by your
            project manager.
          </p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="projects" className="flex items-center">
              <FolderKanban className="mr-2 h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ClientProjectList companyId={clientCompany.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <ClientTaskList companyId={clientCompany.id} />
          </TabsContent>

          <TabsContent value="knowledge">
            <ClientKnowledgeBase companyId={clientCompany.id} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white py-6 border-t">
        <div className="max-w-[1200px] mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ProjectFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
