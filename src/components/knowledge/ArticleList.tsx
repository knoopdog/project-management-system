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
import { BookOpen, Plus, Search } from "lucide-react";
import { articleApi, companyApi } from "@/lib/api";
import { Article, Company } from "@/types/schema";
import { useAuth } from "../../../supabase/auth";

interface ArticleWithCompany extends Article {
  company?: Company;
}

interface ArticleListProps {
  companyId?: string; // Optional: filter articles by company
  clientView?: boolean; // Optional: show only public articles or those for the client's company
}

export default function ArticleList({
  companyId,
  clientView = false,
}: ArticleListProps) {
  const { user, isAdmin } = useAuth();
  const [articles, setArticles] = useState<ArticleWithCompany[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<
    ArticleWithCompany[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        let articlesData;

        if (clientView) {
          // For client view, get only public articles or those assigned to the client's company
          if (companyId) {
            articlesData = await articleApi.getByCompany(companyId);
          } else {
            articlesData = await articleApi.getPublic();
          }
        } else {
          // For admin view
          if (companyId) {
            articlesData = await articleApi.getByCompany(companyId);
          } else {
            articlesData = await articleApi.getAll();
          }
        }

        // Get unique company IDs
        const companyIds = [
          ...new Set(
            articlesData
              .filter((article) => article.company_id)
              .map((article) => article.company_id),
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

        // Combine article data with company data
        const articlesWithCompanies = articlesData.map((article) => ({
          ...article,
          company: article.company_id
            ? companiesMap[article.company_id]
            : undefined,
        }));

        setArticles(articlesWithCompanies);
        setFilteredArticles(articlesWithCompanies);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [companyId, clientView]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          (article.category &&
            article.category.toLowerCase().includes(query)) ||
          (article.company &&
            article.company.name.toLowerCase().includes(query)),
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Knowledge Base</CardTitle>
          <CardDescription>
            {clientView
              ? "Browse helpful articles and guides"
              : companyId
                ? "Articles for this company"
                : "Manage knowledge base articles"}
          </CardDescription>
        </div>
        {!clientView && isAdmin && (
          <Button onClick={() => navigate("/knowledge/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Article
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium">No articles found</h3>
            <p className="mt-1 text-gray-500">
              {articles.length === 0
                ? isAdmin && !clientView
                  ? "Get started by creating a new article"
                  : "No articles are available yet"
                : "Try adjusting your search query"}
            </p>
            {articles.length === 0 && isAdmin && !clientView && (
              <Button
                onClick={() => navigate("/knowledge/new")}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Article
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  {!companyId && !clientView && (
                    <TableHead>Visibility</TableHead>
                  )}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.title}
                    </TableCell>
                    <TableCell>{article.category || "-"}</TableCell>
                    {!companyId && !clientView && (
                      <TableCell>
                        {article.is_public ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Public
                          </Badge>
                        ) : article.company ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {article.company.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{formatDate(article.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/knowledge/${article.id}`)}
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
