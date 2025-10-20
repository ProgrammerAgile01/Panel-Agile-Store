"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Save,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// ===== API yang dipakai
import {
  getAgileSections,
  upsertAgileSections,
  type AgileSection,
  listCatalogProductsSlim,
  listPackagesByProduct,
  listDurationsActive,
  fetchMatrixByProduct,
  panelListFeaturesByProduct,
  getPricelistByProduct,
} from "@/lib/api";

/* ==================== Types ==================== */
type ThemeState = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
};
type Step = { title: string; description: string };
type Testimonial = { quote: string; name: string; role: string };
type Device = "desktop" | "tablet" | "mobile";

type StoreSection = {
  id?: number;
  key:
    | "hero"
    | "why"
    | "how"
    | "products"
    | "pricing"
    | "cta"
    | "testimonials"
    | "footer"
    | "about"
    | "contact";
  name: string;
  enabled: boolean;
  order: number;
  content: any;
  theme?: ThemeState;
};

/* ==================== Const ==================== */
const DEFAULT_THEME: ThemeState = {
  primary: "#6d28d9",
  secondary: "#2563eb",
  accent: "#ec4899",
  background: "#f9fafb",
  foreground: "#111827",
};
const VIEWPORTS: Record<Device, number> = {
  desktop: 1280,
  tablet: 834,
  mobile: 390,
};

const pickTheme = (t?: ThemeState): ThemeState => ({
  primary: t?.primary ?? DEFAULT_THEME.primary,
  secondary: t?.secondary ?? DEFAULT_THEME.secondary,
  accent: t?.accent ?? DEFAULT_THEME.accent,
  background: t?.background ?? DEFAULT_THEME.background,
  foreground: t?.foreground ?? DEFAULT_THEME.foreground,
});

const seedSections = (): StoreSection[] => [
  {
    key: "hero",
    name: "Hero",
    enabled: true,
    order: 1,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "Digital Products to Grow Your Business, Faster.",
      subtitle:
        "Agile Store provides powerful and affordable digital apps for your business and community. Scale faster with our proven solutions.",
      primaryCta: "Explore Products",
      secondaryCta: "Start Free",
      imageUrl: "",
    },
  },
  {
    key: "why",
    name: "Why Agile Store",
    enabled: true,
    order: 2,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "Why Agile Store",
      items: [
        {
          title: "Easy Setup",
          description: "Get started in minutes with guided onboarding.",
        },
        {
          title: "Affordable Pricing",
          description: "Transparent pricing with no hidden fees.",
        },
        {
          title: "Scalable Solutions",
          description: "Grow from startup to enterprise.",
        },
        {
          title: "24/7 Support",
          description: "Dedicated support whenever you need it.",
        },
      ],
    },
  },
  {
    key: "how",
    name: "How It Works",
    enabled: true,
    order: 3,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "How It Works",
      subtitle:
        "Get started in three simple steps and transform your business today.",
      steps: [
        {
          title: "Choose your product",
          description: "Browse our collection and find the perfect solution.",
        },
        {
          title: "Select a package",
          description: "Pick the plan that fits your requirements and budget.",
        },
        {
          title: "Start using instantly",
          description: "Immediate access with quick setup.",
        },
      ],
    },
  },
  {
    key: "products",
    name: "Our Products",
    enabled: true,
    order: 4,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "Our Products",
      subtitle: "Powerful digital solutions to streamline your operations.",
      items: [
        {
          name: "Rent Vix Pro",
          description: "Complete rental management solution",
          cta: "View Product",
          product_code: "",
        },
        {
          name: "Absen Fast",
          description: "Smart attendance system",
          cta: "View Product",
          product_code: "",
        },
        {
          name: "Ayo Hidupkan Rumah Ibadah",
          description: "Donation & activity management",
          cta: "View Product",
          product_code: "",
        },
        {
          name: "Salesman Apps",
          description: "Mobile CRM for sales teams",
          cta: "View Product",
          product_code: "",
        },
      ],
    },
  },
  {
    key: "pricing",
    name: "Pricing",
    enabled: true,
    order: 5,
    theme: { ...DEFAULT_THEME },
    content: {
      refProductCode: "",
      title: "Simple Pricing for Everyone",
      subtitle:
        "Pick the perfect plan. All include our core features with no hidden fees.",
      plans: [
        {
          name: "Basic",
          price: { monthly: 0, yearly: 0 },
          features: [],
          cta: "Start Now",
          package_id: null,
          duration_id: null,
        },
        {
          name: "Premium",
          price: { monthly: 0, yearly: 0 },
          features: [],
          cta: "Start Now",
          package_id: null,
          duration_id: null,
        },
        {
          name: "Professional",
          price: { monthly: 0, yearly: 0 },
          features: [],
          cta: "Start Now",
          package_id: null,
          duration_id: null,
        },
      ],
    },
  },
  {
    key: "cta",
    name: "CTA Banner",
    enabled: true,
    order: 6,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "Ready to boost your business with Agile Store?",
      subtitle: "Join thousands already growing with our digital solutions.",
      primary: "Get Started Today",
      secondary: "Talk to Sales",
      bullets: ["No setup fees", "Cancel anytime", "24/7 support"],
    },
  },
  {
    key: "testimonials",
    name: "Testimonials",
    enabled: true,
    order: 7,
    theme: { ...DEFAULT_THEME },
    content: {
      title: "Trusted by 100+ businesses and organizations",
      items: [
        {
          quote: "Agile Store transformed our rental business completely.",
          name: "Sarah Johnson",
          role: "Business Owner",
        },
        {
          quote: "Perfect solution for managing our activities.",
          name: "Ahmad Rahman",
          role: "Community Leader",
        },
        {
          quote: "Our team productivity increased by 60%.",
          name: "Lisa Chen",
          role: "Sales Manager",
        },
      ],
    },
  },
  {
    key: "footer",
    name: "Footer",
    enabled: true,
    order: 8,
    theme: { ...DEFAULT_THEME },
    content: {
      brand: "Agile Store",
      description:
        "Transform your workflow with professional e-commerce solutions designed for agile teams and modern businesses.",
      quickLinks: ["Products", "Pricing", "About", "Contact", "Support"],
      contact: {
        email: "hello@agilestore.com",
        phone: "+1 (555) 123-4567",
        address: "San Francisco, CA",
      },
      newsletterLabel: "Enter your email",
    },
  },
  {
    key: "about",
    name: "About Page",
    enabled: true,
    order: 9,
    theme: { ...DEFAULT_THEME },
    content: {
      headline: "All-in-One SaaS Marketplace",
      subheadline:
        "Discover powerful solutions designed to streamline your business operations and boost productivity.",
      featuresHeadline: "Why Agile Store",
      features: [
        "Easy Setup",
        "Affordable Pricing",
        "Scalable Solutions",
        "24/7 Support",
      ],
      steps: [
        {
          title: "Choose your product",
          description: "Browse our collection and find the perfect solution.",
        },
        {
          title: "Select a package",
          description: "Pick the plan that fits your needs and budget.",
        },
        {
          title: "Start using instantly",
          description: "Get access immediately with quick setup.",
        },
      ],
      testimonialsHeadline: "Trusted by 100+ businesses and organizations",
    },
  },
  {
    key: "contact",
    name: "Contact Page",
    enabled: true,
    order: 10,
    theme: { ...DEFAULT_THEME },
    content: {
      headline: "Get in touch",
      subheadline: "We’d love to hear from you. Reach out to our team anytime.",
      email: "hello@agilestore.com",
      phone: "+1 (555) 123-4567",
      address: "San Francisco, CA",
      ctaLabel: "Send Message",
    },
  },
];

