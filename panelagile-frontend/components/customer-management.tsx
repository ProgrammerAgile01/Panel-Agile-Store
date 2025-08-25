"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  avatar?: string
  status: "Trial" | "Active" | "Expired" | "Churned"
  package: string
  joinDate: string
  lastActive: string
  revenue: number
  supportTickets: number
  satisfaction: number
}

interface SupportTicket {
  id: string
  customerId: string
  customerName: string
  subject: string
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  priority: "Low" | "Medium" | "High" | "Critical"
  created: string
  lastUpdate: string
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    status: "Active",
    package: "Premium",
    joinDate: "2024-01-15",
    lastActive: "2024-01-20",
    revenue: 2340,
    supportTickets: 2,
    satisfaction: 4.8,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@example.com",
    status: "Trial",
    package: "Basic",
    joinDate: "2024-01-18",
    lastActive: "2024-01-19",
    revenue: 0,
    supportTickets: 0,
    satisfaction: 0,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    status: "Expired",
    package: "Business",
    joinDate: "2023-06-10",
    lastActive: "2024-01-10",
    revenue: 5680,
    supportTickets: 1,
    satisfaction: 4.2,
  },
  {
    id: "4",
    name: "David Kim",
    email: "david@example.com",
    status: "Churned",
    package: "Premium",
    joinDate: "2023-03-22",
    lastActive: "2023-12-15",
    revenue: 1890,
    supportTickets: 5,
    satisfaction: 2.1,
  },
]

const mockTickets: SupportTicket[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "Sarah Johnson",
    subject: "Unable to access premium features",
    status: "In Progress",
    priority: "High",
    created: "2024-01-19",
    lastUpdate: "2024-01-20",
  },
  {
    id: "2",
    customerId: "3",
    customerName: "Emily Rodriguez",
    subject: "Billing question about renewal",
    status: "Open",
    priority: "Medium",
    created: "2024-01-18",
    lastUpdate: "2024-01-18",
  },
  {
    id: "3",
    customerId: "4",
    customerName: "David Kim",
    subject: "Feature request for mobile app",
    status: "Closed",
    priority: "Low",
    created: "2024-01-10",
    lastUpdate: "2024-01-15",
  },
]

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegment, setSelectedSegment] = useState("All")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/20 text-green-500">Active</Badge>
      case "Trial":
        return <Badge className="bg-blue-500/20 text-blue-500">Trial</Badge>
      case "Expired":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Expired</Badge>
      case "Churned":
        return <Badge className="bg-red-500/20 text-red-500">Churned</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-500/20 text-red-500">Critical</Badge>
      case "High":
        return <Badge className="bg-orange-500/20 text-orange-500">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-500/20 text-green-500">Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-red-500/20 text-red-500">Open</Badge>
      case "In Progress":
        return <Badge className="bg-blue-500/20 text-blue-500">In Progress</Badge>
      case "Resolved":
        return <Badge className="bg-green-500/20 text-green-500">Resolved</Badge>
      case "Closed":
        return <Badge className="bg-gray-500/20 text-gray-500">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const customerSegments = [
    { name: "Active", count: mockCustomers.filter((c) => c.status === "Active").length, color: "text-green-500" },
    { name: "Trial", count: mockCustomers.filter((c) => c.status === "Trial").length, color: "text-blue-500" },
    { name: "Expired", count: mockCustomers.filter((c) => c.status === "Expired").length, color: "text-yellow-500" },
    { name: "Churned", count: mockCustomers.filter((c) => c.status === "Churned").length, color: "text-red-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Customer Management</h1>
          <p className="text-muted-foreground">Manage customers and support across all segments</p>
        </div>
        <Button className="glow-primary">
          <Send className="h-4 w-4 mr-2" />
          Send Campaign
        </Button>
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
                <p className="font-semibold">23 customers</p>
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
                <p className="font-semibold">5,678</p>
                <p className="text-xs text-green-500">+8% this month</p>
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
                <p className="font-semibold">$2,340</p>
                <p className="text-xs text-green-500">Per customer</p>
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
                <p className="font-semibold">4.2/5</p>
                <p className="text-xs text-blue-500">Average rating</p>
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
            {customerSegments.map((segment) => (
              <Card key={segment.name} className="glass-morphism">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${segment.color}`}>{segment.count}</div>
                  <p className="text-sm text-muted-foreground">{segment.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="history">Subscription History</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {/* Search and Filters */}
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

          {/* Customers Table */}
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
                  {mockCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.package}</Badge>
                      </TableCell>
                      <TableCell>${customer.revenue.toLocaleString()}</TableCell>
                      <TableCell>{customer.lastActive}</TableCell>
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
            {customerSegments.map((segment) => (
              <Card key={segment.name} className="glass-morphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {segment.name} Customers
                    <Badge className={segment.color}>{segment.count}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockCustomers
                      .filter((c) => c.status === segment.name)
                      .map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.package}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${customer.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{customer.lastActive}</p>
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
                    {mockTickets.filter((t) => t.status === "In Progress").length} In Progress
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
                {mockCustomers.map((customer) => (
                  <Card key={customer.id} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {customer.package} • Joined {customer.joinDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">${customer.revenue.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
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
  )
}
