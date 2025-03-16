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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { articleApi, companyApi } from "@/lib/api";
import { Article, Company } from "@/types/schema";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  content: z
    .string()
    .min(10, { message: "Content must be at least 10 characters" }),
  category: z.string().optional(),
  is_public: z.boolean().default(false),
  company_id: z.string().uuid().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ArticleFormProps {
  article?: Article;
  onSuccess?: (article: Article) => void;
  onCancel?: () => void;
}

export default function ArticleForm({
  article,
  onSuccess,
  onCancel,
}: ArticleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: article?.title || "",
      content: article?.content || "",
      category: article?.category || "",
      is_public: article?.is_public || false,
      company_id: article?.company_id || null,
    },
  });

  // Watch is_public to disable company_id when public
  const isPublic = form.watch("is_public");

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

  // Reset company_id when is_public changes to true
  useEffect(() => {
    if (isPublic) {
      form.setValue("company_id", null);
    }
  }, [isPublic, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      let result;

      if (article?.id) {
        // Update existing article
        result = await articleApi.update(article.id, values);
        toast({
          title: "Article updated",
          description: `${result.title} has been updated successfully.`,
        });
      } else {
        // Create new article
        result = await articleApi.create(values);
        toast({
          title: "Article created",
          description: `${result.title} has been created successfully.`,
        });
      }

      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error("Error saving article:", error);
      toast({
        title: "Error",
        description: "There was an error saving the article. Please try again.",
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter article title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter category" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your article content in Markdown format"
                  className="min-h-[300px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Article</FormLabel>
                <FormMessage />
                <p className="text-sm text-gray-500">
                  Make this article available to all clients
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Company</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
                disabled={isPublic}
              >
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
              {isPublic && (
                <p className="text-xs text-gray-500 mt-1">
                  Company assignment is disabled for public articles
                </p>
              )}
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
              : article?.id
                ? "Update Article"
                : "Create Article"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
