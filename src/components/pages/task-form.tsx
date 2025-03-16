import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import TaskForm from "../tasks/TaskForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { taskApi } from "@/lib/api";
import { Task } from "@/types/schema";

const TaskFormPage = () => {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState(id ? true : false);

  useEffect(() => {
    const fetchTask = async () => {
      if (id) {
        try {
          const data = await taskApi.getById(id);
          setTask(data);
        } catch (error) {
          console.error("Error fetching task:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTask();
  }, [id]);

  const handleSuccess = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate("/tasks");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Tasks" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                if (projectId) {
                  navigate(`/projects/${projectId}`);
                } else {
                  navigate("/tasks");
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {projectId ? "Back to Project" : "Back to Tasks"}
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{id ? "Edit Task" : "Create New Task"}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <TaskForm
                    task={task}
                    projectId={projectId}
                    onSuccess={handleSuccess}
                    onCancel={() => {
                      if (projectId) {
                        navigate(`/projects/${projectId}`);
                      } else {
                        navigate("/tasks");
                      }
                    }}
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

export default TaskFormPage;
