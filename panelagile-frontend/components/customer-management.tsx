"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  AlertTriangle,
  Star,
  Send,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

/** ==================  API types (dengan field opsional baru) ================== */
type APICustomer = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  is_active: boolean;
  profile_photo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // Enrichment dari backend (opsional):
  subscription_status?: "Active" | "Expired" | "Churned"; // jika ada, dipakai langsung
  product_code?: string | null;
  package_code?: string | null;
  current_package?: string | null;
  current_package_code?: string | null;

  // Tambahan agar FE bisa hitung Expired jika subscription_status tidak dikirim
  current_is_active?: boolean | null;
  current_end_date?: string | null; // "YYYY-MM-DD" atau ISO

  last_order_updated?: string | null; // "YYYY-MM-DD..."
  revenue_paid?: number | null;
};

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "Trial" | "Active" | "Expired" | "Churned";
  package: string;
  joinDate: string;
  lastActive: string;
  revenue: number;
  supportTickets: number;
  satisfaction: number;
}

interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  created: string;
  lastUpdate: string;
}

const mockTickets: SupportTicket[] = [
  {
    id: "1",
    customerId: "0",
    customerName: "Sample Customer",
    subject: "Contoh tiket dukungan",
    status: "Open",
    priority: "Medium",
    created: "2025-09-01",
    lastUpdate: "2025-09-03",
  },
];

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("All");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Customer[]>([]);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const base = API_URL.replace(/\/$/, "");
      const url = new URL(`${base}/customer-subscriptions`);
      // (filter server-side opsional)

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json().catch(() => ({}));
      const apiData: APICustomer[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const todayStr = new Date().toISOString().slice(0, 10);

      const mapped: Customer[] = apiData.map((c, idx) => {
        const name = c.full_name || "Unnamed";

        // ====== PENENTUAN STATUS YANG DIBETULKAN ======
        // 1) Jika backend sudah kirim subscription_status, pakai langsung
        let status: Customer["status"] =
          (c.subscription_status as Customer["status"]) ??
          (c.is_active ? "Active" : "Churned");

        // 2) Fallback: hitung dari is_active/end_date jika subscription_status tidak ada
        if (!c.subscription_status) {
          const isActiveNow = c.current_is_active ?? c.is_active ?? false;
          const endStr = (c.current_end_date || "").slice(0, 10) || null;

          if (isActiveNow) {
            status = "Active";
          } else if (endStr && endStr < todayStr) {
            status = "Expired";
          } else {
            status = "Churned";
          }
        }
        // =================================================

        const joinDate = c.created_at
          ? new Date(c.created_at).toISOString().slice(0, 10)
          : "";
        const lastActive =
          c.last_order_updated && c.last_order_updated.length >= 10
            ? c.last_order_updated.slice(0, 10)
            : c.updated_at
            ? new Date(c.updated_at).toISOString().slice(0, 10)
            : "";

        return {
          id: String(c.id ?? idx + 1),
          name,
          email: c.email || "",
          avatar: c.profile_photo_url || undefined,
          status,
          package: c.current_package_code || c.current_package || "-",
          joinDate,
          lastActive,
          revenue: Number(c.revenue_paid ?? 0),
          supportTickets: 0,
          satisfaction: 0,
        };
      });

      setRows(mapped);
    } catch (e: any) {
      setError(e?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/20 text-green-500">Active</Badge>;
      case "Trial":
        return <Badge className="bg-blue-500/20 text-blue-500">Trial</Badge>;
      case "Expired":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500">Expired</Badge>
        );
      case "Churned":
        return <Badge className="bg-red-500/20 text-red-500">Churned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-500/20 text-red-500">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500/20 text-orange-500">High</Badge>;
      case "Medium":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>
        );
      case "Low":
        return <Badge className="bg-green-500/20 text-green-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-red-500/20 text-red-500">Open</Badge>;
      case "In Progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-500">In Progress</Badge>
        );
      case "Resolved":
        return (
          <Badge className="bg-green-500/20 text-green-500">Resolved</Badge>
        );
      case "Closed":
        return <Badge className="bg-gray-500/20 text-gray-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let data = rows;
    if (term) {
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.package || "").toLowerCase().includes(term)
      );
    }
    if (selectedSegment !== "All") {
      data = data.filter((c) => c.status === selectedSegment);
    }
    return data;
  }, [rows, searchTerm, selectedSegment]);

  const segments = useMemo(() => {
    const count = (s: Customer["status"]) =>
      rows.filter((c) => c.status === s).length;
    return [
      { name: "Active", count: count("Active"), color: "text-green-500" },
      { name: "Trial", count: count("Trial"), color: "text-blue-500" },
      { name: "Expired", count: count("Expired"), color: "text-yellow-500" },
      { name: "Churned", count: count("Churned"), color: "text-red-500" },
    ];
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage customers and support across all segments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="glow-primary">
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </Button>
          <Button variant="outline" onClick={loadCustomers} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism glow-accent animate-pulse-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="font-semibold">
                  {
                    rows.filter(
                      (c) => c.status === "Expired" || c.status === "Churned"
                    ).length
                  }{" "}
                  customers
                </p>
                <p className="text-xs text-accent">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="font-semibold">{rows.length.toLocaleString()}</p>
                <p className="text-xs text-green-500">Data from API</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Revenue</p>
                <p className="font-semibold">$0</p>
                <p className="text-xs text-green-500">Placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="font-semibold">—</p>
                <p className="text-xs text-blue-500">Placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {segments.map((segment) => (
              <Card
                key={segment.name}
                className={`glass-morphism cursor-pointer ${
                  selectedSegment === segment.name ? "ring-1 ring-primary" : ""
                }`}
                onClick={() => setSelectedSegment(segment.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${segment.color}`}>
                    {segment.count}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {segment.name}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card
              className={`glass-morphism cursor-pointer ${
                selectedSegment === "All" ? "ring-1 ring-primary" : ""
              }`}
              onClick={() => setSelectedSegment("All")}
            >
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold`}>{rows.length}</div>
                <p className="text-sm text-muted-foreground">All</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="glass-morphism border-red-300">
          <CardContent className="p-4 text-red-600 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Main */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="history">Subscription History</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card className="glass-morphism">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-muted-foreground"
                      >
                        Loading customers…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No customers found.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    filtered.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={customer.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.package}</Badge>
                        </TableCell>
                        <TableCell>
                          ${customer.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell>{customer.lastActive || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {customer.satisfaction || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {segments.map((segment) => (
              <Card key={segment.name} className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {segment.name} Customers
                    <Badge className={segment.color}>{segment.count}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rows
                      .filter((c) => c.status === segment.name)
                      .slice(0, 10)
                      .map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {customer.package}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${customer.revenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.lastActive || "-"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Support Tickets</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-red-500/20 text-red-500">
                    {mockTickets.filter((t) => t.status === "Open").length} Open
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-500">
                    {
                      mockTickets.filter((t) => t.status === "In Progress")
                        .length
                    }{" "}
                    In Progress
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTickets.map((ticket) => (
                  <Card key={ticket.id} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold">{ticket.subject}</h3>
                            <p className="text-sm text-muted-foreground">
                              {ticket.customerName} • Created {ticket.created}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(ticket.priority)}
                          {getTicketStatusBadge(ticket.status)}
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rows.map((customer) => (
                  <Card key={customer.id} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {customer.package} • Joined{" "}
                              {customer.joinDate || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">
                              ${customer.revenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total Revenue
                            </p>
                          </div>
                          {getStatusBadge(customer.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
