import { useParams, Link } from "wouter";
import { useAdminGetUser, getAdminGetUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, User as UserIcon, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function UserDetail() {
  const params = useParams();
  const userId = Number(params.id);

  const { data: user, isLoading, error } = useAdminGetUser(userId, {
    query: { queryKey: getAdminGetUserQueryKey(userId), enabled: !!userId }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12 bg-red-50 text-destructive rounded-lg border border-destructive/20 max-w-xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-2">User not found</h2>
        <p className="mb-6">The user you are looking for does not exist or failed to load.</p>
        <Link href="/users" className="text-primary hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/users" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Back to users</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-1">View user profile and activity</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="border-border/50 shadow-sm text-center">
            <CardContent className="pt-6 pb-6">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <UserIcon className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">
                ID: {user.id}
              </p>
              <div className="flex justify-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
                {user.hasCompletedOnboarding && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Onboarded</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email || "Not provided"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{user.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {[user.city, user.state].filter(Boolean).join(", ") || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Joined Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="grid grid-cols-3 py-1 border-b border-border/50 last:border-0">
                  <dt className="text-sm font-medium text-muted-foreground">Age</dt>
                  <dd className="text-sm col-span-2">{user.age || "Not specified"}</dd>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-border/50 last:border-0">
                  <dt className="text-sm font-medium text-muted-foreground">City</dt>
                  <dd className="text-sm col-span-2">{user.city || "Not specified"}</dd>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-border/50 last:border-0">
                  <dt className="text-sm font-medium text-muted-foreground">State</dt>
                  <dd className="text-sm col-span-2">{user.state || "Not specified"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
