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
  Languages,
  Wand2,
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

// ===== API yang dipakai (tanpa perubahan nama fungsi)
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
// imports di paling atas
import { translateBatch } from "@/lib/translate-batch";
import { extractStringLeaves, applyStringLeaves } from "@/lib/i18n/flatten";
import { shouldSkipPath, shouldSkipValue } from "@/lib/i18n/glossary";
import { translateObjectStrings } from "@/lib/translate-object";

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
type Lang = "en" | "id";

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
  /** Versi Indonesia (lama) */
  content: any;
  /** Versi Inggris (baru, basis) */
  content_en?: any;
  theme?: ThemeState;
  items?: any;
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

/** ===== Seed EN (basis) & ID (copy awal agar UI tidak kosong) ===== */
const seedSections = (): StoreSection[] => {
  const SEED_EN: StoreSection[] = [
    {
      key: "hero",
      name: "Hero",
      enabled: true,
      order: 1,
      theme: { ...DEFAULT_THEME },
      content: {}, // ID will be generated from EN (first mount)
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
            description:
              "Pick the plan that fits your requirements and budget.",
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
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
      content: {},
      content_en: {
        headline: "Get in touch",
        subheadline:
          "We’d love to hear from you. Reach out to our team anytime.",
        email: "hello@agilestore.com",
        phone: "+1 (555) 123-4567",
        address: "San Francisco, CA",
        ctaLabel: "Send Message",
      },
    },
  ];

  // Inisialisasi ID = EN (agar UI ID tidak kosong saat awal)
  return SEED_EN.map((s) => ({ ...s, content: structuredClone(s.content_en) }));
};

const makeSafeSection = (
  partial: Partial<StoreSection> & { key: StoreSection["key"] }
): StoreSection => ({
  id: partial.id,
  key: partial.key,
  name: partial.name ?? partial.key,
  enabled: partial.enabled ?? true,
  order: partial.order ?? 1,
  theme: { ...DEFAULT_THEME, ...(partial.theme ?? {}) },
  content_en: partial.content_en ?? {},
  content: partial.content ?? structuredClone(partial.content_en ?? {}),
});

/* ==================== Translator (pluggable) ==================== */
/** Ganti implementasi ini ke translateBatch/endpoint Anda jika tersedia */
async function translateENtoID(payload: any): Promise<any> {
  // Fallback: hanya copy biar tidak error (silakan sambungkan mesin terjemah Anda)
  return structuredClone(payload);
}
async function translateObjectENtoID(enObj: any) {
  return translateContentObject(enObj);
}

/** Util mendalam untuk men-translate seluruh object JSON */
// ===== Translator (pluggable) =====
async function translateContentObject(enObj: any): Promise<any> {
  // Lewati key non-teks (warna/ikon/kode dsb.)
  const skipKeys = (path: string[]) => {
    const key = (path[path.length - 1] || "").toLowerCase();
    return [
      "primary",
      "secondary",
      "accent",
      "background",
      "foreground",
      "color",
      "icon",
      "product_code",
      "refproductcode", // pricing
      "price", // objek angka
      "price_monthly",
      "price_yearly",
      "_auto_from_month_id",
      "_auto_from_year_id",
      "package_id",
      "duration_id",
      "months",
      "email",
      "phone",
      "address", // contact/footer
      "imageurl",
    ].includes(key);
  };

  // translate semua leaf-string dari EN -> ID
  return translateObjectStrings(enObj, {
    from: "en",
    to: "id",
    includeEmpty: false,
    skipKeys,
    // skipValue default sudah menghindari URL, hex color, email/telepon, token pendek, dll.
    onProgress: () => {}, // optional: tampilkan progress bar kalau mau
  });
}

async function translateItemENtoID(item: any) {
  // Kalau item punya versi _en terpisah, tetap dukung:
  const fields = [
    "title",
    "subtitle",
    "description",
    "cta",
    "cta_label",
  ] as const;

  // Kumpulkan EN dari field _en jika ada; kalau tidak, ambil field biasa
  const srcs = fields.map((f) =>
    String(item[`${f}_en` as const] ?? item[f] ?? "")
  );

  // Terjemahkan batch
  const outs = srcs.length
    ? await translateBatch(srcs, { from: "en", to: "id" })
    : [];

  // Pasang balik
  const next: any = { ...item };
  fields.forEach((f, i) => {
    const source = srcs[i];
    if (source) next[f] = outs[i] ?? source;
  });

  // extras_en -> extras (deep translate)
  if (item.extras_en && typeof item.extras_en === "object") {
    next.extras = await translateContentObject(item.extras_en);
  } else if (item.extras && typeof item.extras === "object") {
    // kalau tidak ada _en, tetap translate extras yang ada
    next.extras = await translateContentObject(item.extras);
  }

  return next;
}

