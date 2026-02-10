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
import { FolderKanban, Plus, Search, Clock, DollarSign } from "lucide-react";
import { projectApi, companyApi, taskApi, timeEntryApi } from "@/lib/api";
import { Project, Company, Task, TimeEntry } from "@/types/schema";

interface ProjectWithCompany extends Project {
  company?: Company;
  totalTime?: number;
  totalCost?: number;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectWithCompany[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    ProjectWithCompany[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectApi.getAll();

        // Get unique company IDs
        const companyIds = [
          ...new Set(
            projectsData
              .filter((project) => project.company_id)
              .map((project) => project.company_id),
          ),
        ];

        // Fetch company details if there are any company IDs
        const companiesMap: Record<string, Company> = {};
        if (companyIds.length > 0) {
          for (const id of companyIds) {
            if (id) {
              try {
                const company = await companyApi.getById(id);
                companiesMap[id] = company;
              } catch (error) {
                console.error(`Error fetching company ${id}:`, error);
              }
            }
          }
        }

        // Fetch tasks and time entries for each project
        const projectsWithData = await Promise.all(
          projectsData.map(async (project) => {
            // Get company data
            const companyData = project.company_id
              ? companiesMap[project.company_id]
              : undefined;

            // Get tasks for this project
            let totalTime = 0;
            let totalCost = 0;

            try {
              const tasks = await taskApi.getByProject(project.id);

              if (tasks.length > 0) {
                // Get time entries for all tasks
                const taskIds = tasks.map((task) => task.id);
                const timeEntries = await timeEntryApi.getByTasks(taskIds);

                // Calculate total time
                totalTime = timeEntries.reduce(
                  (sum, entry) => sum + entry.duration,
                  0,
                );

                // Calculate total cost based on hourly rates
                for (const entry of timeEntries) {
                  const task = tasks.find((t) => t.id === entry.task_id);
                  const hourlyRate =
                    task?.hourly_rate || companyData?.hourly_rate || 0;
                  const hours = entry.duration / 3600;
                  totalCost += hours * hourlyRate;
                }
              }
            } catch (error) {
              console.error(
                `Error fetching data for project ${project.id}:`,
                error,
              );
            }

            return {
              ...project,
              company: companyData,
              totalTime,
              totalCost,
            };
          }),
        );

        setProjects(projectsWithData);
        setFilteredProjects(projectsWithData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query)) ||
          (project.company &&
            project.company.name.toLowerCase().includes(query)),
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getStatusBadge = (status: Project["status"]) => {
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

  const getPriorityBadge = (priority: Project["priority"]) => {
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Projects</CardTitle>
          <CardDescription>Manage your client projects</CardDescription>
        </div>
        <Button onClick={() => navigate("/projects/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium">No projects found</h3>
            <p className="mt-1 text-gray-500">
              {projects.length === 0
                ? "Get started by creating a new project"
                : "Try adjusting your search query"}
            </p>
            {projects.length === 0 && (
              <Button
                onClick={() => navigate("/projects/new")}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      {project.company ? project.company.name : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {project.totalTime
                          ? formatTime(project.totalTime)
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                        {project.totalCost ? project.totalCost.toFixed(2) : "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
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
