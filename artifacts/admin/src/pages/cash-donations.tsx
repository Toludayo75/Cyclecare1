import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

type CashDonation = {
  id: number;
  amount: number;
  donorName: string;
  referenceNumber: string;
  transactionId: string;
  notes: string | null;
  createdAt: string;
};

async function fetchCashDonations() {
  const token = localStorage.getItem("admin_token");
  const response = await fetch(getApiUrl("/api/admin/cash-donations"), {
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load cash donations");
  }

  return response.json() as Promise<{ donations: CashDonation[] }>;
}

export default function CashDonationsPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "cash-donations"],
    queryFn: fetchCashDonations,
    staleTime: 1000 * 60,
  });

  const donations = useMemo(() => data?.donations ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Donations</h1>
          <p className="text-muted-foreground mt-1">View recent cash donations without exposing Paystack reference details.</p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <Card className="p-4 border-border/50">
        {isLoading && !data ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">Unable to load cash donations.</p>
            <p>Please refresh the page or try again later.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference Number</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No cash donations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation: CashDonation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{format(new Date(donation.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{donation.donorName}</TableCell>
                      <TableCell>₦{donation.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{donation.referenceNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{donation.transactionId}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
