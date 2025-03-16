import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClipboardList, Plus, Search } from "lucide-react";
import { taskApi, projectApi, timeEntryApi } from "@/lib/api";
import { Task, Project, TimeEntry } from "@/types/schema";

interface TaskWithProject extends Task {
  project?: Project;
  timeEntries?: TimeEntry[];
  totalTime?: number;
  totalCost?: number;
}

interface TaskListProps {
  projectId?: string; // Optional: filter tasks by project
}

export default function TaskList({ projectId }: TaskListProps) {
  // Helper function to format time in hours and minutes
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        let tasksData;
        if (projectId) {
          tasksData = await taskApi.getByProject(projectId);
        } else {
          tasksData = await taskApi.getAll();
        }

        // Get unique project IDs
        const projectIds = [
          ...new Set(
            tasksData
              .filter((task) => task.project_id)
              .map((task) => task.project_id),
          ),
        ];

        // Fetch project details if there are any project IDs
        const projectsMap: Record<string, Project> = {};
        if (projectIds.length > 0) {
          for (const id of projectIds) {
            if (id) {
              try {
                const project = await projectApi.getById(id);
                projectsMap[id] = project;
              } catch (error) {
                console.error(`Error fetching project ${id}:`, error);
              }
            }
          }
        }

        // Combine task data with project data
        const tasksWithProjects = tasksData.map((task) => ({
          ...task,
          project: task.project_id ? projectsMap[task.project_id] : undefined,
        }));

        // Fetch time entries for all tasks
        const taskIds = tasksData.map((task) => task.id);
        let timeEntriesData: TimeEntry[] = [];

        try {
          timeEntriesData = await timeEntryApi.getByTasks(taskIds);
        } catch (error) {
          console.error("Error fetching time entries:", error);
        }

        // Group time entries by task
        const timeEntriesByTask: Record<string, TimeEntry[]> = {};
        timeEntriesData.forEach((entry) => {
          if (!timeEntriesByTask[entry.task_id]) {
            timeEntriesByTask[entry.task_id] = [];
          }
          timeEntriesByTask[entry.task_id].push(entry);
        });

        // Calculate total time and cost for each task
        const tasksWithTimeAndCost = tasksWithProjects.map((task) => {
          const taskTimeEntries = timeEntriesByTask[task.id] || [];
          const totalTime = taskTimeEntries.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          );
          const hourlyRate = task.hourly_rate || task.project?.hourly_rate || 0;
          const totalCost = (totalTime / 3600) * hourlyRate; // Convert seconds to hours

          return {
            ...task,
            timeEntries: taskTimeEntries,
            totalTime,
            totalCost,
          };
        });

        setTasks(tasksWithTimeAndCost);
        setFilteredTasks(tasksWithTimeAndCost);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Tasks</CardTitle>
          <CardDescription>
            {projectId ? "Tasks for this project" : "Manage all tasks"}
          </CardDescription>
        </div>
        <Button
          onClick={() =>
            navigate(
              projectId ? `/projects/${projectId}/tasks/new` : "/tasks/new",
            )
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
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
                ? "Get started by creating a new task"
                : "Try adjusting your search query"}
            </p>
            {tasks.length === 0 && (
              <Button
                onClick={() =>
                  navigate(
                    projectId
                      ? `/projects/${projectId}/tasks/new`
                      : "/tasks/new",
                  )
                }
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    {!projectId && (
                      <TableCell>
                        {task.project ? task.project.name : "-"}
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      {task.totalTime !== undefined
                        ? formatTime(task.totalTime)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {task.totalCost !== undefined
                        ? `${task.totalCost.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        View
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
