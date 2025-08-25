"use client";

import { useState } from "react";

// Header sudah auto-fetch /api/nav-items di dalamnya,
// props tetap sama agar tidak mengubah UI/komponen lain.
import { UnifiedHeader } from "@/components/unified-header";

// Halaman/konten yang sudah ada — tidak diubah.
import { DashboardOverview } from "@/components/dashboard-overview";
import { ProductManagement } from "@/components/product-management";
import { CustomerManagement } from "@/components/customer-management";
import { AnalyticsManagement } from "@/components/analytics-management";
import { SettingsManagement } from "@/components/settings-management";
import { IntegrationManagement } from "@/components/integration-management";
import { LoginForm } from "@/components/login-form";
import { FeatureProductSplit } from "@/components/feature-product-split";
import { PackageProductSplit } from "@/components/package-product-split";
import { MatrixPackageSplit } from "@/components/matrix-package-split";
import { LevelUser } from "@/components/level-user";
import { MatrixLevel } from "@/components/matrix-level";
import { DataUser } from "@/components/data-user";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const handleLogin = (email: string, password: string) => {
    // Simple demo authentication
    if (email === "admin@agilestore.com" && password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials. Use: admin@agilestore.com / admin123");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage("dashboard");
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardOverview />;
      case "products":
      case "packages":
      case "categories":
      case "coupons":
        return <ProductManagement />;
      case "customers":
        return <CustomerManagement />;
      case "analytics":
        return <AnalyticsManagement />;
      case "feature-product":
        return <FeatureProductSplit />;
      case "package-product":
        return <PackageProductSplit />;
      case "matrix-package":
        return <MatrixPackageSplit />;
      case "level-user":
        return <LevelUser />;
      case "matrix-level":
        return <MatrixLevel />;
      case "data-user":
        return <DataUser />;
      case "settings":
        return <SettingsManagement />;
      case "integrations":
        return <IntegrationManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={handleLogout}
      />

      <main className="pt-16 p-6">{renderContent()}</main>
    </div>
  );
}