/* ==================== Component ==================== */
export function AgileStoreSettings() {
  const [sections, setSections] = useState<StoreSection[]>(seedSections());
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [activeLang, setActiveLang] = useState<Lang>("en"); // << bilingual toggle

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<Device>("desktop");

  const [aborter, setAborter] = useState<AbortController | null>(null);
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

  // mapping fitur
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

  /** ===== Helpers konten bilingual (baca/tulis) ===== */
  const getC = (s: StoreSection) =>
    (activeLang === "en" ? s.content_en : s.content) ?? {};

  const mutateSection = (
    key: StoreSection["key"],
    mutator: (draft: StoreSection) => StoreSection
  ) => {
    setSections((prev) =>
      prev.map((x) => (x.key === key ? mutator({ ...x }) : x))
    );
  };

  const mutateC = (key: StoreSection["key"], updater: (draft: any) => any) => {
    mutateSection(key, (draft) => {
      const base =
        activeLang === "en" ? draft.content_en ?? {} : draft.content ?? {};
      const next = updater(structuredClone(base) ?? {});
      if (activeLang === "en") draft.content_en = next;
      else draft.content = next;
      return draft;
    });
  };

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
              content_en: (r as any).content_en ?? {}, // << ambil dari backend
              content: (r.content as any) ?? undefined, // ID
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
        const c = getC(pricing);
        if (!c.refProductCode && rows[0]?.product_code) {
          mutateC("pricing", (draft) => ({
            ...draft,
            refProductCode: rows[0].product_code,
          }));
        }
      } catch (e) {
        console.error("[AgileStore] load products failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refProductCode =
    (activeLang === "en"
      ? getSection("pricing").content_en?.refProductCode
      : getSection("pricing").content?.refProductCode) || "";

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

        // build map key -> name
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

        // inverse map name -> key
        const featureNameToAnyKey = new Map<string, string>();
        featRows.forEach((f) => {
          const preferKey = f.code ?? f.feature_id ?? f.id;
          if (preferKey) featureNameToAnyKey.set(f.name, preferKey);
        });
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

        const featByPkg: Record<string, string[]> = {};
        grouped.forEach((v, k) => (featByPkg[k] = v));
        setFeaturesByPackage(featByPkg);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refProductCode]);

  /* ====== Helpers Pricing (tanpa perubahan) ====== */
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
    mutateSection("pricing", (draft) => {
      const c = getC(draft);
      const nextPlans = [...(c.plans ?? [])];
      const base = nextPlans[planIndex] ?? {};
      const pkgId = opts?.packageId != null ? opts.packageId : base.package_id;
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

      const next = { ...c, plans: nextPlans };
      if (activeLang === "en") draft.content_en = next;
      else draft.content = next;
      return draft;
    });
  };

  // resinkron ketika harga/fitur berubah
  useEffect(() => {
    const s = getSection("pricing");
    const c = getC(s);
    const plans: any[] = Array.isArray(c?.plans) ? c.plans : [];
    plans.forEach((p, i) => {
      if (!p?.package_id) return;
      recalcPlanPrices(i, {
        packageId: p.package_id,
        durationId: p.duration_id,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuresByPackage, priceIndex, activeLang]);

  /* ====== SAVE (kirim content_en & content) ====== */
  const saveAll = async () => {
    try {
      const toItems = (s: StoreSection, useEN: boolean) => {
        const c = useEN ? s.content_en : s.content;
        if (s.key === "products") {
          const arr = (c?.items || []) as Array<any>;
          return arr.map((it: any, i: number) => ({
            title: it.name ?? it.title ?? "",
            description: it.description ?? "",
            cta_label: it.cta ?? "",
            order: i + 1,
            product_code: it.product_code ?? undefined,
          }));
        }
        if (s.key === "pricing") {
          const plans = (c?.plans || []) as Array<any>;
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
              extras: { features: mappedCodes },
            };
          });
        }
        if (s.key === "testimonials") {
          const its = (c?.items || []) as Array<any>;
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
          const its = (c?.items || []) as Array<any>;
          return its.map((f: any, i: number) => ({
            order: i + 1,
            title: f.title ?? "",
            description: f.description ?? "",
          }));
        }
        if (s.key === "how") {
          const its = (c?.steps || []) as Array<any>;
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
            content: s.content ?? null, // Indonesia
            content_en: (s as any).content_en ?? null, // English dasar
            ...(s.items ? { items: s.items } : {}),
          })),
      };

      await upsertAgileSections(payload as any);
      alert("Settings saved.");
    } catch (e: any) {
      console.error(e);
      alert(`Failed to save: ${e?.message ?? e}`);
    }
  };

  /* ====== PREVIEW (gunakan konten sesuai bahasa aktif) ====== */
  const SectionPreview = ({ s }: { s: StoreSection }) => {
    const c = getC(s);
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
          <div className="text-3xl font-bold mb-2">{c?.title ?? ""}</div>
          <div className="opacity-90 mb-4">{c?.subtitle ?? ""}</div>
          <div className="flex gap-2">
            <Button className="bg-white text-black hover:bg-white/90">
              {c?.primaryCta ?? "Get Started"}
            </Button>
            <Button
              variant="secondary"
              className="bg-transparent border border-white/30 text-white hover:bg-white/10"
            >
              {c?.secondaryCta ?? "Learn More"}
            </Button>
          </div>
        </div>
      );
    }

    if (s.key === "why") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">{c?.title ?? ""}</div>
          <div className="grid md:grid-cols-2 gap-3">
            {(c?.items ?? []).map((it: any, i: number) => (
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
          <div className="text-xl font-semibold mb-2">{c?.title ?? ""}</div>
          <div className="text-sm opacity-80 mb-3">{c?.subtitle ?? ""}</div>
          <ol className="list-decimal pl-6 space-y-1">
            {(c?.steps ?? []).map((st: any, i: number) => (
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
            {c?.title ?? "Our Products"}
          </div>
          <div className="text-sm opacity-80 mb-3">{c?.subtitle ?? ""}</div>
          <div className="grid md:grid-cols-2 gap-3">
            {(c?.items ?? []).map((it: any, i: number) => (
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
          <div className="text-xl font-semibold mb-2">{c?.title ?? ""}</div>
          <div className="text-sm opacity-80 mb-4">{c?.subtitle ?? ""}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(c?.plans ?? []).map((p: any, i: number) => {
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
          <div className="text-lg opacity-90">{c?.title ?? ""}</div>
          <div className="text-sm opacity-90 mb-3">{c?.subtitle ?? ""}</div>
          <div className="flex gap-2">
            <Button className="bg-white text-black hover:bg-white/90">
              {c?.primary ?? "Primary"}
            </Button>
            <Button
              variant="secondary"
              className="bg-transparent border border-white/30 text-white hover:bg-white/10"
            >
              {c?.secondary ?? "Secondary"}
            </Button>
          </div>
        </div>
      );
    }

    if (s.key === "testimonials") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-sm text-muted-foreground mb-3">
            {c?.title ?? ""}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {(c?.items ?? []).map((t: any, i: number) => (
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
            {c?.brand ?? "Agile Store"}
          </div>
          <div className="text-sm opacity-80">{c?.description ?? ""}</div>
        </div>
      );
    }

    if (s.key === "about") {
      return (
        <div className="rounded-xl p-6 border mb-6" style={blockStyle as any}>
          <div className="text-xl font-semibold mb-2">
            {c?.headline ?? "About"}
          </div>
          <div className="text-sm opacity-80 mb-4">{c?.subheadline ?? ""}</div>
          <div className="grid md:grid-cols-2 gap-3">
            {(c?.features ?? []).map((f: string, i: number) => (
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
            {c?.headline ?? "Contact"}
          </div>
          <div className="text-sm opacity-80 mb-3">{c?.subheadline ?? ""}</div>
          <div className="text-sm">
            <div>Email: {c?.email}</div>
            <div>Phone: {c?.phone}</div>
            <div>Address: {c?.address}</div>
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

  /* ====== Generate (EN -> ID) ====== */
  const generateIDForSection = async (key: StoreSection["key"]) => {
    const sec = getSection(key);
    const en = sec.content_en ?? {};
    const id = await translateContentObject(en);
    mutateSection(key, (draft) => {
      draft.content = id;
      return draft;
    });
    alert(`Generated ID for section: ${sec.name}`);
  };

  const generateIDForAll = async () => {
    for (const s of sections) {
      const en = s.content_en ?? {};
      const id = await translateContentObject(en);
      // flush per section
      // eslint-disable-next-line no-loop-func
      setSections((prev) =>
        prev.map((x) => (x.key === s.key ? { ...x, content: id } : x))
      );
    }
    alert("Generated ID for all sections.");
  };
  async function handleGenerateSectionFromEN(sectionKey: StoreSection["key"]) {
    const ac = new AbortController();
    setAborter(ac);
    try {
      const cur = sections.find((s) => s.key === sectionKey);
      if (!cur) return;
      const enContent = cur.content_en ?? cur.content ?? {};
      const idContent = await translateObjectENtoID(enContent); // sudah kirim signal/glossary

      let idItems = cur.items;
      if (Array.isArray(cur.items) && cur.items.length) {
        const translatedItems = [];
        for (const it of cur.items) {
          translatedItems.push(await translateItemENtoID(it)); // sudah kirim signal/glossary
        }
        idItems = translatedItems;
      }

      setSections((prev) =>
        prev.map((s) =>
          s.key === sectionKey
            ? { ...s, content: idContent, items: idItems }
            : s
        )
      );
    } finally {
      setAborter(null);
    }
  }

  async function handleGenerateAllFromEN() {
    const ac = new AbortController();
    setAborter(ac);
    try {
      // sequential untuk aman rate limit
      for (const s of sections) {
        await handleGenerateSectionFromEN(s.key);
      }
    } finally {
      setAborter(null);
    }
  }

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
          {/* Toggle Bahasa (tanpa ubah gaya lain) */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant={activeLang === "en" ? "default" : "secondary"}
              className="h-8"
              onClick={() => setActiveLang("en")}
              title="Edit English content (base)"
            >
              <Languages className="h-4 w-4 mr-2" />
              English
            </Button>
            <Button
              variant={activeLang === "id" ? "default" : "secondary"}
              className="h-8"
              onClick={() => setActiveLang("id")}
              title="Edit Indonesian content"
            >
              <Languages className="h-4 w-4 mr-2" />
              Indonesia
            </Button>
          </div>

          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button onClick={saveAll}>
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </div>

      {/* Info bar: tombol generate semua saat tab ID */}
      {activeLang === "id" && (
        <div className="p-3 rounded-lg border flex items-center justify-between">
          <div className="text-sm">
            Tab <b>Bahasa Indonesia</b>. Anda bisa mengisi manual atau klik
            generate untuk menyalin/terjemahkan dari basis <b>English</b>.
          </div>
          <Button variant="outline" onClick={handleGenerateAllFromEN}>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate ID from EN (All Sections)
          </Button>
        </div>
      )}

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
                {getSection(activeSection as any).name} Settings{" "}
                {activeLang === "en" ? "(English)" : "(Indonesia)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme per section (unchanged) */}
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

              {/* Tombol generate 1 section (muncul hanya saat ID) */}
              {activeLang === "id" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleGenerateSectionFromEN(activeSection as any)
                    }
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate this section from EN
                  </Button>
                </div>
              )}

              {/* ================= HERO ================= */}
              {activeSection === "hero" &&
                (() => {
                  const s = getSection("hero");
                  const c = getC(s);
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={c.title ?? ""}
                            onChange={(e) =>
                              mutateC("hero", (d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={c.subtitle ?? ""}
                            onChange={(e) =>
                              mutateC("hero", (d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Primary CTA</Label>
                          <Input
                            value={c.primaryCta ?? ""}
                            onChange={(e) =>
                              mutateC("hero", (d) => ({
                                ...d,
                                primaryCta: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Secondary CTA</Label>
                          <Input
                            value={c.secondaryCta ?? ""}
                            onChange={(e) =>
                              mutateC("hero", (d) => ({
                                ...d,
                                secondaryCta: e.target.value,
                              }))
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
                  const c = getC(s);
                  const items: any[] = Array.isArray(c?.items) ? c.items : [];
                  return (
                    <div className="space-y-4">
                      <Label>Title</Label>
                      <Input
                        value={c.title ?? ""}
                        onChange={(e) =>
                          mutateC("why", (d) => ({
                            ...d,
                            title: e.target.value,
                          }))
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
                                mutateC("why", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    title: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={it.description ?? ""}
                              onChange={(e) =>
                                mutateC("why", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    description: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            mutateC("why", (d) => ({
                              ...d,
                              items: [
                                ...(d.items ?? []),
                                { title: "", description: "" },
                              ],
                            }))
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
                  const c = getC(s);
                  const steps: any[] = Array.isArray(c?.steps) ? c.steps : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={c.title ?? ""}
                            onChange={(e) =>
                              mutateC("how", (d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={c.subtitle ?? ""}
                            onChange={(e) =>
                              mutateC("how", (d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
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
                                mutateC("how", (d) => {
                                  const next = [...(d.steps ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    title: e.target.value,
                                  };
                                  return { ...d, steps: next };
                                })
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={st.description ?? ""}
                              onChange={(e) =>
                                mutateC("how", (d) => {
                                  const next = [...(d.steps ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    description: e.target.value,
                                  };
                                  return { ...d, steps: next };
                                })
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            mutateC("how", (d) => ({
                              ...d,
                              steps: [
                                ...(d.steps ?? []),
                                { title: "", description: "" },
                              ],
                            }))
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
                  const c = getC(s);
                  const items: any[] = Array.isArray(c?.items) ? c.items : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={c.title ?? ""}
                            onChange={(e) =>
                              mutateC("products", (d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={c.subtitle ?? ""}
                            onChange={(e) =>
                              mutateC("products", (d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
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
                                  mutateC("products", (d) => {
                                    const next = [...(d.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      name: e.target.value,
                                    };
                                    return { ...d, items: next };
                                  })
                                }
                              />
                              <Input
                                placeholder="CTA label"
                                value={it.cta ?? ""}
                                onChange={(e) =>
                                  mutateC("products", (d) => {
                                    const next = [...(d.items ?? [])];
                                    next[i] = {
                                      ...next[i],
                                      cta: e.target.value,
                                    };
                                    return { ...d, items: next };
                                  })
                                }
                              />
                            </div>
                            <Textarea
                              placeholder="Short description"
                              value={it.description ?? ""}
                              onChange={(e) =>
                                mutateC("products", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    description: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
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
                                    mutateC("products", (d) => {
                                      const next = [...(d.items ?? [])];
                                      next[i] = {
                                        ...next[i],
                                        product_code: val,
                                      };
                                      return { ...d, items: next };
                                    })
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
                                    mutateC("products", (d) => ({
                                      ...d,
                                      items: arrayMove(
                                        d.items ?? [],
                                        i,
                                        Math.max(0, i - 1)
                                      ),
                                    }))
                                  }
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    mutateC("products", (d) => ({
                                      ...d,
                                      items: arrayMove(d.items ?? [], i, i + 1),
                                    }))
                                  }
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() =>
                                    mutateC("products", (d) => {
                                      const next = [...(d.items ?? [])];
                                      next.splice(i, 1);
                                      return { ...d, items: next };
                                    })
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
                            mutateC("products", (d) => ({
                              ...d,
                              items: [
                                ...(d.items ?? []),
                                { name: "", description: "", cta: "" },
                              ],
                            }))
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
                  const c = getC(s);
                  return (
                    <div className="space-y-4">
                      <div>
                        <Label>Reference Product (for packages & prices)</Label>
                        <Select
                          value={c.refProductCode ?? ""}
                          onValueChange={(val) =>
                            mutateC("pricing", (d) => ({
                              ...d,
                              refProductCode: val,
                            }))
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
                            value={c.title ?? ""}
                            onChange={(e) =>
                              mutateC("pricing", (d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={c.subtitle ?? ""}
                            onChange={(e) =>
                              mutateC("pricing", (d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        {(c.plans ?? []).map((p: any, i: number) => {
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
                                  mutateC("pricing", (d) => {
                                    const plans = [...(d.plans ?? [])];
                                    plans[i] = {
                                      ...plans[i],
                                      name: e.target.value,
                                    };
                                    return { ...d, plans };
                                  })
                                }
                                placeholder="Plan name"
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Package</Label>
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
                                      <SelectValue placeholder="Choose package" />
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
                                      mutateC("pricing", (d) => {
                                        const plans = [...(d.plans ?? [])];
                                        plans[i] = {
                                          ...plans[i],
                                          price: {
                                            ...(plans[i].price ?? {}),
                                            monthly: Number(e.target.value),
                                          },
                                        };
                                        return { ...d, plans };
                                      })
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
                                      mutateC("pricing", (d) => {
                                        const plans = [...(d.plans ?? [])];
                                        plans[i] = {
                                          ...plans[i],
                                          price: {
                                            ...(plans[i].price ?? {}),
                                            yearly: Number(e.target.value),
                                          },
                                        };
                                        return { ...d, plans };
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <Textarea
                                value={
                                  Array.isArray(p.features)
                                    ? p.features
                                        .map((f: any) => {
                                          if (
                                            typeof f === "object" &&
                                            f !== null
                                          )
                                            return f.name ?? f.code ?? "";
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
                                    if (nameToKey[nm]) return nameToKey[nm];
                                    if (
                                      nm.includes(".") ||
                                      nm.includes("_") ||
                                      nm.includes("-")
                                    )
                                      return nm;
                                    return nm;
                                  });

                                  mutateC("pricing", (d) => {
                                    const plans = [...(d.plans ?? [])];
                                    const plan = { ...(plans[i] ?? {}) };
                                    plan.features = names;
                                    plan.feature_codes = codes;
                                    plans[i] = plan;
                                    return { ...d, plans };
                                  });
                                }}
                                rows={3}
                                placeholder={"Feature 1\nFeature 2\nFeature 3"}
                              />

                              <Input
                                value={p.cta ?? ""}
                                onChange={(e) =>
                                  mutateC("pricing", (d) => {
                                    const plans = [...(d.plans ?? [])];
                                    plans[i] = {
                                      ...plans[i],
                                      cta: e.target.value,
                                    };
                                    return { ...d, plans };
                                  })
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
                  const c = getC(s);
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={c.title ?? ""}
                            onChange={(e) =>
                              mutateC("cta", (d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={c.subtitle ?? ""}
                            onChange={(e) =>
                              mutateC("cta", (d) => ({
                                ...d,
                                subtitle: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Button</Label>
                          <Input
                            value={c.primary ?? ""}
                            onChange={(e) =>
                              mutateC("cta", (d) => ({
                                ...d,
                                primary: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Secondary Button</Label>
                          <Input
                            value={c.secondary ?? ""}
                            onChange={(e) =>
                              mutateC("cta", (d) => ({
                                ...d,
                                secondary: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Bullets (one per line)</Label>
                        <Textarea
                          rows={4}
                          value={
                            Array.isArray(c.bullets) ? c.bullets.join("\n") : ""
                          }
                          onChange={(e) =>
                            mutateC("cta", (d) => ({
                              ...d,
                              bullets: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            }))
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
                  const c = getC(s);
                  const items: any[] = Array.isArray(c?.items) ? c.items : [];
                  return (
                    <div className="space-y-4">
                      <Label>Section Title</Label>
                      <Input
                        value={c.title ?? ""}
                        onChange={(e) =>
                          mutateC("testimonials", (d) => ({
                            ...d,
                            title: e.target.value,
                          }))
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
                                mutateC("testimonials", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    quote: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
                              }
                            />
                            <Input
                              placeholder="Name"
                              value={it.name ?? ""}
                              onChange={(e) =>
                                mutateC("testimonials", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    name: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
                              }
                            />
                            <Input
                              placeholder="Role"
                              value={it.role ?? ""}
                              onChange={(e) =>
                                mutateC("testimonials", (d) => {
                                  const next = [...(d.items ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    role: e.target.value,
                                  };
                                  return { ...d, items: next };
                                })
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            mutateC("testimonials", (d) => ({
                              ...d,
                              items: [
                                ...(d.items ?? []),
                                { quote: "", name: "", role: "" },
                              ],
                            }))
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
                  const c = getC(s);
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Brand</Label>
                          <Input
                            value={c.brand ?? ""}
                            onChange={(e) =>
                              mutateC("footer", (d) => ({
                                ...d,
                                brand: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Newsletter Label</Label>
                          <Input
                            value={c.newsletterLabel ?? ""}
                            onChange={(e) =>
                              mutateC("footer", (d) => ({
                                ...d,
                                newsletterLabel: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={c.description ?? ""}
                          onChange={(e) =>
                            mutateC("footer", (d) => ({
                              ...d,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Quick Links (one per line)</Label>
                          <Textarea
                            rows={4}
                            value={
                              Array.isArray(c.quickLinks)
                                ? c.quickLinks.join("\n")
                                : ""
                            }
                            onChange={(e) =>
                              mutateC("footer", (d) => ({
                                ...d,
                                quickLinks: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              }))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Contact</Label>
                          <div className="grid md:grid-cols-3 gap-2">
                            <Input
                              placeholder="Email"
                              value={c?.contact?.email ?? ""}
                              onChange={(e) =>
                                mutateC("footer", (d) => ({
                                  ...d,
                                  contact: {
                                    ...(d.contact ?? {}),
                                    email: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              placeholder="Phone"
                              value={c?.contact?.phone ?? ""}
                              onChange={(e) =>
                                mutateC("footer", (d) => ({
                                  ...d,
                                  contact: {
                                    ...(d.contact ?? {}),
                                    phone: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              placeholder="Address"
                              value={c?.contact?.address ?? ""}
                              onChange={(e) =>
                                mutateC("footer", (d) => ({
                                  ...d,
                                  contact: {
                                    ...(d.contact ?? {}),
                                    address: e.target.value,
                                  },
                                }))
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
                  const c = getC(s);
                  const feats: string[] = Array.isArray(c?.features)
                    ? c.features
                    : [];
                  const steps: any[] = Array.isArray(c?.steps) ? c.steps : [];
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Headline</Label>
                          <Input
                            value={c.headline ?? ""}
                            onChange={(e) =>
                              mutateC("about", (d) => ({
                                ...d,
                                headline: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subheadline</Label>
                          <Input
                            value={c.subheadline ?? ""}
                            onChange={(e) =>
                              mutateC("about", (d) => ({
                                ...d,
                                subheadline: e.target.value,
                              }))
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
                            mutateC("about", (d) => ({
                              ...d,
                              features: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            }))
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
                                mutateC("about", (d) => {
                                  const next = [...(d.steps ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    title: e.target.value,
                                  };
                                  return { ...d, steps: next };
                                })
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={st.description ?? ""}
                              onChange={(e) =>
                                mutateC("about", (d) => {
                                  const next = [...(d.steps ?? [])];
                                  next[i] = {
                                    ...next[i],
                                    description: e.target.value,
                                  };
                                  return { ...d, steps: next };
                                })
                              }
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            mutateC("about", (d) => ({
                              ...d,
                              steps: [
                                ...(d.steps ?? []),
                                { title: "", description: "" },
                              ],
                            }))
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
                  const c = getC(s);
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Headline</Label>
                          <Input
                            value={c.headline ?? ""}
                            onChange={(e) =>
                              mutateC("contact", (d) => ({
                                ...d,
                                headline: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Subheadline</Label>
                          <Input
                            value={c.subheadline ?? ""}
                            onChange={(e) =>
                              mutateC("contact", (d) => ({
                                ...d,
                                subheadline: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Email"
                          value={c.email ?? ""}
                          onChange={(e) =>
                            mutateC("contact", (d) => ({
                              ...d,
                              email: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={c.phone ?? ""}
                          onChange={(e) =>
                            mutateC("contact", (d) => ({
                              ...d,
                              phone: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Address"
                          value={c.address ?? ""}
                          onChange={(e) =>
                            mutateC("contact", (d) => ({
                              ...d,
                              address: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>CTA Label</Label>
                        <Input
                          value={c.ctaLabel ?? ""}
                          onChange={(e) =>
                            mutateC("contact", (d) => ({
                              ...d,
                              ctaLabel: e.target.value,
                            }))
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
              <DialogTitle>
                Preview — All Sections (
                {activeLang === "en" ? "English" : "Indonesia"})
              </DialogTitle>
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
