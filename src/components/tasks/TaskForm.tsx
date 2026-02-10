import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { taskApi, projectApi } from "@/lib/api";
import { Task, Project } from "@/types/schema";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Task name must be at least 2 characters" }),
  description: z.string().optional(),
  status: z.enum(["Incoming", "In Progress", "Completed", "Invoiced"]),
  hourly_rate: z.coerce.number().min(0).optional(),
  platform: z.string().optional(),
  contact_person: z.string().optional(),
  project_id: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  task?: Task;
  projectId?: string; // Optional: pre-select a project
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
}

export default function TaskForm({
  task,
  projectId,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: task?.name || "",
      description: task?.description || "",
      status: task?.status || "Incoming",
      hourly_rate: task?.hourly_rate || undefined,
      platform: task?.platform || "",
      contact_person: task?.contact_person || "",
      project_id: task?.project_id || projectId || undefined,
    },
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectApi.getAll();
        setProjects(data);

        // If task has a project_id, find the corresponding project
        if (task?.project_id) {
          const project = data.find((p) => p.id === task.project_id);
          if (project) {
            setSelectedProject(project);

            // If task doesn't have an hourly_rate set, use the project's hourly_rate
            if (!task.hourly_rate && project.hourly_rate) {
              form.setValue("hourly_rate", project.hourly_rate);
            }
          }
        } else if (projectId) {
          const project = data.find((p) => p.id === projectId);
          if (project) {
            setSelectedProject(project);

            // If creating a new task with a pre-selected project, use the project's hourly_rate
            if (project.hourly_rate) {
              form.setValue("hourly_rate", project.hourly_rate);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [task, projectId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      let result;

      if (task?.id) {
        // Update existing task
        result = await taskApi.update(task.id, values);
        toast({
          title: "Task updated",
          description: `${result.name} has been updated successfully.`,
        });
      } else {
        // Create new task
        result = await taskApi.create(values);
        toast({
          title: "Task created",
          description: `${result.name} has been created successfully.`,
        });
      }

      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "There was an error saving the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter task name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter task description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Incoming">Incoming</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Invoiced">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hourly_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={
                      selectedProject?.hourly_rate
                        ? `Default: ${selectedProject.hourly_rate}`
                        : "Enter hourly rate"
                    }
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {selectedProject?.hourly_rate && !field.value && (
                  <p className="text-sm text-gray-500">
                    Using project's hourly rate: ${selectedProject.hourly_rate}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Input placeholder="Enter platform" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact person" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  const project = projects.find((p) => p.id === value);
                  setSelectedProject(project || null);

                  // Update hourly rate from project if available
                  if (project?.hourly_rate) {
                    form.setValue("hourly_rate", project.hourly_rate);
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingProjects ? (
                    <SelectItem value="loading" disabled>
                      Loading projects...
                    </SelectItem>
                  ) : projects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : task?.id
                ? "Update Task"
                : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
