import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { companyApi } from "@/lib/api";
import { Company } from "@/types/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function AssignCompany() {
  const { userId } = useParams<{ userId: string }>();
  const { assignUserToCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isClient, setIsClient] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        if (userId) {
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (userError) throw userError;
          setUserData(user);
        }

        // Fetch companies
        const companiesData = await companyApi.getAll();
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId || !selectedCompany) {
      toast({
        title: "Error",
        description: "Please select a company.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await assignUserToCompany(userId, selectedCompany, isClient);
      toast({
        title: "Success",
        description: `User has been assigned to the company as a ${isClient ? "client" : "team member"}.`,
      });
      navigate("/admin");
    } catch (error) {
      console.error("Error assigning user to company:", error);
      toast({
        title: "Error",
        description: "Failed to assign user to company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Admin" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Panel
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Assign User to Company</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : userData ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">User Information</h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Name
                          </p>
                          <p>{userData.full_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Email
                          </p>
                          <p>{userData.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Select Company</Label>
                        <Select
                          onValueChange={setSelectedCompany}
                          value={selectedCompany}
                        >
                          <SelectTrigger id="company">
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No companies available
                              </SelectItem>
                            ) : (
                              companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="client-mode"
                          checked={isClient}
                          onCheckedChange={setIsClient}
                        />
                        <Label htmlFor="client-mode">
                          Assign as client (will have access to client
                          dashboard)
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/admin")}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!selectedCompany || submitting}
                      >
                        {submitting ? "Assigning..." : "Assign to Company"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg text-gray-500">User not found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
