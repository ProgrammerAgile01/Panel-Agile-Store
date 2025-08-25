"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, Plus, Settings, Users, TestTube, Shield, Database, Bell, Smartphone, BarChart3 } from "lucide-react"

interface Feature {
  id: string
  name: string
  description: string
  category: string
  status: "Active" | "Beta" | "Disabled"
  packages: ("Basic" | "Premium" | "Business" | "Enterprise")[]
  usage: number
}

interface FeatureGroup {
  id: string
  name: string
  features: string[]
  packages: string[]
  status: "Active" | "Draft"
}

const mockFeatures: Feature[] = [
  {
    id: "1",
    name: "Advanced Analytics",
    description: "Detailed insights and reporting dashboard",
    category: "Analytics",
    status: "Active",
    packages: ["Premium", "Business", "Enterprise"],
    usage: 85,
  },
  {
    id: "2",
    name: "API Access",
    description: "RESTful API for third-party integrations",
    category: "Integration",
    status: "Active",
    packages: ["Business", "Enterprise"],
    usage: 67,
  },
  {
    id: "3",
    name: "White Label",
    description: "Custom branding and white-label options",
    category: "Branding",
    status: "Beta",
    packages: ["Enterprise"],
    usage: 23,
  },
  {
    id: "4",
    name: "Mobile App",
    description: "Native mobile application access",
    category: "Mobile",
    status: "Active",
    packages: ["Premium", "Business", "Enterprise"],
    usage: 92,
  },
]

const mockFeatureGroups: FeatureGroup[] = [
  {
    id: "1",
    name: "Core Features",
    features: ["Dashboard", "User Management", "Basic Reports"],
    packages: ["Basic", "Premium", "Business", "Enterprise"],
    status: "Active",
  },
  {
    id: "2",
    name: "Advanced Analytics",
    features: ["Advanced Analytics", "Custom Reports", "Data Export"],
    packages: ["Premium", "Business", "Enterprise"],
    status: "Active",
  },
  {
    id: "3",
    name: "Enterprise Suite",
    features: ["API Access", "White Label", "SSO", "Priority Support"],
    packages: ["Enterprise"],
    status: "Active",
  },
]

export function FeatureManagement() {
  const [features, setFeatures] = useState(mockFeatures)

  const toggleFeatureStatus = (featureId: string, packageName: string) => {
    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id === featureId) {
          const packages = feature.packages.includes(packageName as any)
            ? feature.packages.filter((pkg) => pkg !== packageName)
            : [...feature.packages, packageName as any]
          return { ...feature, packages }
        }
        return feature
      }),
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/20 text-green-500">Active</Badge>
      case "Beta":
        return <Badge className="bg-blue-500/20 text-blue-500">Beta</Badge>
      case "Disabled":
        return <Badge className="bg-gray-500/20 text-gray-500">Disabled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Analytics":
        return <BarChart3 className="h-4 w-4" />
      case "Integration":
        return <Database className="h-4 w-4" />
      case "Branding":
        return <Settings className="h-4 w-4" />
      case "Mobile":
        return <Smartphone className="h-4 w-4" />
      case "Security":
        return <Shield className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Feature Management</h1>
          <p className="text-muted-foreground">Control features across different packages</p>
        </div>
        <Button className="glow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {/* Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Features</p>
                <p className="font-semibold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism glow-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <TestTube className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beta Features</p>
                <p className="font-semibold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Used</p>
                <p className="font-semibold text-xs">Mobile App (92%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism animate-pulse-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ready for Release</p>
                <p className="font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="features" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="packages">Package Matrix</TabsTrigger>
          <TabsTrigger value="groups">Feature Groups</TabsTrigger>
          <TabsTrigger value="beta">Beta Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Features List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <Card key={feature.id} className="glass-morphism">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/20 rounded-lg">{getCategoryIcon(feature.category)}</div>
                          <div>
                            <h3 className="font-semibold">{feature.name}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(feature.status)}
                              <Badge variant="outline">{feature.category}</Badge>
                              <span className="text-xs text-muted-foreground">{feature.usage}% usage</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {feature.packages.map((pkg) => (
                            <Badge key={pkg} className="bg-accent/20 text-accent">
                              {pkg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Feature Package Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-center">Basic</TableHead>
                    <TableHead className="text-center">Premium</TableHead>
                    <TableHead className="text-center">Business</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(feature.category)}
                          <span className="font-medium">{feature.name}</span>
                        </div>
                      </TableCell>
                      {["Basic", "Premium", "Business", "Enterprise"].map((pkg) => (
                        <TableCell key={pkg} className="text-center">
                          <Switch
                            checked={feature.packages.includes(pkg as any)}
                            onCheckedChange={() => toggleFeatureStatus(feature.id, pkg)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockFeatureGroups.map((group) => (
              <Card key={group.id} className="glass-morphism">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {getStatusBadge(group.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Features ({group.features.length})</p>
                    <div className="space-y-1">
                      {group.features.map((feature) => (
                        <div key={feature} className="text-sm flex items-center gap-2">
                          <Zap className="h-3 w-3 text-accent" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Available in</p>
                    <div className="flex flex-wrap gap-1">
                      {group.packages.map((pkg) => (
                        <Badge key={pkg} variant="outline" className="text-xs">
                          {pkg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beta" className="space-y-4">
          <Card className="glass-morphism glow-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Beta Testing Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="glass-morphism">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-accent">5</div>
                      <p className="text-sm text-muted-foreground">Beta Features</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-morphism">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">127</div>
                      <p className="text-sm text-muted-foreground">Beta Testers</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-morphism">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">89%</div>
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {features
                    .filter((f) => f.status === "Beta")
                    .map((feature) => (
                      <Card key={feature.id} className="glass-morphism border-blue-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{feature.name}</h3>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                View Feedback
                              </Button>
                              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                Release
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
