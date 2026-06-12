import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useAdminCreateArticle } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "catIrregularPeriods", label: "Irregular Periods" },
  { value: "catCramps", label: "Menstrual Cramps" },
  { value: "catHormones", label: "Hormonal Health" },
  { value: "catNutrition", label: "Nutrition & Diet" },
  { value: "catMentalHealth", label: "Mental Health" },
  { value: "catEducation", label: "General Education" },
  { value: "catWellness", label: "Wellness & Lifestyle" },
  { value: "catSupport", label: "Community Support" },
];

const articleSchema = z.object({
  titleEn: z.string().min(5, "Title must be at least 5 characters"),
  excerptEn: z.string().min(10, "Excerpt must be at least 10 characters").max(200, "Keep excerpt under 200 characters"),
  bodyEn: z.string().min(50, "Body must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  readMin: z.coerce.number().min(1).default(5),
  published: z.boolean().default(false),
});

type FormValues = z.infer<typeof articleSchema>;

export default function NewArticle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createArticle = useAdminCreateArticle();

  const form = useForm<FormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      titleEn: "",
      excerptEn: "",
      bodyEn: "",
      category: "",
      readMin: 5,
      published: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    createArticle.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Article created successfully" });
        setLocation("/articles");
      },
      onError: (err) => {
        toast({ 
          variant: "destructive", 
          title: "Failed to create article",
          description: err.message || "An error occurred" 
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/articles" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Back to articles</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Article</h1>
          <p className="text-muted-foreground mt-1">Draft a new educational post</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="titleEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (English)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter article title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerptEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt / Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="A brief summary for the article card" 
                            className="resize-none h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Shown on article list views (max 200 chars)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Content (Markdown)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your article content here..." 
                            className="min-h-[400px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="readMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Read Time (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published</FormLabel>
                          <FormDescription>
                            Make visible to all users
                          </FormDescription>
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

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createArticle.isPending}
                  >
                    {createArticle.isPending ? "Saving..." : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Article
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
