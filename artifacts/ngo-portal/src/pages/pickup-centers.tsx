import { useState } from "react";
import {
  useListPickupCenters,
  useCreatePickupCenter,
  useUpdatePickupCenter,
  useDeletePickupCenter,
  getListPickupCentersQueryKey,
  type NgoPickupCenter,
  type PickupCenterInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

type FormState = Omit<PickupCenterInput, "landmark"> & { landmark: string };

const emptyForm = (): FormState => ({
  name: "",
  address: "",
  city: "",
  state: "",
  landmark: "",
});

export default function PickupCenters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingCenter, setEditingCenter] = useState<NgoPickupCenter | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: centers, isLoading } = useListPickupCenters();

  const createMutation = useCreatePickupCenter();
  const updateMutation = useUpdatePickupCenter();
  const deleteMutation = useDeletePickupCenter();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListPickupCentersQueryKey() });

  const openCreate = () => {
    setForm(emptyForm());
    setEditingCenter(null);
    setDialogMode("create");
  };

  const openEdit = (center: NgoPickupCenter) => {
    setForm({
      name: center.name,
      address: center.address,
      city: center.city,
      state: center.state,
      landmark: center.landmark ?? "",
    });
    setEditingCenter(center);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingCenter(null);
  };

  const handleSubmit = () => {
    const payload: PickupCenterInput = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      ...(form.landmark.trim() ? { landmark: form.landmark.trim() } : {}),
    };

    if (!payload.name || !payload.address || !payload.city || !payload.state) {
      toast({ variant: "destructive", title: "Please fill in all required fields" });
      return;
    }

    if (dialogMode === "create") {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Pickup center created" });
            invalidate();
            closeDialog();
          },
          onError: (err) => {
            toast({ variant: "destructive", title: "Failed to create", description: err.message });
          },
        }
      );
    } else if (dialogMode === "edit" && editingCenter) {
      updateMutation.mutate(
        { id: editingCenter.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Pickup center updated" });
            invalidate();
            closeDialog();
          },
          onError: (err) => {
            toast({ variant: "destructive", title: "Failed to update", description: err.message });
          },
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Pickup center deleted" });
          invalidate();
          setDeleteConfirmId(null);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Failed to delete", description: err.message });
        },
      }
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pickup Centers</h1>
          <p className="text-muted-foreground mt-1">
            Manage locations where users can collect their pads.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Pickup Center
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Loading pickup centers...</p>
      ) : !centers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No pickup centers yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add at least one pickup center before approving requests.
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Center
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <Card key={center.id} className="relative group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold leading-tight">{center.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {center.state}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-0.5 mb-4">
                  <p>{center.address}</p>
                  <p>{center.city}</p>
                  {center.landmark && (
                    <p className="italic">Near: {center.landmark}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => openEdit(center)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => setDeleteConfirmId(center.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialogMode} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add Pickup Center" : "Edit Pickup Center"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Ibadan Community Health Centre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Street Address <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 12 Ring Road"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Ibadan"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>State <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Oyo"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Landmark <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. Opposite First Bank, Dugbe"
                value={form.landmark}
                onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? dialogMode === "create"
                  ? "Creating..."
                  : "Saving..."
                : dialogMode === "create"
                ? "Create Center"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pickup Center</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            Are you sure you want to delete this pickup center? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
