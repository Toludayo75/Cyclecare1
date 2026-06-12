import { Link } from "wouter";
import { useAdminListArticles, useAdminDeleteArticle, useAdminUpdateArticle } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListArticlesQueryKey } from "@workspace/api-client-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

export default function ArticlesList() {
  const { data: articles, isLoading, error } = useAdminListArticles();
  const deleteArticle = useAdminDeleteArticle();
  const updateArticle = useAdminUpdateArticle();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
            <p className="text-muted-foreground mt-1">Manage health and education content</p>
          </div>
          <Button disabled><Plus className="mr-2 h-4 w-4" /> New Article</Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !articles) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50/50 rounded-lg border border-destructive/20 text-center">
        <FileText className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load articles</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    deleteArticle.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Article deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getAdminListArticlesQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to delete article" });
      }
    });
  };

  const handleTogglePublish = (id: number, currentStatus: boolean, data: any) => {
    updateArticle.mutate({ id, data: { ...data, published: !currentStatus } }, {
      onSuccess: () => {
        toast({ title: `Article ${!currentStatus ? 'published' : 'unpublished'}` });
        queryClient.invalidateQueries({ queryKey: getAdminListArticlesQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to update status" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-1">Manage health and education content</p>
        </div>
        <Link href="/articles/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" /> New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No articles found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Get started by creating your first educational article for the platform.
            </p>
            <Link href="/articles/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> Create Article
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                    {article.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {article.published ? "Published" : "Draft"}
                    </span>
                    <Switch 
                      checked={article.published} 
                      onCheckedChange={() => handleTogglePublish(article.id, article.published, {
                        titleEn: article.titleEn,
                        bodyEn: article.bodyEn,
                        excerptEn: article.excerptEn,
                        category: article.category
                      })} 
                    />
                  </div>
                </div>
                <CardTitle className="text-xl mt-3 line-clamp-2 leading-tight">
                  {article.titleEn}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-2 text-sm text-muted-foreground">
                  {article.excerptEn}
                </CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardContent className="pt-0 pb-4">
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Eye className="mr-1 h-3 w-3" />
                    {article.readMin} min read
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/articles/${article.id}/edit`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Edit</span>
                    </Link>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{article.titleEn}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(article.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
