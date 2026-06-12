import { useGetAdminStats, useAdminListUsers, useAdminListNgos, useAdminListArticles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Building2, Activity, Inbox } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useGetAdminStats();

  // Fallback queries: use existing list endpoints to derive counts when
  // the `/api/admin/stats` endpoint returns missing/zero values.
  const { data: usersData } = useAdminListUsers({ page: 1, limit: 1 });
  const { data: ngosData } = useAdminListNgos();
  const { data: articlesData } = useAdminListArticles();

  const fallbackTotalUsers = usersData?.total ?? usersData?.users?.length ?? 0;
  const fallbackActiveNgos = ngosData ? ngosData.length : 0;
  const fallbackPublishedArticles = articlesData ? articlesData.filter((a) => a.published).length : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of CycleCare operations</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse bg-muted/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50/50 rounded-lg border border-destructive/20 text-center">
        <Activity className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load dashboard data</h2>
        <p className="text-muted-foreground">Please try refreshing the page or check your connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of CycleCare operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{((stats?.totalUsers ?? fallbackTotalUsers) ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active NGOs</CardTitle>
            <Building2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats?.activeNgos ?? fallbackActiveNgos) ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published Articles</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats?.publishedArticles ?? fallbackPublishedArticles) ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requests This Month</CardTitle>
            <Inbox className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats?.requestsThisMonth ?? 0) ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{(stats?.pendingRequests ?? 0)} pending</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
