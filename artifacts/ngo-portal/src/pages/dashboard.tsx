import { useState } from "react";
import { useGetNgoStats, useGetNgoProfile, useAddNgoInventory, getGetNgoProfileQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, XCircle, Plus, Boxes, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addQty, setAddQty] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetNgoStats();
  const { data: profile, isLoading: profileLoading } = useGetNgoProfile();
  const addInventoryMutation = useAddNgoInventory();

  const handleAddStock = () => {
    const qty = parseInt(addQty, 10);
    if (!qty || qty < 1) {
      toast({ variant: "destructive", title: "Enter a valid quantity" });
      return;
    }
    addInventoryMutation.mutate(
      { data: { quantity: qty } },
      {
        onSuccess: (updated) => {
          toast({ title: `Stock updated — ${updated.availablePads} pads available` });
          queryClient.invalidateQueries({ queryKey: getGetNgoProfileQueryKey() });
          setAddStockOpen(false);
          setAddQty("");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Failed to update stock", description: err.message });
        },
      }
    );
  };

  if (statsLoading || profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const availablePads = profile?.availablePads ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {profile && (
          <p className="text-muted-foreground mt-2">
            Welcome back. Managing operations for {profile.name} in {profile.region}, {profile.state}.
          </p>
        )}
      </div>

      {/* Inventory Card — prominent */}
      <Card className={`border-2 ${availablePads === 0 ? "border-red-300 bg-red-50" : availablePads < 50 ? "border-amber-300 bg-amber-50" : "border-primary/30 bg-primary/5"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${availablePads === 0 ? "bg-red-100" : availablePads < 50 ? "bg-amber-100" : "bg-primary/10"}`}>
                <Boxes className={`w-7 h-7 ${availablePads === 0 ? "text-red-600" : availablePads < 50 ? "text-amber-600" : "text-primary"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Pad Stock</p>
                <p className={`text-4xl font-bold ${availablePads === 0 ? "text-red-600" : availablePads < 50 ? "text-amber-600" : "text-primary"}`}>
                  {availablePads.toLocaleString()}
                </p>
                {availablePads === 0 && (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠ Out of stock — add pads before approving requests</p>
                )}
                {availablePads > 0 && availablePads < 50 && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">Low stock — consider restocking soon</p>
                )}
              </div>
            </div>
            <Button onClick={() => setAddStockOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Add Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pickup assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Not fulfilled</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">
              Total This Month
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalThisMonth || 0}</div>
            <p className="text-xs text-primary-foreground/70 mt-1">Requests received</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addStockOpen} onOpenChange={(open) => { setAddStockOpen(open); if (!open) setAddQty(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pad Stock</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Quantity to add</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 500"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
              />
              {profile && (
                <p className="text-sm text-muted-foreground">
                  Current stock: <strong>{availablePads}</strong> pads.
                  After adding: <strong>{availablePads + (parseInt(addQty, 10) || 0)}</strong> pads.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddStockOpen(false); setAddQty(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAddStock} disabled={!addQty || addInventoryMutation.isPending}>
              {addInventoryMutation.isPending ? "Updating..." : "Add to Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
