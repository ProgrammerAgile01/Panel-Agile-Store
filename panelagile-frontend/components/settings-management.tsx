"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Bell, Shield, Upload, Save, RefreshCw, Eye, EyeOff, Smartphone, Globe, Palette } from "lucide-react"

export function SettingsManagement() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  const brandingSettings = {
    storeName: "Agile Store",
    tagline: "Premium Digital Products",
    primaryColor: "#0e4c92",
    secondaryColor: "#4caf50",
    logo: "/placeholder.svg?height=80&width=200",
    favicon: "/placeholder.svg?height=32&width=32",
  }

  const notificationSettings = [
    { id: "new-orders", label: "New Orders", description: "Get notified when new orders are placed", enabled: true },
    {
      id: "low-stock",
      label: "Low Stock Alerts",
      description: "Alert when product inventory is running low",
      enabled: true,
    },
    {
      id: "customer-signup",
      label: "New Customer Signups",
      description: "Notification for new customer registrations",
      enabled: false,
    },
    {
      id: "payment-failed",
      label: "Failed Payments",
      description: "Alert when customer payments fail",
      enabled: true,
    },
    {
      id: "subscription-expiry",
      label: "Subscription Expiry",
      description: "Remind about upcoming subscription renewals",
      enabled: true,
    },
  ]

  const authenticationMethods = [
    { id: "password", label: "Password", description: "Standard password authentication", enabled: true },
    { id: "2fa", label: "Two-Factor Authentication", description: "SMS or app-based 2FA", enabled: twoFactorEnabled },
    { id: "sso", label: "Single Sign-On", description: "Enterprise SSO integration", enabled: false },
    { id: "oauth", label: "OAuth Providers", description: "Google, GitHub, etc.", enabled: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Settings</h1>
          <p className="text-muted-foreground">Configure your store and system preferences</p>
        </div>
        <Button className="glow-primary">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Quick Settings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Store Status</p>
                <p className="font-semibold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism glow-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security</p>
                <p className="font-semibold">2FA Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notifications</p>
                <p className="font-semibold">5 Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Globe className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Integrations</p>
                <p className="font-semibold">8 Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="glass-morphism">
          <TabsTrigger value="branding">Store Branding</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input id="store-name" defaultValue={brandingSettings.storeName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" defaultValue={brandingSettings.tagline} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your store and what makes it unique..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Colors & Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primary-color" defaultValue={brandingSettings.primaryColor} />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: brandingSettings.primaryColor }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input id="secondary-color" defaultValue={brandingSettings.secondaryColor} />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: brandingSettings.secondaryColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Logo</Label>
                    <div className="flex items-center gap-4">
                      <img
                        src={brandingSettings.logo || "/placeholder.svg"}
                        alt="Store Logo"
                        className="h-12 w-auto border rounded"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <div className="flex items-center gap-4">
                      <img
                        src={brandingSettings.favicon || "/placeholder.svg"}
                        alt="Favicon"
                        className="h-8 w-8 border rounded"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 border rounded-lg bg-card/50">
                <div className="flex items-center gap-4 mb-4">
                  <img src={brandingSettings.logo || "/placeholder.svg"} alt="Logo" className="h-8 w-auto" />
                  <div>
                    <h3 className="font-bold text-lg">{brandingSettings.storeName}</h3>
                    <p className="text-sm text-muted-foreground">{brandingSettings.tagline}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button style={{ backgroundColor: brandingSettings.primaryColor }} className="text-white">
                    Primary Button
                  </Button>
                  <Button
                    variant="outline"
                    style={{ borderColor: brandingSettings.secondaryColor, color: brandingSettings.secondaryColor }}
                  >
                    Secondary Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input id="notification-email" type="email" placeholder="admin@agilestore.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div>
                      <Label htmlFor={setting.id}>{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch id={setting.id} defaultChecked={setting.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-morphism glow-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch id="two-factor" checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                </div>

                {twoFactorEnabled && (
                  <Card className="glass-morphism border-accent/30">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">Authenticator App Connected</span>
                          <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                          <Button size="sm" variant="outline">
                            Backup Codes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Select defaultValue="60">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Authentication Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {authenticationMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div>
                      <Label htmlFor={method.id}>{method.label}</Label>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <Switch id={method.id} defaultChecked={method.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>API Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Master API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    defaultValue="sk_live_1234567890abcdef"
                    readOnly
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold text-green-500">1,234</div>
                  <p className="text-sm text-muted-foreground">API Calls Today</p>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold text-blue-500">99.9%</div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-lg">
                  <div className="text-lg font-bold text-accent">5</div>
                  <p className="text-sm text-muted-foreground">Active Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>General Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="gmt">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="idr">IDR (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Indonesian</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium">v2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm font-medium">2024-01-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <Badge className="bg-green-500/20 text-green-500">Healthy</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
