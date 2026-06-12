import { useState } from "react";
import {
  useNgoListRequests,
  useNgoApproveRequest,
  useNgoRejectRequest,
  useNgoMarkRequestReady,
  useListPickupCenters,
  getNgoListRequestsQueryKey,
  type NgoListRequestsStatus,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Requests() {
  const [statusFilter, setStatusFilter] = useState<NgoListRequestsStatus | "all">("all");
  const [approveDialogId, setApproveDialogId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: requests, isLoading } = useNgoListRequests(
    statusFilter !== "all" ? { status: statusFilter } : {}
  );
  const { data: pickupCenters } = useListPickupCenters();

  const approveMutation = useNgoApproveRequest();
  const rejectMutation = useNgoRejectRequest();
  const markReadyMutation = useNgoMarkRequestReady();

  const openApproveDialog = (id: number) => {
    setApproveDialogId(id);
    setSelectedCenterId("");
  };

  const closeApproveDialog = () => {
    setApproveDialogId(null);
    setSelectedCenterId("");
  };

  const handleApprove = () => {
    if (!approveDialogId || !selectedCenterId) return;

    const center = pickupCenters?.find((c) => String(c.id) === selectedCenterId);
    if (!center) return;

    const pickupLocation = `${center.name}, ${center.address}, ${center.city}, ${center.state}`;

    approveMutation.mutate(
      { id: approveDialogId, data: { pickupCenterId: center.id, pickupLocation } },
      {
        onSuccess: () => {
          toast({ title: "Request approved successfully" });
          closeApproveDialog();
          queryClient.invalidateQueries({ queryKey: getNgoListRequestsQueryKey() });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Failed to approve request",
            description: err.message,
          });
        },
      }
    );
  };

  const handleReject = (id: number) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Request rejected" });
          queryClient.invalidateQueries({ queryKey: getNgoListRequestsQueryKey() });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Failed to reject request",
            description: err.message,
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>;
      case "ready":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Ready</Badge>;
      case "collected":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Collected</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const noCenters = pickupCenters !== undefined && pickupCenters.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground mt-1">Manage menstrual pad requests from users.</p>
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {noCenters && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            You have no pickup centers configured. You'll need to{" "}
            <Link href="/pickup-centers" className="underline font-medium">
              add at least one
            </Link>{" "}
            before you can approve requests.
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pickup Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : !requests?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(req.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{req.userName}</div>
                      {req.userEmail && (
                        <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.userState || req.userCity || req.userAddress ? (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {req.userAddress && <div>{req.userAddress}</div>}
                          {(req.userCity || req.userState) && (
                            <div>
                              {[req.userCity, req.userState].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>{req.quantity} pads</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.pickupCode && (
                        <div className="text-sm">
                          <span className="font-semibold text-primary">{req.pickupCode}</span>
                          <span className="text-muted-foreground block text-xs">{req.pickupLocation}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => openApproveDialog(req.id)}
                            disabled={noCenters}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleReject(req.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.status === "approved" && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            disabled={markReadyMutation.isPending}
                            onClick={() => {
                              markReadyMutation.mutate(
                                { id: req.id },
                                {
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({ queryKey: getNgoListRequestsQueryKey() });
                                    toast({ title: "Marked as ready for pickup" });
                                  },
                                  onError: (err) => {
                                    toast({ variant: "destructive", title: "Failed to mark ready", description: err.message });
                                  },
                                }
                              );
                            }}
                          >
                            Mark Ready
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialogId} onOpenChange={(open) => !open && closeApproveDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Pickup Center</Label>
              {!pickupCenters?.length ? (
                <p className="text-sm text-muted-foreground">
                  No pickup centers available.{" "}
                  <Link href="/pickup-centers" className="underline text-primary">
                    Add one first.
                  </Link>
                </p>
              ) : (
                <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pickup center…" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupCenters.map((center) => (
                      <SelectItem key={center.id} value={String(center.id)}>
                        <span className="font-medium">{center.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          — {center.city}, {center.state}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedCenterId && (() => {
                const c = pickupCenters?.find((x) => String(x.id) === selectedCenterId);
                return c ? (
                  <div className="flex items-start gap-2 text-sm bg-muted/40 rounded-md p-3">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <div className="text-muted-foreground">
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div>{c.address}</div>
                      <div>{c.city}, {c.state}</div>
                      {c.landmark && <div className="italic">Near: {c.landmark}</div>}
                    </div>
                  </div>
                ) : null;
              })()}

              <p className="text-xs text-muted-foreground">
                The selected location and a generated pickup code will be shared with the user.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeApproveDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!selectedCenterId || approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
