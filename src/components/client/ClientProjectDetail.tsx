import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Clock, DollarSign, ClipboardList } from "lucide-react";
import { projectApi, taskApi, timeEntryApi } from "@/lib/api";
import { Project, Task } from "@/types/schema";
import { supabase } from "../../../supabase/supabase";

export default function ClientProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;

      try {
        // Fetch project details
        const projectData = await projectApi.getById(projectId);
        setProject(projectData);

        // Fetch tasks for this project
        const tasksData = await taskApi.getByProject(projectId);
        setTasks(tasksData);

        // Fetch time entries for all tasks to calculate totals
        if (tasksData.length > 0) {
          const taskIds = tasksData.map((task) => task.id);
          const timeEntries = await timeEntryApi.getByTasks(taskIds);

          // Calculate total time
          const totalSeconds = timeEntries.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          );
          setTotalTime(totalSeconds);

          // Calculate total cost
          let cost = 0;
          for (const entry of timeEntries) {
            const task = tasksData.find((t) => t.id === entry.task_id);
            const hourlyRate =
              task?.hourly_rate || projectData.hourly_rate || 0;
            const hours = entry.duration / 3600;
            cost += hours * hourlyRate;
          }
          setTotalCost(cost);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Low":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Low
          </Badge>
        );
      case "Medium":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Medium
          </Badge>
        );
      case "High":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            High
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/client")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="text-center mt-8">
          <p className="text-lg text-gray-500">
            Project not found or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/client")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <div className="flex space-x-2">
            {getStatusBadge(project.status)}
            {getPriorityBadge(project.priority)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Description
              </h3>
              <p className="text-gray-700">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Total Time</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatTime(totalTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Total Cost</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Hourly Rate</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    $
                    {project.hourly_rate
                      ? project.hourly_rate.toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Tasks
            </h3>

            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No tasks found for this project.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Task
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {task.name}
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/client/tasks/${task.id}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