const makeSafeSection = (
  partial: Partial<StoreSection> & { key: StoreSection["key"] }
): StoreSection => ({
  id: partial.id,
  key: partial.key,
  name: partial.name ?? partial.key,
  enabled: partial.enabled ?? true,
  order: partial.order ?? 1,
  theme: { ...DEFAULT_THEME, ...(partial.theme ?? {}) },
  content: partial.content ?? {},
});

/* ==================== Component ==================== */
export function AgileStoreSettings() {
  const [sections, setSections] = useState<StoreSection[]>(seedSections());
  const [activeSection, setActiveSection] = useState<string>("hero");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<Device>("desktop");

  // sumber relasi
  const [catalogProducts, setCatalogProducts] = useState<
    Array<{ id: string; name: string; product_code: string }>
  >([]);
  const [packages, setPackages] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [durations, setDurations] = useState<
    Array<{ id: string; name: string; months?: number }>
  >([]);

  // fitur per package (nama)
  const [featuresByPackage, setFeaturesByPackage] = useState<
    Record<string, string[]>
  >({});
  // index harga: `${package_id}:${duration_id}` => price number
  const [priceIndex, setPriceIndex] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState<string>("");

  // top-level state (dekat deklarasi state lainnya)
  const [featureNameToAnyKeyMap, setFeatureNameToAnyKeyMap] = useState<
    Record<string, string>
  >({});
  const [featureKeyToNameMap, setFeatureKeyToNameMap] = useState<
    Record<string, string>
  >({});

  const getSection = (key: StoreSection["key"]) =>
    makeSafeSection(
      sections.find((s) => s.key === key) ?? ({ key } as StoreSection)
    );

  /* ====== Load sections from backend ====== */
  useEffect(() => {
    (async () => {
      try {
        const resp = await getAgileSections();
        const rows: AgileSection[] = Array.isArray(resp?.data) ? resp.data : [];
        if (!rows.length) return;
        const mapped = rows
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((r) =>
            makeSafeSection({
              id: r.id as number | undefined,
              key: r.key as StoreSection["key"],
              name: r.name,
              enabled: !!r.enabled,
              order: Number(r.order ?? 1),
              theme: (r.theme as any) ?? {},
              content: (r.content as any) ?? {},
            })
          );
        setSections(mapped);
      } catch (e) {
        console.error("[AgileStore] load sections failed:", e);
      }
    })();
  }, []);

  /* ====== Load products ====== */
  useEffect(() => {
    (async () => {
      try {
        const rows = await listCatalogProductsSlim("");
        setCatalogProducts(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            product_code: r.product_code,
          }))
        );

        const pricing = getSection("pricing");
        if (!pricing.content.refProductCode && rows[0]?.product_code) {
          setSections((prev) =>
            prev.map((x) =>
              x.key === "pricing"
                ? {
                    ...x,
                    content: {
                      ...x.content,
                      refProductCode: rows[0].product_code,
                    },
                  }
                : x
            )
          );
        }
      } catch (e) {
        console.error("[AgileStore] load products failed:", e);
      }
    })();
  }, []);

  const refProductCode = getSection("pricing").content?.refProductCode || "";

  /* ====== Load durations, packages, features(mtx), pricelist ====== */
  useEffect(() => {
    (async () => {
      try {
        // durations
        const du = await listDurationsActive();
        const duSorted = [...du].sort(
          (a, b) => Number(a.months ?? 0) - Number(b.months ?? 0)
        );
        setDurations(
          duSorted.map((d) => ({
            id: String(d.id),
            name: d.name,
            months: Number(d.months ?? 0),
          }))
        );

        if (!refProductCode) {
          setPackages([]);
          setFeaturesByPackage({});
          setPriceIndex({});
          setCurrency("");
          return;
        }

        // packages
        const pk = await listPackagesByProduct(refProductCode, true);
        setPackages(pk.map((p) => ({ id: String(p.id), name: p.name })));

        // fitur (parent FEATURE) — untuk nama
        const fjson = await panelListFeaturesByProduct(refProductCode, false);
        const featRows: Array<{
          id: string;
          code?: string;
          feature_id?: string;
          name: string;
        }> = (
          Array.isArray(fjson?.data)
            ? fjson.data
            : Array.isArray(fjson)
            ? fjson
            : []
        )
          .filter(
            (it: any) => (it.type ?? it.item_type ?? "FEATURE") === "FEATURE"
          )
          .map((it: any) => ({
            id: String(it.id ?? it.feature_id ?? it.code ?? ""),
            code: it.code ? String(it.code) : undefined,
            feature_id: it.feature_id ? String(it.feature_id) : undefined,
            name: String(it.name ?? it.title ?? ""),
          }));

        // build map key -> name (key bisa id, code, feature_id, lowercase variants)
        const nameByAnyKey = new Map<string, string>();
        featRows.forEach((f) => {
          const keys = [
            f.id,
            f.code ?? "",
            f.feature_id ?? "",
            (f.code ?? "").toLowerCase(),
            (f.feature_id ?? "").toLowerCase(),
          ].filter(Boolean);
          keys.forEach((k) => nameByAnyKey.set(String(k), f.name));
        });

        // build inverse map name -> first key (bisa dipakai saat submit untuk konversi nama -> code)
        const featureNameToAnyKey = new Map<string, string>();
        featRows.forEach((f) => {
          // prefer code, lalu feature_id, lalu id
          const preferKey = f.code ?? f.feature_id ?? f.id;
          if (preferKey) featureNameToAnyKey.set(f.name, preferKey);
        });
        // setelah build featureNameToAnyKey (Map)
        setFeatureNameToAnyKeyMap(
          Object.fromEntries(featureNameToAnyKey.entries())
        );

        // ...setFeatureNameToAnyKeyMap(Object.fromEntries(featureNameToAnyKey.entries()));
        setFeatureNameToAnyKeyMap(
          Object.fromEntries(featureNameToAnyKey.entries())
        );
        setFeatureKeyToNameMap(Object.fromEntries(nameByAnyKey.entries()));

        // matrix (mapping package -> [feature NAMES])
        const mjson = await fetchMatrixByProduct(refProductCode);
        const matrixRows: any[] = Array.isArray(mjson?.data?.matrix)
          ? mjson.data.matrix
          : [];
        const grouped = new Map<string, string[]>();
        matrixRows.forEach((r: any) => {
          if (String(r.item_type).toLowerCase() !== "feature" || !r.enabled)
            return;

          const pkgId = String(r.package_id);
          const rawKey =
            r.item_id ??
            r.item_code ??
            r.code ??
            r.feature_id ??
            r.feature_code ??
            r.featureId ??
            r.menu_id;
          const key = String(rawKey ?? "");
          const name =
            nameByAnyKey.get(key) ||
            nameByAnyKey.get(key.toLowerCase()) ||
            (rawKey ? String(rawKey) : "");

          if (!name) return;
          const arr = grouped.get(pkgId) ?? [];
          if (!arr.includes(name)) arr.push(name);
          grouped.set(pkgId, arr);
        });

        // to plain object: packageId -> [feature NAMES]
        const featByPkg: Record<string, string[]> = {};
        grouped.forEach((v, k) => (featByPkg[k] = v));
        setFeaturesByPackage(featByPkg);

        // Simpan juga inverse map (opsional, berguna saat submit)
        // Jika kamu ingin menyimpannya di state agar dapat diakses component lain:
        // setFeatureNameToAnyKey(Object.fromEntries(featureNameToAnyKey));
        // tapi di sini kita simpan ke ref atau state jika perlu, contoh:
        // setFeatureNameToKeyMap(featureNameToAnyKey);

        // pricelist
        const priceJson = await getPricelistByProduct(refProductCode);
        setCurrency(String(priceJson?.currency ?? ""));

        const idx: Record<string, number> = {};
        const items: any[] = Array.isArray(priceJson?.items)
          ? priceJson.items
          : [];
        items.forEach((it) => {
          const key = `${String(it.package_id)}:${String(it.duration_id)}`;
          idx[key] = Number(it.price ?? 0);
        });
        setPriceIndex(idx);
      } catch (e) {
        console.error("[AgileStore] load relasi failed:", e);
      }
    })();
  }, [refProductCode]);

  /* ====== Helpers Pricing ====== */
  const durationsMap = useMemo(
    () =>
      durations.reduce<
        Record<string, { id: string; name: string; months?: number }>
      >((acc, d) => {
        acc[String(d.id)] = d;
        return acc;
      }, {}),
    [durations]
  );

  const findMonthlyDuration = () =>
    durations.find((d) => Number(d.months) === 1);
  const findYearlyDuration = () =>
    durations.find((d) => Number(d.months) === 12) ||
    durations
      .filter((d) => Number(d.months ?? 0) >= 12)
      .sort((a, b) => Number(a.months ?? 0) - Number(b.months ?? 0))[0] ||
    findMonthlyDuration();

  const priceFor = (pkgId?: string | number, durId?: string | number) => {
    if (!pkgId || !durId) return 0;
    return Number(priceIndex[`${String(pkgId)}:${String(durId)}`] ?? 0);
  };

  const recalcPlanPrices = (
    planIndex: number,
    opts?: { packageId?: string | number; durationId?: string | number }
  ) => {
    setSections((prev) =>
      prev.map((x) => {
        if (x.key !== "pricing") return x;
        const nextPlans = [...(x.content.plans ?? [])];
        const base = nextPlans[planIndex] ?? {};
        const pkgId =
          opts?.packageId != null ? opts.packageId : base.package_id;
        const durSel =
          opts?.durationId != null ? opts.durationId : base.duration_id;

        let monthly = base?.price?.monthly ?? 0;
        let yearly = base?.price?.yearly ?? 0;
        let autoFromMonthId: string | null = null;
        let autoFromYearId: string | null = null;

        if (pkgId) {
          if (durSel) {
            monthly = priceFor(pkgId, durSel);
            autoFromMonthId = String(durSel);
            const d12 = findYearlyDuration();
            if (d12?.id) {
              yearly = priceFor(pkgId, d12.id) || monthly;
              autoFromYearId = priceFor(pkgId, d12.id)
                ? String(d12.id)
                : String(durSel);
            } else {
              yearly = monthly;
              autoFromYearId = String(durSel);
            }
          } else {
            const d1 = findMonthlyDuration();
            const d12 = findYearlyDuration();
            if (d1?.id) {
              monthly = priceFor(pkgId, d1.id);
              autoFromMonthId = String(d1.id);
            }
            if (d12?.id) {
              yearly = priceFor(pkgId, d12.id) || monthly;
              autoFromYearId = priceFor(pkgId, d12.id)
                ? String(d12.id)
                : autoFromMonthId;
            } else {
              yearly = monthly;
              autoFromYearId = autoFromMonthId;
            }
          }
        }

        nextPlans[planIndex] = {
          ...base,
          package_id: pkgId ?? null,
          duration_id: durSel ?? null,
          price: { monthly, yearly },
          features: featuresByPackage[String(pkgId ?? "")] ?? [],
          _auto_from_month_id: autoFromMonthId,
          _auto_from_year_id: autoFromYearId,
        };
        return { ...x, content: { ...x.content, plans: nextPlans } };
      })
    );
  };

  // resinkron ketika harga/fitur berubah
  useEffect(() => {
    const s = getSection("pricing");
    const plans: any[] = Array.isArray(s.content?.plans) ? s.content.plans : [];
    plans.forEach((p, i) => {
      if (!p?.package_id) return;
      recalcPlanPrices(i, {
        packageId: p.package_id,
        durationId: p.duration_id,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuresByPackage, priceIndex]);

  /* ====== Save ====== */
  const saveAll = async () => {
    try {
      const toItems = (s: StoreSection) => {
        if (s.key === "products") {
          const arr = (s.content?.items || []) as Array<any>;
          return arr.map((it: any, i: number) => ({
            title: it.name ?? it.title ?? "",
            description: it.description ?? "",
            cta_label: it.cta ?? "",
            order: i + 1,
            product_code: it.product_code ?? undefined,
          }));
        }
        if (s.key === "pricing") {
          const plans = (s.content?.plans || []) as Array<any>;
          return plans.map((p: any, i: number) => {
            const names: string[] = Array.isArray(p.features) ? p.features : [];
            const explicitCodes: string[] = Array.isArray(p.feature_codes)
              ? p.feature_codes
              : [];
            const mappedCodes =
              explicitCodes.length > 0
                ? explicitCodes
                : names.map((nm) => featureNameToAnyKeyMap[nm] ?? nm);

            return {
              title: p.name ?? "",
              order: i + 1,
              price_monthly: p?.price?.monthly ?? null,
              price_yearly: p?.price?.yearly ?? null,
              cta_label: p.cta ?? "",
              package_id: p.package_id ?? null,
              duration_id: p.duration_id ?? null,
              // kirim codes ke backend
              extras: { features: mappedCodes },
            };
          });
        }

        if (s.key === "testimonials") {
          const its = (s.content?.items || []) as Array<any>;
          return its.map((t: any, i: number) => ({
            order: i + 1,
            description: t.quote ?? "",
            title: t.name ?? "",
            extras: {
              person_name: t.name ?? "",
              person_role: t.role ?? "",
              quote: t.quote ?? "",
            },
          }));
        }
        if (s.key === "why") {
          const its = (s.content?.items || []) as Array<any>;
          return its.map((f: any, i: number) => ({
            order: i + 1,
            title: f.title ?? "",
            description: f.description ?? "",
          }));
        }
        if (s.key === "how") {
          const its = (s.content?.steps || []) as Array<any>;
          return its.map((st: any, i: number) => ({
            order: i + 1,
            title: st.title ?? "",
            description: st.description ?? "",
          }));
        }
        return undefined;
      };

      const payload = {
        sections: sections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            enabled: s.enabled,
            order: s.order,
            theme: s.theme ?? null,
            content: s.content ?? null,
            ...(toItems(s) ? { items: toItems(s) } : {}),
          })),
      };

      await upsertAgileSections(payload as any);
      alert("Settings saved.");
    } catch (e: any) {
      console.error(e);
      alert(`Failed to save: ${e?.message ?? e}`);
    }
  };

  /* ====== PREVIEW ====== */
  const SectionPreview = ({ s }: { s: StoreSection }) => {
    const t = pickTheme(s.theme);
    const blockStyle = {
      backgroundColor: t.background,
      color: t.foreground,
      borderColor: t.secondary + "33",
    };
    const gradient = {
      backgroundImage: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
    };

    if (s.key === "hero") {
      return (
        <div className="rounded-xl p-8 text-white mb-6" style={gradient as any}>
          <div className="text-3xl font-bold mb-2">
            {s.content?.title ?? ""}
          </div>
          <div className="opacity-90 mb-4">{s.content?.subtitle ?? ""}</div>
          <div className="flex gap-2">
            <Button className="bg-white text-black hover:bg-white/90">
              {s.content?.primaryCta ?? "Get Started"}
            </Button>
            <Button
              variant="secondary"
              className="bg-transparent border border-white/30 text-white hover:bg-white/10"
            >
              {s.content?.secondaryCta ?? "Learn More"}
            </Button>
          </div>
        </div>
      );
    }

    if (s.key === "why") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {s.content?.title ?? ""}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(s.content?.items ?? []).map((it: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg border"
                style={{ borderColor: t.secondary + "33" }}
              >
                <div className="font-medium">{it.title}</div>
                <div className="text-sm opacity-80">{it.description}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (s.key === "how") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {s.content?.title ?? ""}
          </div>
          <div className="text-sm opacity-80 mb-3">
            {s.content?.subtitle ?? ""}
          </div>
          <ol className="list-decimal pl-6 space-y-1">
            {(s.content?.steps ?? []).map((st: any, i: number) => (
              <li key={i}>
                <span className="font-medium">{st.title}:</span>{" "}
                <span className="opacity-80">{st.description}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    if (s.key === "products") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {s.content?.title ?? "Our Products"}
          </div>
          <div className="text-sm opacity-80 mb-3">
            {s.content?.subtitle ?? ""}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(s.content?.items ?? []).map((it: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg border"
                style={{ borderColor: t.secondary + "33" }}
              >
                <div className="font-medium">{it.name}</div>
                <div className="text-sm opacity-80">{it.description}</div>
                <Button
                  size="sm"
                  className="mt-3"
                  style={{ backgroundColor: t.primary, color: "#fff" }}
                >
                  {it.cta ?? "View"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (s.key === "pricing") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {s.content?.title ?? ""}
          </div>
          <div className="text-sm opacity-80 mb-4">
            {s.content?.subtitle ?? ""}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(s.content?.plans ?? []).map((p: any, i: number) => {
              const names: string[] = Array.isArray(p.features)
                ? p.features
                : [];
              return (
                <div
                  key={i}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: t.secondary + "33" }}
                >
                  <div className="font-semibold">{p.name}</div>
                  {p.package_id && (
                    <div className="text-xs opacity-70 mt-1">
                      Pkg #{p.package_id} • {names.length} features
                    </div>
                  )}
                  <div className="text-sm opacity-80 mt-1">
                    {currency ? `${currency} ` : ""}
                    {p?.price?.monthly ?? 0} / bln •{" "}
                    {currency ? `${currency} ` : ""}
                    {p?.price?.yearly ?? 0} / thn
                  </div>
                  <ul className="mt-2 text-sm list-disc pl-5">
                    {names.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className="mt-3"
                    style={{ backgroundColor: t.secondary, color: "#fff" }}
                  >
                    {p.cta ?? "Choose Plan"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (s.key === "cta") {
      const gradient = {
        backgroundImage: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
      };
      return (
        <div className="rounded-xl p-6 text-white mb-6" style={gradient as any}>
          <div className="text-lg opacity-90">{s.content?.title ?? ""}</div>
          <div className="text-sm opacity-90 mb-3">
            {s.content?.subtitle ?? ""}
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-black hover:bg-white/90">
              {s.content?.primary ?? "Primary"}
            </Button>
            <Button
              variant="secondary"
              className="bg-transparent border border-white/30 text-white hover:bg-white/10"
            >
              {s.content?.secondary ?? "Secondary"}
            </Button>
          </div>
        </div>
      );
    }

    if (s.key === "testimonials") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-sm text-muted-foreground mb-3">
            {s.content?.title ?? ""}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {(s.content?.items ?? []).map((t: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="text-sm italic">"{t.quote}"</div>
                <div className="mt-3 text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (s.key === "footer") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold">
            {s.content?.brand ?? "Agile Store"}
          </div>
          <div className="text-sm opacity-80">
            {s.content?.description ?? ""}
          </div>
        </div>
      );
    }

    if (s.key === "about") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {s.content?.headline ?? "About"}
          </div>
          <div className="text-sm opacity-80 mb-4">
            {s.content?.subheadline ?? ""}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(s.content?.features ?? []).map((f: string, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg border"
                style={{ borderColor: t.secondary + "33" }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (s.key === "contact") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold">
            {s.content?.headline ?? "Contact"}
          </div>
          <div className="text-sm opacity-80 mb-3">
            {s.content?.subheadline ?? ""}
          </div>
          <div className="text-sm">
            <div>Email: {s.content?.email}</div>
            <div>Phone: {s.content?.phone}</div>
            <div>Address: {s.content?.address}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const sortedEnabledSections = useMemo(
    () =>
      sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .filter((s) => s.enabled),
    [sections]
  );

  /* ====== Small helpers for list editing ====== */
  const arrayMove = <T,>(arr: T[], from: number, to: number) => {
    const copy = [...arr];
    const item = copy.splice(from, 1)[0];
    copy.splice(to, 0, item);
    return copy;
  };

  /* ==================== Render ==================== */
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Agile Store Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola konten & warna per section. Tersimpan ke server.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button onClick={saveAll}>
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </div>

      {/* Tab tunggal: Sections */}
      <div className="flex flex-wrap gap-2">
        <Button variant="default" className={cn("h-8")}>
          <LayoutGrid className="h-4 w-4 mr-2" /> Sections
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: daftar section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Page Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <div
                    key={s.key}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeSection === s.key
                        ? "bg-muted/30 border-primary/30"
                        : "hover:bg-muted/10"
                    }`}
                    onClick={() => setActiveSection(s.key)}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(checked) =>
                          setSections((prev) =>
                            prev.map((x) =>
                              x.key === s.key ? { ...x, enabled: checked } : x
                            )
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSections((prev) =>
                            prev
                              .map((x) =>
                                x.key === s.key
                                  ? { ...x, order: x.order - 1 }
                                  : x
                              )
                              .sort((a, b) => a.order - b.order)
                          );
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        {s.order}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSections((prev) =>
                            prev
                              .map((x) =>
                                x.key === s.key
                                  ? { ...x, order: x.order + 1 }
                                  : x
                              )
                              .sort((a, b) => a.order - b.order)
                          );
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {getSection(activeSection as any).name} Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme per section */}
              <div className="space-y-3 p-3 rounded-lg border">
                <div className="text-sm font-medium">Section Theme</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(
                    [
                      "primary",
                      "secondary",
                      "accent",
                      "background",
                      "foreground",
                    ] as (keyof ThemeState)[]
                  ).map((key) => (
                    <div key={key}>
                      <Label className="capitalize">{key}</Label>
                      <Input
                        type="color"
                        value={
                          pickTheme(getSection(activeSection as any).theme)[key]
                        }
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((x) => {
                              if (x.key !== activeSection) return x;
                              const t = pickTheme(x.theme);
                              return {
                                ...x,
                                theme: { ...t, [key]: e.target.value },
                              };
                            })
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ================= HERO ================= */}
              {activeSection === "hero" &&
                (() => {
                  const s = getSection("hero");
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={s.content.title ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "hero"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          title: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={s.content.subtitle ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "hero"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subtitle: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Primary CTA</Label>
                          <Input
                            value={s.content.primaryCta ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "hero"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          primaryCta: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Secondary CTA</Label>
                          <Input
                            value={s.content.secondaryCta ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "hero"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          secondaryCta: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= WHY ================= */}
              {activeSection === "why" &&
                (() => {
                  const s = getSection("why");
                  const items: any[] = Array.isArray(s.content?.items)
                    ? s.content.items
                    : [];
                  return (
                    <div className="space-y-4">
                      <Label>Title</Label>
                      <Input
                        value={s.content.title ?? ""}
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((x) =>
                              x.key === "why"
                                ? {
                                    ...x,
                                    content: {
                                      ...x.content,
                                      title: e.target.value,
                                    },
                                  }
                                : x
                            )
                          )
                        }
                      />
                      <div className="space-y-3">
                        {items.map((it, i) => (
                          <div
                            key={i}
                            className="grid md:grid-cols-2 gap-2 p-3 border rounded-lg"
                          >
                            <Input
                              placeholder="Feature title"
                              value={it.title ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "why") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      title: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={it.description ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "why") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      description: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "why"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        items: [
                                          ...(x.content.items ?? []),
                                          { title: "", description: "" },
                                        ],
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add item
                        </Button>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= HOW ================= */}
              {activeSection === "how" &&
                (() => {
                  const s = getSection("how");
                  const steps: any[] = Array.isArray(s.content?.steps)
                    ? s.content.steps
                    : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={s.content.title ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "how"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          title: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={s.content.subtitle ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "how"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subtitle: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        {steps.map((st, i) => (
                          <div
                            key={i}
                            className="grid md:grid-cols-2 gap-2 p-3 border rounded-lg"
                          >
                            <Input
                              placeholder="Step title"
                              value={st.title ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "how") return x;
                                    const next = [...(x.content.steps ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      title: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, steps: next },
                                    };
                                  })
                                )
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={st.description ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "how") return x;
                                    const next = [...(x.content.steps ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      description: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, steps: next },
                                    };
                                  })
                                )
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "how"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        steps: [
                                          ...(x.content.steps ?? []),
                                          { title: "", description: "" },
                                        ],
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add step
                        </Button>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= PRODUCTS ================= */}
              {activeSection === "products" &&
                (() => {
                  const s = getSection("products");
                  const items: any[] = Array.isArray(s.content?.items)
                    ? s.content.items
                    : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={s.content.title ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "products"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          title: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={s.content.subtitle ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "products"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subtitle: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {items.map((it, i) => (
                          <div
                            key={i}
                            className="p-3 border rounded-lg space-y-2"
                          >
                            <div className="grid md:grid-cols-2 gap-2">
                              <Input
                                placeholder="Product name"
                                value={it.name ?? ""}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== "products") return x;
                                      const next = [...(x.content.items ?? [])];
                                      next[i] = {
                                        ...next[i],
                                        name: e.target.value,
                                      };
                                      return {
                                        ...x,
                                        content: { ...x.content, items: next },
                                      };
                                    })
                                  )
                                }
                              />
                              <Input
                                placeholder="CTA label"
                                value={it.cta ?? ""}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== "products") return x;
                                      const next = [...(x.content.items ?? [])];
                                      next[i] = {
                                        ...next[i],
                                        cta: e.target.value,
                                      };
                                      return {
                                        ...x,
                                        content: { ...x.content, items: next },
                                      };
                                    })
                                  )
                                }
                              />
                            </div>
                            <Textarea
                              placeholder="Short description"
                              value={it.description ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "products") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      description: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                            <div className="grid md:grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">
                                  Bind to Product Code (optional)
                                </Label>
                                <Select
                                  value={it.product_code ?? ""}
                                  onValueChange={(val) =>
                                    setSections((prev) =>
                                      prev.map((x) => {
                                        if (x.key !== "products") return x;
                                        const next = [
                                          ...(x.content.items ?? []),
                                        ];
                                        next[i] = {
                                          ...next[i],
                                          product_code: val,
                                        };
                                        return {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            items: next,
                                          },
                                        };
                                      })
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pick..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {catalogProducts.map((p) => (
                                      <SelectItem
                                        key={p.product_code}
                                        value={p.product_code}
                                      >
                                        {p.name} ({p.product_code})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setSections((prev) =>
                                      prev.map((x) => {
                                        if (x.key !== "products") return x;
                                        const moved = arrayMove(
                                          x.content.items ?? [],
                                          i,
                                          Math.max(0, i - 1)
                                        );
                                        return {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            items: moved,
                                          },
                                        };
                                      })
                                    )
                                  }
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setSections((prev) =>
                                      prev.map((x) => {
                                        if (x.key !== "products") return x;
                                        const moved = arrayMove(
                                          x.content.items ?? [],
                                          i,
                                          i + 1
                                        );
                                        return {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            items: moved,
                                          },
                                        };
                                      })
                                    )
                                  }
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() =>
                                    setSections((prev) =>
                                      prev.map((x) => {
                                        if (x.key !== "products") return x;
                                        const next = [
                                          ...(x.content.items ?? []),
                                        ];
                                        next.splice(i, 1);
                                        return {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            items: next,
                                          },
                                        };
                                      })
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "products"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        items: [
                                          ...(x.content.items ?? []),
                                          {
                                            name: "",
                                            description: "",
                                            cta: "",
                                          },
                                        ],
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add product card
                        </Button>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= PRICING ================= */}
              {activeSection === "pricing" &&
                (() => {
                  const s = getSection("pricing");
                  return (
                    <div className="space-y-4">
                      <div>
                        <Label>Reference Product (for packages & prices)</Label>
                        <Select
                          value={s.content.refProductCode ?? ""}
                          onValueChange={(val) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "pricing"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        refProductCode: val,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogProducts.map((p) => (
                              <SelectItem
                                key={p.product_code}
                                value={p.product_code}
                              >
                                {p.name} ({p.product_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={s.content.title ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "pricing"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          title: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={s.content.subtitle ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "pricing"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subtitle: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        {(s.content.plans ?? []).map((p: any, i: number) => {
                          const autoMonthId: string | null =
                            p?._auto_from_month_id ?? null;
                          const autoYearId: string | null =
                            p?._auto_from_year_id ?? null;
                          const autoMonthLabel = autoMonthId
                            ? durationsMap[autoMonthId]?.name ?? ""
                            : "";
                          const autoYearLabel = autoYearId
                            ? durationsMap[autoYearId]?.name ?? ""
                            : "";
                          return (
                            <div
                              key={i}
                              className="p-3 rounded-lg border space-y-2"
                            >
                              <Input
                                value={p.name ?? ""}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== "pricing") return x;
                                      const plans = [
                                        ...(x.content.plans ?? []),
                                      ];
                                      plans[i] = {
                                        ...plans[i],
                                        name: e.target.value,
                                      };
                                      return {
                                        ...x,
                                        content: { ...x.content, plans },
                                      };
                                    })
                                  )
                                }
                                placeholder="Plan name"
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Package</Label>
                                    {/* <span className="text-[10px] text-muted-foreground">
                                      Reference Product
                                    </span> */}
                                  </div>
                                  <Select
                                    value={
                                      p.package_id ? String(p.package_id) : ""
                                    }
                                    onValueChange={(val) =>
                                      recalcPlanPrices(i, { packageId: val })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          refProductCode
                                            ? "Choose package"
                                            : "Pick Reference Product first"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {packages.map((pk) => (
                                        <SelectItem
                                          key={pk.id}
                                          value={String(pk.id)}
                                        >
                                          {pk.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {
                                      (
                                        featuresByPackage[
                                          String(p.package_id)
                                        ] ?? []
                                      ).length
                                    }{" "}
                                    features enabled
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Duration</Label>
                                    <span className="text-[10px] text-muted-foreground">
                                      (optional)
                                    </span>
                                  </div>
                                  <Select
                                    value={
                                      p.duration_id ? String(p.duration_id) : ""
                                    }
                                    onValueChange={(val) =>
                                      recalcPlanPrices(i, { durationId: val })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose duration (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {durations.map((d) => (
                                        <SelectItem
                                          key={d.id}
                                          value={String(d.id)}
                                        >
                                          {d.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">
                                    Monthly{" "}
                                    <span className="text-[10px] text-muted-foreground">
                                      {autoMonthLabel
                                        ? `(auto from ${autoMonthLabel} price)`
                                        : "(auto from 1-month price)"}
                                    </span>
                                  </Label>
                                  <Input
                                    type="number"
                                    value={p?.price?.monthly ?? 0}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((x) => {
                                          if (x.key !== "pricing") return x;
                                          const plans = [
                                            ...(x.content.plans ?? []),
                                          ];
                                          plans[i] = {
                                            ...plans[i],
                                            price: {
                                              ...(plans[i].price ?? {}),
                                              monthly: Number(e.target.value),
                                            },
                                          };
                                          return {
                                            ...x,
                                            content: { ...x.content, plans },
                                          };
                                        })
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">
                                    Yearly{" "}
                                    <span className="text-[10px] text-muted-foreground">
                                      {autoYearLabel
                                        ? `(auto from ${autoYearLabel} price)`
                                        : "(auto from 12-month price)"}
                                    </span>
                                  </Label>
                                  <Input
                                    type="number"
                                    value={p?.price?.yearly ?? 0}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((x) => {
                                          if (x.key !== "pricing") return x;
                                          const plans = [
                                            ...(x.content.plans ?? []),
                                          ];
                                          plans[i] = {
                                            ...plans[i],
                                            price: {
                                              ...(plans[i].price ?? {}),
                                              yearly: Number(e.target.value),
                                            },
                                          };
                                          return {
                                            ...x,
                                            content: { ...x.content, plans },
                                          };
                                        })
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <Textarea
                                value={
                                  Array.isArray(p.features)
                                    ? p.features
                                        .map((f: any) => {
                                          // object {name, code} → tampilkan name
                                          if (
                                            typeof f === "object" &&
                                            f !== null
                                          )
                                            return f.name ?? f.code ?? "";
                                          // string → bisa code atau name; jika code, ubah ke name
                                          const str = String(f ?? "");
                                          return (
                                            featureKeyToNameMap[str] ||
                                            featureKeyToNameMap[
                                              str.toLowerCase()
                                            ] ||
                                            str
                                          );
                                        })
                                        .filter(Boolean)
                                        .join("\n")
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = String(e.target.value || "");
                                  const names = raw
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean);

                                  const nameToKey =
                                    featureNameToAnyKeyMap || {};
                                  const codes = names.map((nm) => {
                                    // name → code (kalau ada di map); kalau tidak ada, biarkan apa adanya
                                    if (nameToKey[nm]) return nameToKey[nm];
                                    // bila user ketik code manual, tetap simpan
                                    if (
                                      nm.includes(".") ||
                                      nm.includes("_") ||
                                      nm.includes("-")
                                    )
                                      return nm;
                                    return nm;
                                  });

                                  setSections((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== "pricing") return x;
                                      const plans = [
                                        ...(x.content.plans ?? []),
                                      ];
                                      const plan = { ...(plans[i] ?? {}) };
                                      plan.features = names; // untuk UI (selalu nama)
                                      plan.feature_codes = codes; // untuk submit ke backend
                                      plans[i] = plan;
                                      return {
                                        ...x,
                                        content: { ...x.content, plans },
                                      };
                                    })
                                  );
                                }}
                                rows={3}
                                placeholder={"Feature 1\nFeature 2\nFeature 3"}
                              />

                              <Input
                                value={p.cta ?? ""}
                                onChange={(e) =>
                                  setSections((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== "pricing") return x;
                                      const plans = [
                                        ...(x.content.plans ?? []),
                                      ];
                                      plans[i] = {
                                        ...plans[i],
                                        cta: e.target.value,
                                      };
                                      return {
                                        ...x,
                                        content: { ...x.content, plans },
                                      };
                                    })
                                  )
                                }
                                placeholder="CTA"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {/* ================= CTA ================= */}
              {activeSection === "cta" &&
                (() => {
                  const s = getSection("cta");
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={s.content.title ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "cta"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          title: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={s.content.subtitle ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "cta"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subtitle: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button</Label>
                          <Input
                            value={s.content.primary ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "cta"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          primary: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Secondary Button</Label>
                          <Input
                            value={s.content.secondary ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "cta"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          secondary: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Bullets (one per line)</Label>
                        <Textarea
                          rows={4}
                          value={
                            Array.isArray(s.content.bullets)
                              ? s.content.bullets.join("\n")
                              : ""
                          }
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "cta"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        bullets: e.target.value
                                          .split("\n")
                                          .filter(Boolean),
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })()}

              {/* ================= TESTIMONIALS ================= */}
              {activeSection === "testimonials" &&
                (() => {
                  const s = getSection("testimonials");
                  const items: any[] = Array.isArray(s.content?.items)
                    ? s.content.items
                    : [];
                  return (
                    <div className="space-y-4">
                      <Label>Section Title</Label>
                      <Input
                        value={s.content.title ?? ""}
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((x) =>
                              x.key === "testimonials"
                                ? {
                                    ...x,
                                    content: {
                                      ...x.content,
                                      title: e.target.value,
                                    },
                                  }
                                : x
                            )
                          )
                        }
                      />
                      <div className="space-y-3">
                        {items.map((it, i) => (
                          <div
                            key={i}
                            className="grid md:grid-cols-3 gap-2 p-3 border rounded-lg"
                          >
                            <Input
                              placeholder="Quote"
                              value={it.quote ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "testimonials") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      quote: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                            <Input
                              placeholder="Name"
                              value={it.name ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "testimonials") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      name: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                            <Input
                              placeholder="Role"
                              value={it.role ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "testimonials") return x;
                                    const next = [...(x.content.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      role: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, items: next },
                                    };
                                  })
                                )
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "testimonials"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        items: [
                                          ...(x.content.items ?? []),
                                          { quote: "", name: "", role: "" },
                                        ],
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add testimonial
                        </Button>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= FOOTER ================= */}
              {activeSection === "footer" &&
                (() => {
                  const s = getSection("footer");
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Brand</Label>
                          <Input
                            value={s.content.brand ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "footer"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          brand: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Newsletter Label</Label>
                          <Input
                            value={s.content.newsletterLabel ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "footer"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          newsletterLabel: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={s.content.description ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "footer"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        description: e.target.value,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Quick Links (one per line)</Label>
                          <Textarea
                            rows={4}
                            value={
                              Array.isArray(s.content.quickLinks)
                                ? s.content.quickLinks.join("\n")
                                : ""
                            }
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "footer"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          quickLinks: e.target.value
                                            .split("\n")
                                            .filter(Boolean),
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Contact</Label>
                          <div className="grid md:grid-cols-3 gap-2">
                            <Input
                              placeholder="Email"
                              value={s.content?.contact?.email ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) =>
                                    x.key === "footer"
                                      ? {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            contact: {
                                              ...(x.content.contact ?? {}),
                                              email: e.target.value,
                                            },
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                            <Input
                              placeholder="Phone"
                              value={s.content?.contact?.phone ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) =>
                                    x.key === "footer"
                                      ? {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            contact: {
                                              ...(x.content.contact ?? {}),
                                              phone: e.target.value,
                                            },
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                            <Input
                              placeholder="Address"
                              value={s.content?.contact?.address ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) =>
                                    x.key === "footer"
                                      ? {
                                          ...x,
                                          content: {
                                            ...x.content,
                                            contact: {
                                              ...(x.content.contact ?? {}),
                                              address: e.target.value,
                                            },
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= ABOUT ================= */}
              {activeSection === "about" &&
                (() => {
                  const s = getSection("about");
                  const feats: string[] = Array.isArray(s.content?.features)
                    ? s.content.features
                    : [];
                  const steps: any[] = Array.isArray(s.content?.steps)
                    ? s.content.steps
                    : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Headline</Label>
                          <Input
                            value={s.content.headline ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "about"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          headline: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subheadline</Label>
                          <Input
                            value={s.content.subheadline ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "about"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subheadline: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Features (one per line)</Label>
                        <Textarea
                          rows={4}
                          value={feats.join("\n")}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "about"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        features: e.target.value
                                          .split("\n")
                                          .filter(Boolean),
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Steps</Label>
                        {steps.map((st, i) => (
                          <div
                            key={i}
                            className="grid md:grid-cols-2 gap-2 p-3 border rounded-lg"
                          >
                            <Input
                              placeholder="Title"
                              value={st.title ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "about") return x;
                                    const next = [...(x.content.steps ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      title: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, steps: next },
                                    };
                                  })
                                )
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={st.description ?? ""}
                              onChange={(e) =>
                                setSections((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== "about") return x;
                                    const next = [...(x.content.steps ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      description: e.target.value,
                                    };
                                    return {
                                      ...x,
                                      content: { ...x.content, steps: next },
                                    };
                                  })
                                )
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "about"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        steps: [
                                          ...(x.content.steps ?? []),
                                          { title: "", description: "" },
                                        ],
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add step
                        </Button>
                      </div>
                    </div>
                  );
                })()}

              {/* ================= CONTACT ================= */}
              {activeSection === "contact" &&
                (() => {
                  const s = getSection("contact");
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Headline</Label>
                          <Input
                            value={s.content.headline ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "contact"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          headline: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Subheadline</Label>
                          <Input
                            value={s.content.subheadline ?? ""}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((x) =>
                                  x.key === "contact"
                                    ? {
                                        ...x,
                                        content: {
                                          ...x.content,
                                          subheadline: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Email"
                          value={s.content.email ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "contact"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        email: e.target.value,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={s.content.phone ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "contact"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        phone: e.target.value,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="Address"
                          value={s.content.address ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "contact"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        address: e.target.value,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>CTA Label</Label>
                        <Input
                          value={s.content.ctaLabel ?? ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((x) =>
                                x.key === "contact"
                                  ? {
                                      ...x,
                                      content: {
                                        ...x.content,
                                        ctaLabel: e.target.value,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Preview — All Sections</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant={
                    previewDevice === "desktop" ? "default" : "secondary"
                  }
                  onClick={() => setPreviewDevice("desktop")}
                  className="h-8"
                >
                  <Monitor className="h-4 w-4 mr-2" /> Desktop
                </Button>
                <Button
                  variant={previewDevice === "tablet" ? "default" : "secondary"}
                  onClick={() => setPreviewDevice("tablet")}
                  className="h-8"
                >
                  <Tablet className="h-4 w-4 mr-2" /> Tablet
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "secondary"}
                  onClick={() => setPreviewDevice("mobile")}
                  className="h-8"
                >
                  <Smartphone className="h-4 w-4 mr-2" /> Mobile
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-muted/40 p-4 rounded-lg overflow-auto max-h-[70vh]">
            <div
              className="mx-auto bg-background border rounded-xl shadow-lg"
              style={{ width: VIEWPORTS[previewDevice] }}
            >
              <div className="p-4 md:p-6">
                {sortedEnabledSections.map((s) => (
                  <SectionPreview key={s.key} s={s} />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
