import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useAdminCreateNgo, useAdminAddNgoWorker } from "@workspace/api-client-react";
import { getApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, UserPlus, CheckCircle2, Copy } from "lucide-react";
import { Link } from "wouter";

const ngoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  region: z.string().min(2, "Region is required"),
  state: z.string().min(2, "State is required"),
  contactEmail: z.string().email("Valid email is required"),
  monthlyQuota: z.coerce.number().min(0, "Quota must be 0 or more").default(100),
});

const workerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function NewNgo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createNgo = useAdminCreateNgo();
  const addWorker = useAdminAddNgoWorker();
  
  const [createdNgoId, setCreatedNgoId] = useState<number | null>(null);
  const [createdNgoName, setCreatedNgoName] = useState("");
  const [isCreatingWorker, setIsCreatingWorker] = useState(false);
  const [workerCreated, setWorkerCreated] = useState<{ email: string; password: string } | null>(null);

  const form = useForm<z.infer<typeof ngoSchema>>({
    resolver: zodResolver(ngoSchema),
    defaultValues: { name: "", region: "", state: "", contactEmail: "", monthlyQuota: 100 },
  });

  const workerForm = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmitNgo = (data: z.infer<typeof ngoSchema>) => {
    createNgo.mutate({ data }, {
      onSuccess: (res) => {
        toast({ title: "NGO partner created" });
        setCreatedNgoId(res.id);
        setCreatedNgoName(res.name);
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to create partner", description: err.message });
      },
    });
  };

  const onSubmitWorker = async (data: z.infer<typeof workerSchema>) => {
    if (!createdNgoId) return;
    setIsCreatingWorker(true);
    try {
      // Step 1: create a new user account via the register endpoint
      const regRes = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      if (!regRes.ok) {
        const body = await regRes.json().catch(() => ({}));
        throw new Error((body as any).error ?? "Registration failed");
      }
      const { user } = await regRes.json() as { user: { id: number } };

      // Step 2: link user to the NGO (this also sets their role to "ngo")
      await new Promise<void>((resolve, reject) => {
        addWorker.mutate({ id: createdNgoId, data: { userId: user.id } }, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });

      setWorkerCreated({ email: data.email, password: data.password });
      toast({ title: "Worker account created and linked to NGO" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ variant: "destructive", title: "Failed to create worker", description: message });
    } finally {
      setIsCreatingWorker(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/ngos" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Back to partners</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add NGO Partner</h1>
          <p className="text-muted-foreground mt-1">Register a new organization and create worker login</p>
        </div>
      </div>

      {/* Step 1 — NGO details */}
      {!createdNgoId && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitNgo)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Women's Health Initiative" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl><Input placeholder="e.g. Lagos" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region / LGA</FormLabel>
                      <FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl><Input type="email" placeholder="contact@org.org" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="monthlyQuota" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Pad Quota</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormDescription>Max packages per month</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createNgo.isPending}>
                    {createNgo.isPending ? "Creating..." : "Create Partner"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Create worker login */}
      {createdNgoId && !workerCreated && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <UserPlus className="h-5 w-5" />
              Create Worker Login for {createdNgoName}
            </CardTitle>
            <CardDescription className="text-green-700/70">
              Set up login credentials for the NGO field worker. They'll use these to sign into the NGO portal. Share them securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...workerForm}>
              <form onSubmit={workerForm.handleSubmit(onSubmitWorker)} className="space-y-5">
                <FormField control={workerForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Amaka Okonkwo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={workerForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl><Input type="email" placeholder="worker@ngo.org" {...field} /></FormControl>
                    <FormDescription>This is what they'll use to sign into the NGO portal</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={workerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl><Input type="text" placeholder="Set a password for them" {...field} /></FormControl>
                    <FormDescription>Ask them to change this after first login</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/ngos")}>
                    Skip for now
                  </Button>
                  <Button type="submit" disabled={isCreatingWorker}>
                    {isCreatingWorker ? "Creating account..." : "Create Worker Account"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Credentials summary */}
      {workerCreated && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              Worker Account Created
            </CardTitle>
            <CardDescription>
              Share these credentials with the NGO worker so they can log into the NGO portal. Store them somewhere safe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-background p-4 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Login Email</p>
                  <p className="font-medium">{workerCreated.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(workerCreated.email)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
                  <p className="font-medium">{workerCreated.password}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(workerCreated.password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              NGO portal login: <span className="font-mono">{window.location.origin}/ngo-portal/</span>
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setLocation("/ngos")}>Done — Back to Partners</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
