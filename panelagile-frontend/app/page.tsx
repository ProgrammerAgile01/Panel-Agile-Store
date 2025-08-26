"use client";

import { useEffect, useState } from "react";

// Header tetap sama (auto-fetch /api/nav-items di dalamnya)
import { UnifiedHeader } from "@/components/unified-header";
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

// API helpers
import { login as apiLogin, me as apiMe, logout as apiLogout } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Cek sesi di awal
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = getToken();
        if (token) {
          await apiMe(); // validasi token + siapkan header auto-fetch
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        // token invalid
        clearToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      // page.tsx -> handleLogin
const data = await apiLogin(email, password);

      // Jika API mengirim default_homepage level aktif, gunakan itu
      const defaultPage = data?.current_level?.default_homepage || "dashboard";
      setActivePage(defaultPage);
      setIsAuthenticated(true);
    } catch (e: any) {
      alert(`Login gagal: ${e?.message || "Unknown error"}`);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // abaikan error; tetap logout local
    } finally {
      clearToken();
      setIsAuthenticated(false);
      setActivePage("dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

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
