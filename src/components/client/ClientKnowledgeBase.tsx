import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { articleApi } from "@/lib/api";
import { Article } from "@/types/schema";
import { Search, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientKnowledgeBaseProps {
  companyId: string;
}

export default function ClientKnowledgeBase({
  companyId,
}: ClientKnowledgeBaseProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Get articles that are either public or assigned to this company
        const data = await articleApi.getByCompany(companyId);
        setArticles(data);
        setFilteredArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [companyId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          (article.category && article.category.toLowerCase().includes(query)),
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
    <div className="space-y-6">
      {selectedArticle ? (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              {selectedArticle.title}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedArticle(null)}
            >
              Back to List
            </Button>
          </CardHeader>
          <CardContent>
            {selectedArticle.category && (
              <Badge className="mb-4">{selectedArticle.category}</Badge>
            )}
            <div className="text-sm text-gray-500 mb-4">
              Published on {formatDate(selectedArticle.created_at)}
            </div>
            <div className="prose max-w-none">
              {/* Render markdown content - in a real app you'd use a markdown renderer */}
              <div className="whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Knowledge Base
            </CardTitle>
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
                    ? "No knowledge base articles are available yet."
                    : "Try adjusting your search query"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">
                          {article.title}
                        </TableCell>
                        <TableCell>
                          {article.category ? (
                            <Badge variant="outline">{article.category}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(article.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedArticle(article)}
                          >
                            Read Article
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
      )}
    </div>
  );
}
