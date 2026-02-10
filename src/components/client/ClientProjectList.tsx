import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { projectApi } from "@/lib/api";
import { Project } from "@/types/schema";
import { Search, FolderKanban, Clock, Euro } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "../../../supabase/supabase";

interface ClientProjectListProps {
  companyId: string;
}

interface ProjectWithMetrics extends Project {
  totalTime?: number;
  totalCost?: number;
}

export default function ClientProjectList({
  companyId,
}: ClientProjectListProps) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithMetrics[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    ProjectWithMetrics[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectApi.getByCompany(companyId);

        // Get all tasks for these projects to calculate time and cost
        const projectsWithMetrics = await Promise.all(
          data.map(async (project) => {
            // Get time entries for this project
            const { data: timeEntries } = await supabase
              .from("time_entries")
              .select("*, tasks!inner(project_id, hourly_rate)")
              .eq("tasks.project_id", project.id);

            // Get company info to get the hourly rate
            const { data: companyData } = await supabase
              .from("companies")
              .select("hourly_rate")
              .eq("id", companyId)
              .single();

            const companyHourlyRate = companyData?.hourly_rate || 0;

            let totalTime = 0;
            let totalCost = 0;

            if (timeEntries && timeEntries.length > 0) {
              totalTime = timeEntries.reduce(
                (sum, entry) => sum + entry.duration,
                0,
              );
              // Use company hourly rate since projects don't have their own hourly rate
              totalCost = (totalTime / 3600) * companyHourlyRate; // Convert seconds to hours
              // Ensure we have at least 2 decimal places for display
            }

            return {
              ...project,
              totalTime,
              totalCost,
            };
          }),
        );

        setProjects(projectsWithMetrics);
        setFilteredProjects(projectsWithMetrics);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [companyId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query)),
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
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FolderKanban className="mr-2 h-5 w-5" />
          Your Projects
        </CardTitle>
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
                ? "You don't have any projects assigned yet."
                : "Try adjusting your search query"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[300px]">
                          {project.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {project.totalTime !== undefined
                          ? formatTime(project.totalTime)
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Euro className="h-4 w-4 mr-1 text-gray-500" />
                        {project.totalCost !== undefined &&
                        project.totalCost > 0
                          ? `€${project.totalCost.toFixed(2)}`
                          : "€0.00"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/client/projects/${project.id}`)
                        }
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
