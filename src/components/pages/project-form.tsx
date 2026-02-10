import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import ProjectForm from "../projects/ProjectForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { projectApi } from "@/lib/api";
import { Project } from "@/types/schema";

const ProjectFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(id ? true : false);

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const data = await projectApi.getById(id);
          setProject(data);
        } catch (error) {
          console.error("Error fetching project:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProject();
  }, [id]);

  const handleSuccess = () => {
    navigate("/projects");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Projects" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>
                  {id ? "Edit Project" : "Create New Project"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <ProjectForm
                    project={project}
                    onSuccess={handleSuccess}
                    onCancel={() => navigate("/projects")}
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

export default ProjectFormPage;
