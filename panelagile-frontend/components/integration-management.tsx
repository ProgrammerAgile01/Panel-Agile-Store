"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Webhook,
  Key,
  MessageSquare,
  Plus,
  Settings,
  CheckCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Zap,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  status: "Connected" | "Disconnected" | "Error"
  category: "Communication" | "Payment" | "Analytics" | "Storage"
  lastSync?: string
  apiCalls?: number
}

const integrations: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Send automated messages and notifications",
    status: "Connected",
    category: "Communication",
    lastSync: "2024-01-20 14:30",
    apiCalls: 1234,
  },
  {
    id: "sendgrid",
    name: "SendGrid Email",
    description: "Transactional and marketing emails",
    status: "Connected",
    category: "Communication",
    lastSync: "2024-01-20 15:45",
    apiCalls: 5678,
  },
  {
    id: "stripe",
    name: "Stripe Payments",
    description: "Process payments and subscriptions",
    status: "Connected",
    category: "Payment",
    lastSync: "2024-01-20 16:00",
    apiCalls: 890,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website and app analytics",
    status: "Disconnected",
    category: "Analytics",
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "File storage and CDN",
    status: "Error",
    category: "Storage",
    lastSync: "2024-01-19 10:15",
  },
]

const apiKeys = [
  {
    id: "1",
    name: "Production API",
    key: "sk_live_1234567890abcdef",
    permissions: ["read", "write", "admin"],
    lastUsed: "2024-01-20 16:30",
    calls: 15420,
  },
  {
    id: "2",
    name: "Mobile App",
    key: "sk_live_abcdef1234567890",
    permissions: ["read", "write"],
    lastUsed: "2024-01-20 15:45",
    calls: 8760,
  },
  {
    id: "3",
    name: "Analytics Dashboard",
    key: "sk_live_fedcba0987654321",
    permissions: ["read"],
    lastUsed: "2024-01-20 14:20",
    calls: 3240,
  },
]

export function IntegrationManagement() {
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({})

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Connected":
        return <Badge className="bg-green-500/20 text-green-500">Connected</Badge>
      case "Disconnected":
        return <Badge className="bg-gray-500/20 text-gray-500">Disconnected</Badge>
      case "Error":
        return <Badge className="bg-red-500/20 text-red-500">Error</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Communication":
        return <MessageSquare className="h-4 w-4" />
      case "Payment":
        return <Key className="h-4 w-4" />
      case "Analytics":
        return <Zap className="h-4 w-4" />
      case "Storage":
        return <Settings className="h-4 w-4" />
      default:
        return <Webhook className="h-4 w-4" />
    }
  }

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const connectedIntegrations = integrations.filter((i) => i.status === "Connected").length
  const totalApiCalls = integrations.reduce((sum, i) => sum + (i.apiCalls || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Integrations</h1>
          <p className="text-muted-foreground">Manage API keys and third-party integrations</p>
        </div>
        <Button className="glow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism glow-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="font-semibold">{connectedIntegrations} Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Calls</p>
                <p className="font-semibold">{totalApiCalls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Key className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="font-semibold">{apiKeys.length} Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-semibold">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="glass-morphism">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(integration.category)}
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>

                  {integration.status === "Connected" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span>{integration.lastSync}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">API Calls</span>
                        <span className="font-medium">{integration.apiCalls?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {integration.status === "Connected" ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1 glow-primary">
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Keys</CardTitle>
                <Button size="sm" className="glow-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{apiKey.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Last used: {apiKey.lastUsed} • {apiKey.calls.toLocaleString()} calls
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {apiKey.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={showApiKeys[apiKey.id] ? apiKey.key : "••••••••••••••••"}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button variant="outline" size="sm" onClick={() => toggleApiKeyVisibility(apiKey.id)}>
                            {showApiKeys[apiKey.id] ? "Hide" : "Show"}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
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

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Webhook Endpoints</CardTitle>
                <Button size="sm" className="glow-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    url: "https://api.example.com/webhooks/orders",
                    events: ["order.created", "order.updated"],
                    status: "Active",
                  },
                  {
                    url: "https://analytics.example.com/webhook",
                    events: ["customer.created", "payment.succeeded"],
                    status: "Active",
                  },
                  {
                    url: "https://crm.example.com/webhook",
                    events: ["subscription.cancelled"],
                    status: "Inactive",
                  },
                ].map((webhook, index) => (
                  <Card key={index} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{webhook.url}</code>
                            <Badge
                              className={
                                webhook.status === "Active"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-gray-500/20 text-gray-500"
                              }
                            >
                              {webhook.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
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

        <TabsContent value="logs" className="space-y-6">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    time: "2024-01-20 16:30",
                    action: "API Key accessed",
                    details: "Production API key used for order creation",
                    status: "success",
                  },
                  {
                    time: "2024-01-20 16:25",
                    action: "WhatsApp message sent",
                    details: "Order confirmation sent to +1234567890",
                    status: "success",
                  },
                  {
                    time: "2024-01-20 16:20",
                    action: "Webhook delivery failed",
                    details: "Failed to deliver to https://api.example.com/webhook",
                    status: "error",
                  },
                  {
                    time: "2024-01-20 16:15",
                    action: "Integration connected",
                    details: "SendGrid email service connected successfully",
                    status: "success",
                  },
                ].map((log, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-card/50 rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-sm text-muted-foreground">{log.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
