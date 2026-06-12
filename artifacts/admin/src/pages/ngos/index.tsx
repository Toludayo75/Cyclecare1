import { useState } from "react";
import { Link } from "wouter";
import {
  useAdminListNgos,
  useAdminCreateNgo,
  useAdminDeleteNgo,
  useAdminListNgoWorkers,
  useAdminResetUserPassword,
  getAdminListNgosQueryKey,
} from "@workspace/api-client-react";
import { getApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Building2, MapPin, Mail, Loader2,
  ChevronDown, ChevronUp, User, KeyRound, Copy, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function WorkersPanel({ ngoId }: { ngoId: number }) {
  const { data: workers, isLoading } = useAdminListNgoWorkers(ngoId);
  const resetPassword = useAdminResetUserPassword();
  const { toast } = useToast();

  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savedPassword, setSavedPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleReset = () => {
    if (!resetTarget || newPassword.length < 6) return;
    resetPassword.mutate({ id: resetTarget.id, data: { newPassword } }, {
      onSuccess: () => {
        const worker = workers?.find(w => w.id === resetTarget.id);
        setSavedPassword({ name: resetTarget.name, email: worker?.email ?? "", password: newPassword });
        setResetTarget(null);
        setNewPassword("");
        toast({ title: "Password updated" });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to reset password", description: err.message });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading workers…
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2 italic">
        No workers assigned yet.{" "}
        <Link href="/ngos/new" className="text-primary underline-offset-2 hover:underline">Add one →</Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {workers.map((worker) => (
        <div key={worker.id} className="rounded-md border bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{worker.name}</span>
            </div>
            {worker.email && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{worker.email}</span>
                <button
                  onClick={() => copyToClipboard(worker.email!)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  title="Copy email"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs h-7 gap-1"
            onClick={() => {
              setResetTarget({ id: worker.id, name: worker.name });
              setNewPassword("");
              setShowPw(false);
            }}
          >
            <KeyRound className="h-3 w-3" />
            Reset Password
          </Button>
        </div>
      ))}

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetTarget?.name}</DialogTitle>
            <DialogDescription>
              Set a new password for this worker. Share it with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-pw">New Password</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showPw ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-destructive">Must be at least 6 characters</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button
              onClick={handleReset}
              disabled={newPassword.length < 6 || resetPassword.isPending}
            >
              {resetPassword.isPending ? "Updating…" : "Set New Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-reset credentials summary */}
      <Dialog open={!!savedPassword} onOpenChange={(open) => { if (!open) setSavedPassword(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Updated</DialogTitle>
            <DialogDescription>
              Share these credentials with {savedPassword?.name} so they can log in.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted p-4 space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p>{savedPassword?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(savedPassword?.email ?? "")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">New Password</p>
                <p>{savedPassword?.password}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(savedPassword?.password ?? "")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            NGO portal: <span className="font-mono">{window.location.origin}/ngo-portal/</span>
          </p>
          <DialogFooter>
            <Button onClick={() => setSavedPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PUBLIC_STOCK_NGO_NAME = "CycleCare Charity";
const PUBLIC_STOCK_NGO_EMAIL = "donations@cyclecare.org";
const PUBLIC_STOCK_NGO_REGION = "all";
const PUBLIC_STOCK_NGO_STATE = "all";

export default function NgoList() {
  const { data: ngos, isLoading, error } = useAdminListNgos();
  const createNgo = useAdminCreateNgo();
  const deleteNgo = useAdminDeleteNgo();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferNgoId, setTransferNgoId] = useState<string>("");
  const [transferQty, setTransferQty] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleDelete = (id: number) => {
    deleteNgo.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "NGO partner deleted" });
        queryClient.invalidateQueries({ queryKey: getAdminListNgosQueryKey() });
        if (expandedId === id) setExpandedId(null);
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to delete NGO partner", description: err.message });
      },
    });
  };

  const handleCreatePublicStockNgo = () => {
    if (createNgo.isPending) return;
    createNgo.mutate({
      data: {
        name: PUBLIC_STOCK_NGO_NAME,
        region: PUBLIC_STOCK_NGO_REGION,
        state: PUBLIC_STOCK_NGO_STATE,
        contactEmail: PUBLIC_STOCK_NGO_EMAIL,
        monthlyQuota: 0,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Public stock NGO created" });
        queryClient.invalidateQueries({ queryKey: getAdminListNgosQueryKey() });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to create public stock NGO", description: err.message });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NGO Partners</h1>
            <p className="text-muted-foreground mt-1">Manage partner organizations and quotas</p>
          </div>
          <Button disabled><Plus className="mr-2 h-4 w-4" /> Add Partner</Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !ngos) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-red-50/50 rounded-lg border border-destructive/20 text-center">
        <Building2 className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load partners</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const publicStockNgos = ngos.filter((ngo) => ngo.name === PUBLIC_STOCK_NGO_NAME);
  const publicStockNgo = publicStockNgos[0] ?? null;
  const duplicatePublicStockNgos = publicStockNgos.slice(1);
  const partnerNgos = ngos;
  const transferTargetNgos = publicStockNgo ? ngos.filter((ngo) => ngo.id !== publicStockNgo.id) : ngos;

  const handleTransferStock = async () => {
    if (!publicStockNgo) return;

    const quantity = Number(transferQty);
    const targetId = Number(transferNgoId);

    if (!targetId || !Number.isInteger(quantity) || quantity < 1) {
      toast({ variant: "destructive", title: "Enter a valid quantity and target NGO" });
      return;
    }

    if (quantity > publicStockNgo.availablePads) {
      toast({ variant: "destructive", title: "Quantity exceeds public stock available" });
      return;
    }

    setIsTransferring(true);

    try {
      const response = await fetch(getApiUrl("/api/admin/ngos/transfer-stock"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") ?? ""}`,
        },
        body: JSON.stringify({ toNgoId: targetId, quantity }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to transfer stock");
      }

      toast({ title: `Transferred ${quantity} pads to ${payload.toNgo.name}` });
      queryClient.invalidateQueries({ queryKey: getAdminListNgosQueryKey() });
      setTransferOpen(false);
      setTransferNgoId("");
      setTransferQty("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      toast({ variant: "destructive", title: "Failed to transfer stock", description: message });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NGO Partners</h1>
          <p className="text-muted-foreground mt-1">Manage partner organizations and quotas</p>
        </div>
        <Link href="/ngos/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Link>
      </div>
      {duplicatePublicStockNgos.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          There are multiple "{PUBLIC_STOCK_NGO_NAME}" records. Only the first one is treated as the public stock entity. Remove duplicates so there is a single public stock NGO.
        </div>
      )}

      <Card className="border border-dashed border-primary/20">
        <CardHeader>
          <CardTitle>Public Stock — {PUBLIC_STOCK_NGO_NAME}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicStockNgo ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>This special NGO receives donated pads from user donations.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available stock</p>
                  <p className="text-2xl font-semibold">{publicStockNgo.availablePads}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Region</p>
                  <p>{publicStockNgo.region}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
                  <p>{publicStockNgo.contactEmail}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => setTransferOpen(true)}
                  disabled={transferTargetNgos.length === 0 || publicStockNgo.availablePads === 0}
                >
                  Transfer Stock
                </Button>
                {publicStockNgo.availablePads === 0 && (
                  <p className="text-xs text-red-600">Public stock is empty. Replenish before transferring.</p>
                )}
                {transferTargetNgos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add at least one partner NGO before transferring stock.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>The public stock NGO has not yet been created. It is created automatically after the first user donation, or you can create it manually now.</p>
              <Button onClick={handleCreatePublicStockNgo} disabled={createNgo.isPending}>
                {createNgo.isPending ? "Creating public stock…" : "Create public stock NGO"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={transferOpen} onOpenChange={(open) => { if (!open) { setTransferOpen(false); setTransferNgoId(""); setTransferQty(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Public Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="transfer-target">Choose recipient NGO</Label>
              <select
                id="transfer-target"
                value={transferNgoId}
                onChange={(event) => setTransferNgoId(event.target.value)}
                className="w-full rounded-md border p-3"
              >
                <option value="">Select an NGO</option>
                {transferTargetNgos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>{ngo.name} ({ngo.availablePads} available)</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-qty">Quantity</Label>
              <Input
                id="transfer-qty"
                type="number"
                min={1}
                value={transferQty}
                onChange={(event) => setTransferQty(event.target.value)}
                placeholder="Number of pads to transfer"
              />
              {publicStockNgo && transferQty && Number(transferQty) > publicStockNgo.availablePads && (
                <p className="text-xs text-red-600">Cannot transfer more than public stock available.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={isTransferring}>Cancel</Button>
            <Button
              onClick={handleTransferStock}
              disabled={isTransferring || !transferNgoId || !transferQty || Number(transferQty) < 1}
            >
              {isTransferring ? "Transferring…" : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {partnerNgos.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No partners found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Add your first NGO partner to start allocating sanitary pad quotas.
            </p>
            <Link href="/ngos/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> Add Partner
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partnerNgos.map((ngo) => {
            const isExpanded = expandedId === ngo.id;
            return (
              <Card key={ngo.id} className="flex flex-col border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono bg-muted">Quota: {ngo.monthlyQuota}</Badge>
                  </div>
                  <CardTitle className="text-xl mt-3">{ngo.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{ngo.state}, {ngo.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ngo.contactEmail}</span>
                    </div>
                  </div>

                  {/* Workers accordion */}
                  <div className="border-t pt-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ngo.id)}
                      className="flex items-center justify-between w-full text-sm font-medium text-left hover:text-primary transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Workers &amp; Login Details
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <div className="mt-3">
                        <WorkersPanel ngoId={ngo.id} />
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/20">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:border-destructive/20">
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Partner</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {ngo.name} from the system. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ngo.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
