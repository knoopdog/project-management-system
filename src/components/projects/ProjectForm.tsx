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
import { projectApi, companyApi } from "@/lib/api";
import { Project, Company } from "@/types/schema";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Project name must be at least 2 characters" }),
  description: z.string().optional(),
  status: z.enum(["Incoming", "In Progress", "Completed", "Invoiced"]),
  priority: z.enum(["Low", "Medium", "High"]),
  company_id: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
}

export default function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "Incoming",
      priority: project?.priority || "Medium",
      company_id: project?.company_id || undefined,
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companyApi.getAll();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      let result;

      if (project?.id) {
        // Update existing project
        result = await projectApi.update(project.id, values);
        toast({
          title: "Project updated",
          description: `${result.name} has been updated successfully.`,
        });
      } else {
        // Create new project
        result = await projectApi.create(values);
        toast({
          title: "Project created",
          description: `${result.name} has been created successfully.`,
        });
      }

      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "There was an error saving the project. Please try again.",
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
              <FormLabel>Project Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
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
                  placeholder="Enter project description"
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Company</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingCompanies ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                  ) : companies.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No companies available
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
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
              : project?.id
                ? "Update Project"
                : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
