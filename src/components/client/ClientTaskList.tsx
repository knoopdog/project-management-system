import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { taskApi, projectApi } from "@/lib/api";
import { Task, Project } from "@/types/schema";
import { Search, ClipboardList, Clock, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "../../../supabase/supabase";

interface ClientTaskListProps {
  companyId: string;
}

interface TaskWithProject extends Task {
  project?: Project;
  totalTime?: number;
  totalCost?: number;
}

export default function ClientTaskList({ companyId }: ClientTaskListProps) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // First get all projects for this company
        const projects = await projectApi.getByCompany(companyId);

        if (projects.length === 0) {
          setIsLoading(false);
          return;
        }

        const projectIds = projects.map((project) => project.id);
        const projectsMap: Record<string, Project> = {};
        projects.forEach((project) => {
          projectsMap[project.id] = project;
        });

        // Get all tasks for these projects
        let allTasks: TaskWithProject[] = [];

        for (const projectId of projectIds) {
          const projectTasks = await taskApi.getByProject(projectId);
          const tasksWithProject = projectTasks.map((task) => ({
            ...task,
            project: projectsMap[task.project_id || ""],
          }));
          allTasks = [...allTasks, ...tasksWithProject];
        }

        // Get time entries for all tasks to calculate time and cost
        const taskIds = allTasks.map((task) => task.id);

        if (taskIds.length > 0) {
          const { data: timeEntries } = await supabase
            .from("time_entries")
            .select("*")
            .in("task_id", taskIds);

          if (timeEntries) {
            // Group time entries by task
            const timeEntriesByTask: Record<string, any[]> = {};
            timeEntries.forEach((entry) => {
              if (!timeEntriesByTask[entry.task_id]) {
                timeEntriesByTask[entry.task_id] = [];
              }
              timeEntriesByTask[entry.task_id].push(entry);
            });

            // Calculate total time and cost for each task
            allTasks = allTasks.map((task) => {
              const taskTimeEntries = timeEntriesByTask[task.id] || [];
              const totalTime = taskTimeEntries.reduce(
                (sum, entry) => sum + entry.duration,
                0,
              );
              const hourlyRate =
                task.hourly_rate || task.project?.hourly_rate || 0;
              const totalCost = (totalTime / 3600) * hourlyRate; // Convert seconds to hours

              return {
                ...task,
                totalTime,
                totalCost,
              };
            });
          }
        }

        setTasks(allTasks);
        setFilteredTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [companyId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.description &&
            task.description.toLowerCase().includes(query)) ||
          (task.project && task.project.name.toLowerCase().includes(query)),
      );
      setFilteredTasks(filtered);
    }
  }, [searchQuery, tasks]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ClipboardList className="mr-2 h-5 w-5" />
          Your Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium">No tasks found</h3>
            <p className="mt-1 text-gray-500">
              {tasks.length === 0
                ? "You don't have any tasks assigned yet."
                : "Try adjusting your search query"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {task.name}
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[300px]">
                          {task.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.project ? task.project.name : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {task.totalTime !== undefined
                          ? formatTime(task.totalTime)
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/tasks/${task.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
