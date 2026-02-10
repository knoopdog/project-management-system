import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Edit, Trash2 } from "lucide-react";
import { companyApi, projectApi } from "@/lib/api";
import { Company } from "@/types/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProjectList from "../projects/ProjectList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

const CompanyDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      try {
        const data = await companyApi.getById(id);
        setCompany(data);
      } catch (error) {
        console.error("Error fetching company:", error);
        toast({
          title: "Error",
          description: "Failed to load company details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await companyApi.delete(id);
      toast({
        title: "Company deleted",
        description: "The company has been deleted successfully.",
      });
      navigate("/companies");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!id) {
    navigate("/companies");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Companies" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate("/companies")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : company ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          {company.name}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/companies/${id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the company and all associated
                              data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Contact Person
                        </h3>
                        <p className="text-lg">
                          {company.contact_person || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Email
                        </h3>
                        <p className="text-lg">
                          {company.email || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Phone
                        </h3>
                        <p className="text-lg">
                          {company.phone || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Hourly Rate
                        </h3>
                        <p className="text-lg">
                          {company.hourly_rate
                            ? `$${parseFloat(company.hourly_rate.toString()).toFixed(2)}`
                            : "Not specified"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Address
                        </h3>
                        <p className="text-lg">
                          {company.address || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <Button
                      onClick={() => navigate(`/projects/new?company=${id}`)}
                    >
                      Add Project
                    </Button>
                  </div>
                  <ProjectList />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">Company not found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDetail;
