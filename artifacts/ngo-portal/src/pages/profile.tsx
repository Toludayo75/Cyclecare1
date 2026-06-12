import { useGetNgoProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { MapPin, Mail, Package, Calendar } from "lucide-react";

export default function Profile() {
  const { data: profile, isLoading, isError, error } = useGetNgoProfile();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-red-600">Unable to load NGO profile.</div>
        <div className="text-muted-foreground">
          {(error instanceof Error ? error.message : null) ?? "Please sign in again or refresh the page."}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-muted-foreground">NGO profile data is unavailable.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NGO Profile</h1>
        <p className="text-muted-foreground mt-1">Your organization details and operational limits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{profile.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Location</div>
                <div className="text-muted-foreground">{profile.region}, {profile.state}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Contact Email</div>
                <div className="text-muted-foreground">{profile.contactEmail}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Monthly Quota</div>
                <div className="text-muted-foreground">{profile.monthlyQuota} pads</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Partner Since</div>
                <div className="text-muted-foreground">
                  {format(new Date(profile.createdAt), "MMMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
