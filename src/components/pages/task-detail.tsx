import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Edit, Trash2 } from "lucide-react";
import { taskApi, projectApi } from "@/lib/api";
import { Task, Project } from "@/types/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import TimeTracker from "../tasks/TimeTracker";
import TimeEntryList from "../tasks/TimeEntryList";
import { Badge } from "@/components/ui/badge";
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

const TaskDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeEntries, setRefreshTimeEntries] = useState(0);

  useEffect(() => {
    const fetchTaskAndProject = async () => {
      if (!id) return;
      try {
        const taskData = await taskApi.getById(id);
        setTask(taskData);

        if (taskData.project_id) {
          try {
            const projectData = await projectApi.getById(taskData.project_id);
            setProject(projectData);
          } catch (error) {
            console.error("Error fetching project:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        toast({
          title: "Error",
          description: "Failed to load task details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndProject();
  }, [id]);

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "Incoming":
        return <Badge variant="outline">Incoming</Badge>;
      case "In Progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "Invoiced":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Invoiced
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await taskApi.delete(id);
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
      if (task?.project_id) {
        navigate(`/projects/${task.project_id}`);
      } else {
        navigate("/tasks");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!id) {
    navigate("/tasks");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Tasks" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                if (task?.project_id) {
                  navigate(`/projects/${task.project_id}`);
                } else {
                  navigate("/tasks");
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {task?.project_id ? "Back to Project" : "Back to Tasks"}
            </Button>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : task ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <ClipboardList className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{task.name}</CardTitle>
                        {project && (
                          <p className="text-sm text-gray-500">
                            Project: {project.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tasks/${id}/edit`)}
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
                              permanently delete the task and all associated
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
                          Status
                        </h3>
                        <div>{getStatusBadge(task.status)}</div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Set Value
                        </h3>
                        <p className="text-lg">
                          {task.set_value
                            ? `$${parseFloat(task.set_value.toString()).toFixed(2)}`
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Hourly Rate
                        </h3>
                        <p className="text-lg">
                          {task.hourly_rate
                            ? `$${parseFloat(task.hourly_rate.toString()).toFixed(2)}`
                            : project?.hourly_rate
                              ? `$${parseFloat(project.hourly_rate.toString()).toFixed(2)} (from project)`
                              : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Platform
                        </h3>
                        <p className="text-lg">
                          {task.platform || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Contact Person
                        </h3>
                        <p className="text-lg">
                          {task.contact_person || "Not specified"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Description
                        </h3>
                        <p className="text-lg">
                          {task.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimeTracker
                    taskId={id}
                    hourlyRate={task?.hourly_rate || project?.hourly_rate}
                    onTimeEntryAdded={() =>
                      setRefreshTimeEntries((prev) => prev + 1)
                    }
                  />
                  <TimeEntryList
                    taskId={id}
                    hourlyRate={task?.hourly_rate || project?.hourly_rate}
                    refreshTrigger={refreshTimeEntries}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-500">Task not found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskDetail;
