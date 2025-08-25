<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NavItemSeeder extends Seeder
{
    public function run(): void
    {
        // Boleh dihapus kalau kamu ingin retain data lama:
        // DB::table('mst_nav_items')->truncate();

        // Helper: tambah / cari parent lalu kembalikan id-nya
        $addParent = function (string $label, string $slug, string $icon, int $order) {
            DB::table('mst_nav_items')->upsert([
                [
                    'label' => $label,
                    'slug' => $slug,
                    'icon' => $icon,
                    'parent_id' => null,
                    'order_number' => $order,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ], uniqueBy: ['slug'], update: [
                'label' => $label,
                'icon' => $icon,
                'order_number' => $order,
                'is_active' => true,
                'updated_at' => now(),
            ]);

            return (int) DB::table('mst_nav_items')->where('slug', $slug)->value('id');
        };

        // Helper: tambah child
        $addChild = function (int $parentId, string $label, string $slug, string $icon, int $order) {
            DB::table('mst_nav_items')->upsert([
                [
                    'label' => $label,
                    'slug' => $slug,
                    'icon' => $icon,
                    'parent_id' => $parentId,
                    'order_number' => $order,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ], uniqueBy: ['slug'], update: [
                'label' => $label,
                'icon' => $icon,
                'parent_id' => $parentId,
                'order_number' => $order,
                'is_active' => true,
                'updated_at' => now(),
            ]);
        };

        // =========================
        // MAIN BAR (Products, Users)
        // =========================

        // Products
        $productsId = $addParent('Products', 'products', 'Package', 0);
        $addChild($productsId, 'Products', 'products/all', 'Package', 0);
        $addChild($productsId, 'Feature Product', 'feature-product', 'Zap', 1);
        $addChild($productsId, 'Package Product', 'package-product', 'Box', 2);
        $addChild($productsId, 'Matrix Package', 'matrix-package', 'Grid3X3', 3);
        $addChild($productsId, 'Durasi', 'durasi', 'Clock', 4);
        $addChild($productsId, 'Pricelist', 'pricelist', 'DollarSign', 5);

        // Users
        $usersId = $addParent('Users', 'users', 'Users', 1);
        $addChild($usersId, 'Level User', 'level-user', 'Shield', 0);
        $addChild($usersId, 'Matrix Level', 'matrix-level', 'Grid3X3', 1);
        $addChild($usersId, 'Data User', 'data-user', 'UserCheck', 2);

        // =========================
        // MORE DROPDOWN (Accordion groups)
        // =========================

        // Dashboard
        $dashboardId = $addParent('Dashboard', 'dashboard', 'LayoutDashboard', 2);
        $addChild($dashboardId, 'Overview', 'dashboard/overview', 'LayoutDashboard', 0);
        $addChild($dashboardId, 'Analytics', 'dashboard/analytics', 'BarChart3', 1);

        // Customers
        $customersId = $addParent('Customers', 'customers', 'Users', 3);
        $addChild($customersId, 'Segmentation', 'customers/segmentation', 'UserCheck', 0);
        $addChild($customersId, 'History', 'customers/history', 'History', 1);
        $addChild($customersId, 'Support', 'customers/support', 'MessageSquare', 2);

        // Finance
        $financeId = $addParent('Finance', 'finance', 'DollarSign', 4);
        $addChild($financeId, 'Billing', 'finance/invoices', 'Receipt', 0);
        $addChild($financeId, 'Invoices', 'finance/payments', 'FileText', 1);
        $addChild($financeId, 'Refunds', 'finance/subscriptions', 'RefreshCw', 2);

        // Reports
        $reportsId = $addParent('Reports', 'reports', 'FileText', 5);
        $addChild($reportsId, 'Sales Reports', 'reports/sales', 'TrendingUp', 0);
        $addChild($reportsId, 'Customer Reports', 'reports/customers', 'Users', 1);
        $addChild($reportsId, 'Financial Reports', 'reports/financial', 'DollarSign', 2);

        // Billing
        $billingId = $addParent('Billing', 'billing', 'CreditCard', 6);
        $addChild($billingId, 'Subscriptions', 'billing/subscriptions', 'RefreshCw', 0);
        $addChild($billingId, 'Payment Methods', 'billing/payment-methods', 'CreditCard', 1);
        $addChild($billingId, 'Billing History', 'billing/history', 'History', 2);

        // Integrations
        $integrationsId = $addParent('Integrations', 'integrations', 'Plug', 7);
        $addChild($integrationsId, 'Payment Gateways', 'integrations/payment-gateways', 'CreditCard', 0);
        $addChild($integrationsId, 'WhatsApp/Email', 'integrations/whatsapp-email', 'MessageSquare', 1);
        $addChild($integrationsId, 'API Keys', 'integrations/api-keys', 'Key', 2);

        // Settings
        $settingsId = $addParent('Settings', 'settings', 'Settings', 8);
        $addChild($settingsId, 'Store Settings', 'settings/store', 'Store', 0);
        $addChild($settingsId, 'Roles & Access', 'settings/roles', 'Shield', 1);
        $addChild($settingsId, 'System', 'settings/system', 'Settings', 2);

        // Help & Support
        $helpId = $addParent('Help & Support', 'help', 'HelpCircle', 9);
        $addChild($helpId, 'Documentation', 'help/docs', 'FileText', 0);
        $addChild($helpId, 'Tutorials', 'help/tutorials', 'Star', 1);
        $addChild($helpId, 'Contact Support', 'help/contact', 'MessageSquare', 2);
    }
}
