import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import CompanyForm from "../companies/CompanyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { companyApi } from "@/lib/api";
import { Company } from "@/types/schema";

const CompanyFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [loading, setLoading] = useState(id ? true : false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (id) {
        try {
          const data = await companyApi.getById(id);
          setCompany(data);
        } catch (error) {
          console.error("Error fetching company:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompany();
  }, [id]);

  const handleSuccess = () => {
    navigate("/companies");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Companies" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate("/companies")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>
                  {id ? "Edit Company" : "Create New Company"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <CompanyForm
                    company={company}
                    onSuccess={handleSuccess}
                    onCancel={() => navigate("/companies")}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyFormPage;
