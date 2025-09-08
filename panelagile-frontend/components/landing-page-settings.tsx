"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Eye,
  Save,
  Upload,
  Plus,
  Edit,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Image as ImageIcon,
  Layout,
  Settings,
  X,
} from "lucide-react";

import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

/* ================== Types ================== */
interface LandingPageSectionUI {
  id: string; // == section_key
  name: string;
  enabled: boolean;
  order: number;
  content: any;
  _recordId?: string; // DB id
}

interface ProductSlim {
  id: string;
  name: string;
  description: string;
  status: string;
  product_code: string;
}

type PricelistItemDTO = {
  id?: string;
  duration_id: string | number;
  package_id: string | number;
  price: number;
  discount?: number | null;
  min_billing_cycle?: number | null;
  prorate?: boolean | null;
  effective_start?: string | null;
  effective_end?: string | null;
  package_code?: string | null;
  duration_code?: string | null;
};

/* ================== API helpers ================== */
function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken?.();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchCatalogProducts(): Promise<ProductSlim[]> {
  const url = new URL(`${API_URL.replace(/\/$/, "")}/catalog/products`);
  url.searchParams.set("per_page", "200");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json().catch(() => ({}));
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return rows.map((r) => ({
    id: String(r.id ?? r.product_id ?? r.product_code ?? crypto.randomUUID()),
    name: String(
      r.product_name ?? r.name ?? r.title ?? r.product_code ?? "Product"
    ),
    description: String(r.description ?? r.product_description ?? "") || "",
    status: String(r.status ?? "active"),
    product_code: String(r.product_code ?? r.code ?? r.slug ?? ""),
  }));
}

async function getLandingByProduct(codeOrId: string) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/landing`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const data = json?.data ?? {};
  return {
    product: data.product,
    page: data.page,
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
}

async function saveLandingByProduct(
  codeOrId: string,
  payload: {
    status?: "draft" | "published";
    meta?: Record<string, any> | null;
    sections: Array<{
      id?: string;
      section_key: string;
      name: string;
      enabled: boolean;
      display_order: number;
      content?: any;
    }>;
  }
) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/landing`;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* === product relations === */
async function panelListFeaturesByProduct(codeOrId: string, refresh = false) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/features`
  );
  if (refresh) url.searchParams.set("refresh", "1");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { data: rows(item_type=FEATURE) }
}

async function listPackagesByProduct(
  codeOrId: string,
  includeInactive = false
) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/packages`
  );
  if (includeInactive) url.searchParams.set("include_inactive", "1");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? r.package_name ?? "Package"),
    description: String(r.description ?? "") || "",
    status: String(r.status ?? "active"),
    package_code: r.package_code ? String(r.package_code) : undefined,
  }));
}

async function listDurationsActive(): Promise<
  Array<{ id: string; name: string; code: string; months: number }>
> {
  const url = new URL(`${API_URL}/durations`);
  url.searchParams.set("status", "active");
  const res = await fetch(url.toString(), {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    code: String(r.code ?? ""),
    months: Number(r.months ?? r.length ?? 1),
  }));
}

async function getPricelistByProduct(codeOrId: string) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/pricelist`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    currency: string;
    tax_mode: "inclusive" | "exclusive";
    items: PricelistItemDTO[];
  }>;
}

async function updatePricelistHeader(
  codeOrId: string,
  payload: { currency: string; tax_mode: "inclusive" | "exclusive" }
) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/pricelist`;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function upsertPricelistItems(
  codeOrId: string,
  payload: {
    currency: string;
    tax_mode: "inclusive" | "exclusive";
    items: PricelistItemDTO[];
  }
) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/pricelist/bulk`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* === upload === */
async function uploadMedia(file: File): Promise<string> {
  // Back-end kecil: POST /uploads -> { url: "https://..." }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    body: fd,
    headers: authHeaders(),
  });
  if (res.ok) {
    const j = await res.json().catch(() => ({}));
    if (j?.url) return String(j.url);
  }
  // fallback: object URL
  return URL.createObjectURL(file);
}

/* === upload helpers (persist to storage before save) === */
function isBlobOrDataUrl(url?: string | null) {
  if (!url) return false;
  return url.startsWith("blob:") || url.startsWith("data:");
}

async function ensureUploadUrl(
  value?: string | File | null
): Promise<string | null> {
  if (!value) return null;
  if (typeof File !== "undefined" && value instanceof File) {
    return await uploadMedia(value);
  }
  const s = String(value);
  if (isBlobOrDataUrl(s)) {
    try {
      const res = await fetch(s);
      const blob = await res.blob();
      const file = new File([blob], `upload-${Date.now()}`, {
        type: blob.type || "application/octet-stream",
      });
      return await uploadMedia(file);
    } catch {
      return s;
    }
  }
  return s;
}

/**
 * Pastikan semua media sudah tersimpan ke storage (bukan blob:) sebelum save
 */
async function materializeUploads(
  sections: LandingPageSectionUI[]
): Promise<LandingPageSectionUI[]> {
  const cloned = sections.map((s) => ({
    ...s,
    content: { ...(s.content || {}) },
  }));

  for (const s of cloned) {
    if (s.id === "hero") {
      if (s.content?.backgroundImage) {
        s.content.backgroundImage = await ensureUploadUrl(
          s.content.backgroundImage
        );
      }
      if (s.content?.videoUrl && isBlobOrDataUrl(s.content.videoUrl)) {
        s.content.videoUrl = await ensureUploadUrl(s.content.videoUrl);
      }
    }
    if (s.id === "demo" && Array.isArray(s.content?.videos)) {
      s.content.videos = await Promise.all(
        s.content.videos.map(async (v: any) => {
          const next = { ...(v || {}) };
          if (next.thumbnail)
            next.thumbnail = await ensureUploadUrl(next.thumbnail);
          if (next.url) next.url = await ensureUploadUrl(next.url);
          return next;
        })
      );
    }
  }
  return cloned;
}

/* === small UI utility for “Edit” buttons === */
function focusInside(container: HTMLElement | null) {
  if (!container) return;
  const firstEditable = container.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >("input, textarea");
  firstEditable?.focus();
  container.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ================== Defaults (fallback) ================== */
const DEFAULT_SECTIONS: LandingPageSectionUI[] = [
  {
    id: "hero",
    name: "Hero Section",
    enabled: true,
    order: 1,
    content: {
      title: "See Product in Action",
      subtitle:
        "Watch how Product transforms your rental property management with intuitive interfaces and powerful features.",
      ctaText: "Start Free Trial",
      backgroundImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7Q8YkkhfFWdiP2ur6esDmeobrRv2yg.png",
      videoUrl: "",
    },
  },
  {
    id: "features",
    name: "Features Section",
    enabled: true,
    order: 2,
    content: {
      title: "Powerful Features",
      subtitle:
        "Everything you need to manage your rental business efficiently",
      // akan diisi dari API product features saat load
      features: [],
    },
  },
  {
    id: "demo",
    name: "Demo Videos",
    enabled: true,
    order: 3,
    content: {
      title: "See how easy it is to manage your rental properties",
      videos: [
        {
          title: "Dashboard Overview",
          duration: "2:30",
          thumbnail:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DeFpIAvPWQcDiTZjmvnERPESLrbq6X.png",
          url: "",
        },
      ],
    },
  },
  {
    id: "benefits",
    name: "Benefits Section",
    enabled: true,
    order: 4,
    content: {
      benefits: [
        {
          icon: "zap",
          title: "Faster Setup",
          description: "Get started in minutes, not hours",
        },
        {
          icon: "target",
          title: "Accurate Reporting",
          description: "Real-time data you can trust",
        },
        {
          icon: "users",
          title: "Scales with Your Team",
          description: "From 1 to 1000+ vehicles",
        },
        {
          icon: "heart",
          title: "Friendly Support",
          description: "24/7 customer success team",
        },
      ],
    },
  },
  {
    id: "cta",
    name: "Call to Action",
    enabled: true,
    order: 5,
    content: {
      title: "Ready to Transform Your Property Management?",
      subtitle:
        "Join thousands of property managers who've streamlined their operations with Rent Vix Pro",
      features: ["10,000+ Users", "30-Day Guarantee", "Setup in 5 Minutes"],
      primaryCta: "Start Free Trial",
      secondaryCta: "View Pricing",
      stats: [
        { value: "99.9%", label: "Uptime" },
        { value: "24/7", label: "Support" },
        { value: "50+", label: "Integrations" },
        { value: "4.9★", label: "User Rating" },
      ],
    },
  },
  {
    id: "pricing",
    name: "Pricing Section",
    enabled: true,
    order: 6,
    content: {
      title: "Choose Your Plan",
      subtitle: "Start your free trial today. No credit card required.",
      billingToggle: true,
      // akan dipetakan ke packages & pricelist pada load/save
      plans: [],
      currency: "IDR",
      tax_mode: "inclusive",
    },
  },
  {
    id: "testimonials",
    name: "Testimonials",
    enabled: true,
    order: 7,
    content: {
      title: "Trusted by Property Managers Worldwide",
      subtitle:
        "Join thousands of property managers who have transformed their business with Rent Vix Pro",
      stats: [
        { value: "10,000+", label: "Properties Managed" },
        { value: "98%", label: "Customer Satisfaction" },
        { value: "4.9/5", label: "Average Rating" },
      ],
      testimonials: [
        {
          quote: "Great product!",
          author: "Anonymous",
          company: "Fleet Manager, Jakarta Rentals",
        },
        {
          quote: "Great product!",
          author: "Anonymous",
          company: "Operations Director, Bali Transport",
        },
      ],
      companies: [
        "PropertyPro",
        "RentMaster",
        "Urban Holdings",
        "Elite Properties",
        "Premier Rentals",
      ],
    },
  },
  {
    id: "footer",
    name: "Footer",
    enabled: true,
    order: 8,
    content: {
      companyName: "Agile Store",
      description:
        "Empowering businesses with digital solutions that drive growth and efficiency. Transform your operations with our suite of professional tools.",
      sections: [
        { title: "PRODUCT", links: ["Features", "Pricing", "Demo", "Reviews"] },
        {
          title: "SUPPORT",
          links: [
            "FAQ",
            "Contact Support",
            "Terms of Service",
            "Privacy Policy",
          ],
        },
      ],
      socialLinks: ["facebook", "twitter", "linkedin"],
      copyright: "© 2024 Agile Store. All rights reserved.",
      badges: ["SSL Secured", "Privacy Protected"],
    },
  },
];

/* ================== Component ================== */
export function LandingPageSettings() {
  const [products, setProducts] = useState<ProductSlim[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [sections, setSections] =
    useState<LandingPageSectionUI[]>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [featureBind, setFeatureBind] = useState<boolean>(true); // bind fitur ke product features
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // relations caches
  const [packages, setPackages] = useState<
    Array<{ id: string; name: string; package_code?: string }>
  >([]);
  const [durations, setDurations] = useState<
    Array<{ id: string; name: string; code: string; months: number }>
  >([]);
  const monthlyDuration = useMemo(
    () => durations.find((d) => d.months === 1) || durations[0],
    [durations]
  );
  const yearlyDuration = useMemo(
    () =>
      durations.find((d) => d.months === 12) ||
      durations.find((d) => d.months >= 12) ||
      durations[durations.length - 1],
    [durations]
  );

  const selectedProductData = useMemo(
    () =>
      products.find(
        (p) => p.product_code === selectedProduct || p.id === selectedProduct
      ),
    [products, selectedProduct]
  );
  // ===== Pricing cache & helpers (module hooks, no React.*) =====
  const pricelistRef = useRef<{
    currency: string;
    tax_mode: "inclusive" | "exclusive";
    items: PricelistItemDTO[];
  }>({
    currency: "IDR",
    tax_mode: "inclusive",
    items: [],
  });

  const durationsRef = useRef<
    Array<{ id: string; name: string; code: string; months: number }>
  >([]);

  /** Cari harga dari pricelist (cache) untuk (package, duration) */
  const priceOf = useCallback(
    (pkgId: string, durId?: string | number | null) => {
      const it = pricelistRef.current.items.find(
        (i) =>
          String(i.package_id) === String(pkgId) &&
          (!durId || String(i.duration_id) === String(durId))
      );
      return it?.price ?? null;
    },
    []
  );

  /** Sinkronkan harga plan ketika package dipilih/berubah */
  const syncPlanPriceFromPricelist = useCallback(
    (planIndex: number, pkgId: string) => {
      const durs = durationsRef.current;
      if (!durs.length) return;

      const monthly = durs.find((d) => d.months === 1) || durs[0];
      const yearly =
        durs.find((d) => d.months === 12) ||
        durs.find((d) => d.months >= 12) ||
        durs[durs.length - 1];

      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== "pricing") return s;
          const arr = Array.isArray(s.content.plans)
            ? [...s.content.plans]
            : [];
          const old = arr[planIndex] ?? {};
          arr[planIndex] = {
            ...old,
            package_id: pkgId,
            price: {
              monthly: monthly ? priceOf(pkgId, monthly.id) ?? 0 : 0,
              yearly: yearly ? priceOf(pkgId, yearly.id) ?? 0 : 0,
            },
          };
          return { ...s, content: { ...s.content, plans: arr } };
        })
      );
    },
    [setSections, priceOf]
  );
  // === Features cache & helpers ===
  const featuresRef = useRef<string[]>([]);

  // ubah apa pun → string[]
  function toStringFeatures(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) =>
        typeof x === "string"
          ? x
          : x && typeof x === "object"
          ? String(x.title ?? x.name ?? x.feature_name ?? "").trim()
          : ""
      )
      .filter(Boolean);
  }

  // bangun daftar fitur dari API (FEATURE + SUBFEATURE)
  function buildBoundFeatures(rows: any[]): string[] {
    return (rows || [])
      .filter((r: any) => r?.is_active !== false)
      .filter((r: any) => {
        const t = String(r?.item_type || r?.type || "").toUpperCase();
        return t === "FEATURE" || t === "SUBFEATURE" || !t;
      })
      .sort(
        (a: any, b: any) =>
          Number(a?.order_number ?? 0) - Number(b?.order_number ?? 0)
      )
      .map((r: any) =>
        String(r?.name ?? r?.title ?? r?.feature_name ?? "").trim()
      )
      .filter(Boolean);
  }
  function buildFeatureObjectsFromAPI(rows: any[]) {
    return (rows || [])
      .filter((r: any) => r?.is_active !== false)
      .filter((r: any) => {
        const t = String(r?.item_type || r?.type || "").toUpperCase();
        return t === "FEATURE" || t === "SUBFEATURE" || !t;
      })
      .sort(
        (a: any, b: any) =>
          Number(a?.order_number ?? 0) - Number(b?.order_number ?? 0)
      )
      .map((r: any) => ({
        icon: "zap",
        title: String(r?.name ?? r?.title ?? r?.feature_name ?? "").trim(),
        description: String(r?.description ?? "").trim(),
        code: String(r?.feature_code ?? r?.code ?? r?.id ?? ""),
      }))
      .filter((o) => o.title);
  }

  /* ---------- Load products ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchCatalogProducts();
        if (!mounted) return;
        setProducts(rows);
        if (!selectedProduct && rows.length)
          setSelectedProduct(rows[0].product_code || rows[0].id);
      } catch (e) {
        console.error("Failed to load products:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Load on product change: landing + relations ---------- */
  useEffect(() => {
    if (!selectedProduct) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const [landing, featsRes, pkgs, durs, pr] = await Promise.allSettled([
          getLandingByProduct(selectedProduct),
          panelListFeaturesByProduct(selectedProduct),
          listPackagesByProduct(selectedProduct),
          listDurationsActive(),
          getPricelistByProduct(selectedProduct),
        ]);

        // ---------- Simpan packages & durations ----------
        if (pkgs.status === "fulfilled" && mounted) {
          setPackages(pkgs.value);
        }
        if (durs.status === "fulfilled" && mounted) {
          setDurations(durs.value);
          durationsRef.current = durs.value; // cache untuk handler
        }

        // ---------- Simpan pricelist ke ref ----------
        if (pr.status === "fulfilled") {
          pricelistRef.current = {
            currency: pr.value.currency,
            tax_mode: pr.value.tax_mode,
            items: Array.isArray(pr.value.items) ? pr.value.items : [],
          };
        } else {
          pricelistRef.current = {
            currency: "IDR",
            tax_mode: "inclusive",
            items: [],
          };
        }

        // ---------- Landing → UI sections ----------
        if (landing.status === "fulfilled" && mounted) {
          const apiSections = Array.isArray(landing.value.sections)
            ? landing.value.sections
            : [];

          if (apiSections.length) {
            const mapped = apiSections
              .map((s: any) => ({
                id: s.section_key,
                name: s.name,
                enabled: !!s.enabled,
                order: Number(s.display_order ?? 0),
                content: s.content ?? {},
                _recordId: s.id,
              }))
              .sort((a: any, b: any) => a.order - b.order);

            setSections(mapped);

            // pastikan activeSection valid
            const exists = mapped.some((m) => m.id === activeSection);
            if (!exists && mapped.length) setActiveSection(mapped[0].id);
          } else {
            setSections(DEFAULT_SECTIONS);
            setActiveSection("hero");
          }
        } else if (mounted) {
          setSections(DEFAULT_SECTIONS);
          setActiveSection("hero");
        }

        // ---------- Bind features dari product features ----------
        if (featsRes.status === "fulfilled" && featureBind && mounted) {
          const rows: any[] = Array.isArray(featsRes.value?.data)
            ? featsRes.value.data
            : [];

          const featureObjs = buildFeatureObjectsFromAPI(rows); // <- untuk section features
          const featureNames = toStringFeatures(featureObjs); // <- untuk plans (string[])

          // cache untuk Add Plan/handler lain
          featuresRef.current = featureNames;

          setSections((prev) =>
            prev.map((s) => {
              if (s.id === "features") {
                // SECTION FEATURES butuh objek {title, description, ...}
                return {
                  ...s,
                  content: { ...s.content, features: featureObjs },
                };
              }
              if (s.id === "pricing") {
                // PLANS butuh string[] (tiap baris 1 fitur)
                const plans = Array.isArray(s.content.plans)
                  ? s.content.plans.map((p: any) => {
                      const current = toStringFeatures(p.features);
                      const isPlaceholder =
                        current.length === 0 ||
                        (current.length === 3 &&
                          current[0] === "Feature 1" &&
                          current[1] === "Feature 2" &&
                          current[2] === "Feature 3");
                      return {
                        ...p,
                        features: isPlaceholder ? featureNames : current,
                      };
                    })
                  : [];
                return { ...s, content: { ...s.content, plans } };
              }
              return s;
            })
          );
        }

        // ---------- Map packages + pricelist → pricing plans (pakai durasi LOKAL) ----------
        if (pkgs.status === "fulfilled" && mounted) {
          const pkgList = pkgs.value;
          const dursArr =
            durs.status === "fulfilled" ? durs.value : durationsRef.current;

          const monthly = dursArr.find((d) => d.months === 1) || dursArr[0];
          const yearly =
            dursArr.find((d) => d.months === 12) ||
            dursArr.find((d) => d.months >= 12) ||
            dursArr[dursArr.length - 1];

          const currency = pricelistRef.current.currency;
          const tax_mode = pricelistRef.current.tax_mode;
          console.log("==== FETCH RESULT ====");
          console.log(
            "packages:",
            pkgs.status === "fulfilled" ? pkgs.value : "ERR"
          );
          console.log(
            "durations:",
            durs.status === "fulfilled" ? durs.value : "ERR"
          );
          console.log(
            "pricelist:",
            pr.status === "fulfilled" ? pr.value : "ERR"
          );
          setSections((prev) =>
            prev.map((s) => {
              if (s.id !== "pricing") return s;

              const plans = pkgList.map((p) => ({
                name: p.name,
                description: p.description || "",
                price: {
                  monthly: monthly ? priceOf(p.id, monthly.id) ?? 0 : 0,
                  yearly: yearly ? priceOf(p.id, yearly.id) ?? 0 : 0,
                },
                features:
                  featuresRef.current.length > 0
                    ? featuresRef.current
                    : toStringFeatures(s.content.features), //
                cta: "Start Free Trial",
                popular: false,
                package_id: p.id,
                package_code: p.package_code,
              }));

              return {
                ...s,
                content: {
                  ...s.content,
                  currency,
                  tax_mode,
                  plans,
                },
              };
            })
          );
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setSections(DEFAULT_SECTIONS);
          setActiveSection("hero");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedProduct, featureBind, priceOf]);

  /* ---------- UI handlers ---------- */
  const handleSectionToggle = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSectionUpdate = (sectionId: string, content: any) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
      )
    );
  };

  const handleSelectProduct = (productCodeOrId: string) => {
    setSelectedProduct(productCodeOrId);
  };

  const pickFile = async (accept: string, onPicked: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onPicked(file);
    };
    input.click();
  };

  const handleHeroBgUpload = async () => {
    await pickFile("image/*", async (file) => {
      const url = await uploadMedia(file);
      handleSectionUpdate("hero", { backgroundImage: url });
    });
  };

  const handleDemoThumbUpload = async (index: number) => {
    await pickFile("image/*", async (file) => {
      const url = await uploadMedia(file);
      // update thumbnail
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== "demo") return s;
          const videos = Array.isArray(s.content.videos)
            ? [...s.content.videos]
            : [];
          if (!videos[index])
            videos[index] = { title: "", duration: "", thumbnail: "" };
          videos[index] = { ...videos[index], thumbnail: url };
          return { ...s, content: { ...s.content, videos } };
        })
      );
    });
  };

  const handleDemoVideoUpload = async (index: number) => {
    await pickFile("video/*", async (file) => {
      const url = await uploadMedia(file);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== "demo") return s;
          const videos = Array.isArray(s.content.videos)
            ? [...s.content.videos]
            : [];
          if (!videos[index])
            videos[index] = { title: "", duration: "", url: "" };
          videos[index] = { ...videos[index], url };
          return { ...s, content: { ...s.content, videos } };
        })
      );
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      // pastikan URL media bukan blob: (upload jika perlu)
      const cleanSections = await materializeUploads(sections);

      // 1) Save Landing Page
      const payload = {
        status: "published" as const,
        meta: null as Record<string, any> | null,
        sections: cleanSections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            id: s._recordId,
            section_key: s.id,
            name: s.name,
            enabled: !!s.enabled,
            display_order: Number(s.order ?? 0),
            content: s.content ?? {},
          })),
      };
      await saveLandingByProduct(selectedProduct, payload);

      // 2) Save Pricelist when pricing section exists
      const pricing = cleanSections.find((s) => s.id === "pricing");
      if (pricing) {
        const currency = pricing.content?.currency || "IDR";
        const tax_mode =
          (pricing.content?.tax_mode as "inclusive" | "exclusive") ||
          "inclusive";
        const plans = Array.isArray(pricing.content?.plans)
          ? pricing.content.plans
          : [];

        // build items monthly/yearly
        const items: PricelistItemDTO[] = [];
        for (const p of plans) {
          const pkgId = String(p.package_id || "");
          if (!pkgId) continue;
          if (monthlyDuration) {
            items.push({
              package_id: pkgId,
              duration_id: monthlyDuration.id,
              price: Number(p?.price?.monthly ?? 0) || 0,
            });
          }
          if (yearlyDuration) {
            items.push({
              package_id: pkgId,
              duration_id: yearlyDuration.id,
              price: Number(p?.price?.yearly ?? 0) || 0,
            });
          }
        }

        // update header + items
        await updatePricelistHeader(selectedProduct, { currency, tax_mode });
        if (items.length) {
          await upsertPricelistItems(selectedProduct, {
            currency,
            tax_mode,
            items,
          });
        }
      }

      // 3) refresh sections from server biar id DB update
      const fresh = await getLandingByProduct(selectedProduct);
      const mapped: LandingPageSectionUI[] = (fresh.sections || [])
        .map((s: any) => ({
          id: s.section_key,
          name: s.name,
          enabled: !!s.enabled,
          order: Number(s.display_order ?? 0),
          content: s.content ?? {},
          _recordId: s.id,
        }))
        .sort((a: any, b: any) => a.order - b.order);
      setSections(mapped);

      alert("Saved successfully.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  /* ================== Preview modal ================== */
  const frameRef = useRef<HTMLDivElement>(null);
  const scale =
    previewMode === "desktop" ? 1 : previewMode === "tablet" ? 0.8 : 0.6;
  const previewWidth =
    previewMode === "desktop" ? 1024 : previewMode === "tablet" ? 820 : 390;

  const renderPreview = () => {
    const data = sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .filter((s) => s.enabled);

    return (
      <div
        style={{
          width: previewWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden"
      >
        {/* Hero */}
        {data.find((s) => s.id === "hero") && (
          <div
            className="p-10 text-center bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                data.find((s) => s.id === "hero")?.content?.backgroundImage ||
                ""
              })`,
              backgroundColor: "#f3f4f6",
            }}
          >
            <h1 className="text-4xl font-bold mb-3">
              {data.find((s) => s.id === "hero")?.content?.title}
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {data.find((s) => s.id === "hero")?.content?.subtitle}
            </p>
            <div className="mt-6">
              <span className="inline-block px-5 py-2 rounded-full bg-indigo-600 text-white">
                {data.find((s) => s.id === "hero")?.content?.ctaText}
              </span>
            </div>
          </div>
        )}

        {/* Features */}
        {(data.find((s) => s.id === "features")?.content?.features || [])
          .slice(0, 6)
          .map((f: any, i: number) => {
            const title = typeof f === "string" ? f : f?.title;
            const desc = typeof f === "string" ? "" : f?.description;
            return (
              <div key={i} className="border rounded-lg p-4">
                <div className="text-sm font-semibold">{title}</div>
                {!!desc && <div className="text-xs text-slate-600">{desc}</div>}
              </div>
            );
          })}

        {/* Pricing */}
        {data.find((s) => s.id === "pricing") && (
          <div className="p-8 bg-slate-50">
            <h2 className="text-2xl font-semibold mb-1">
              {data.find((s) => s.id === "pricing")?.content?.title}
            </h2>
            <p className="text-slate-600 mb-6">
              {data.find((s) => s.id === "pricing")?.content?.subtitle}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(data.find((s) => s.id === "pricing")?.content?.plans || []).map(
                (p: any, i: number) => (
                  <div key={i} className="border rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{p.name}</div>
                      {p.popular && (
                        <span className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {p.description}
                    </div>
                    <div className="mt-4">
                      <div className="text-xl font-bold">
                        {(p?.price?.monthly ?? 0).toLocaleString()}{" "}
                        {data.find((s) => s.id === "pricing")?.content
                          ?.currency || "IDR"}
                        <span className="text-xs text-slate-500"> /mo</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Yearly: {(p?.price?.yearly ?? 0).toLocaleString()}{" "}
                        {data.find((s) => s.id === "pricing")?.content
                          ?.currency || "IDR"}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ================== RENDER ================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Landing Page Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              {loading
                ? "Loading..."
                : "Configure landing pages for your products"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              disabled={!selectedProduct || loading}
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProduct || saving || loading}
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Select Product
            </CardTitle>
            <CardDescription className="flex items-center gap-3">
              Choose a product to configure its landing page
              <span className="inline-flex items-center gap-2 text-xs">
                <Switch
                  checked={featureBind}
                  onCheckedChange={setFeatureBind}
                />
                Bind features to Product Features
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((product) => {
                const key = product.product_code || product.id;
                const isSelected =
                  selectedProduct === product.product_code ||
                  selectedProduct === product.id;
                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected
                        ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() =>
                      handleSelectProduct(product.product_code || product.id)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            product.status?.toLowerCase() === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {product.status || "Active"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Sections */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Page Sections
                  </CardTitle>
                  <CardDescription>
                    Configure sections for {selectedProductData?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sections
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                          activeSection === section.id
                            ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={section.enabled}
                            onCheckedChange={() =>
                              handleSectionToggle(section.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">{section.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {section.order}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Editor (semua UI tetap, sekarang semua onChange aktif) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {
                          sections.find((s) => s.id === activeSection)?.name
                        }{" "}
                        Settings
                      </CardTitle>
                      <CardDescription>
                        Configure content and appearance
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={
                          previewMode === "desktop" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setPreviewMode("desktop")}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          previewMode === "tablet" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setPreviewMode("tablet")}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          previewMode === "mobile" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setPreviewMode("mobile")}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* HERO */}
                  {activeSection === "hero" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hero-title">Main Title</Label>
                          <Input
                            id="hero-title"
                            value={
                              sections.find((s) => s.id === "hero")?.content
                                .title || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("hero", {
                                title: e.target.value,
                              })
                            }
                            placeholder="Enter main title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hero-cta">CTA Button Text</Label>
                          <Input
                            id="hero-cta"
                            value={
                              sections.find((s) => s.id === "hero")?.content
                                .ctaText || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("hero", {
                                ctaText: e.target.value,
                              })
                            }
                            placeholder="Button text"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="hero-subtitle">Subtitle</Label>
                        <Textarea
                          id="hero-subtitle"
                          value={
                            sections.find((s) => s.id === "hero")?.content
                              .subtitle || ""
                          }
                          onChange={(e) =>
                            handleSectionUpdate("hero", {
                              subtitle: e.target.value,
                            })
                          }
                          placeholder="Enter subtitle description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero-video">Video URL (Optional)</Label>
                        <Input
                          id="hero-video"
                          value={
                            sections.find((s) => s.id === "hero")?.content
                              .videoUrl || ""
                          }
                          onChange={(e) =>
                            handleSectionUpdate("hero", {
                              videoUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                          Background Image
                        </p>
                        <Button
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={handleHeroBgUpload}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </Button>
                        {!!sections.find((s) => s.id === "hero")?.content
                          ?.backgroundImage && (
                          <div className="mt-4">
                            <img
                              src={
                                sections.find((s) => s.id === "hero")?.content
                                  .backgroundImage
                              }
                              alt="Hero Preview"
                              className="mx-auto max-h-40 rounded-md object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FEATURES */}
                  {activeSection === "features" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="features-title">Section Title</Label>
                          <Input
                            id="features-title"
                            value={
                              sections.find((s) => s.id === "features")?.content
                                .title || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("features", {
                                title: e.target.value,
                              })
                            }
                            placeholder="Features section title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="features-subtitle">Subtitle</Label>
                          <Input
                            id="features-subtitle"
                            value={
                              sections.find((s) => s.id === "features")?.content
                                .subtitle || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("features", {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="Features subtitle"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Features</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id !== "features"
                                    ? s
                                    : {
                                        ...s,
                                        content: {
                                          ...s.content,
                                          features: [
                                            ...(Array.isArray(
                                              s.content.features
                                            )
                                              ? s.content.features
                                              : []),
                                            {
                                              icon: "zap",
                                              title: "New Feature",
                                              description: "",
                                            },
                                          ],
                                        },
                                      }
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Feature
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {sections
                            .find((s) => s.id === "features")
                            ?.content.features?.map(
                              (feature: any, index: number) => (
                                <Card key={index}>
                                  <CardContent className="p-4" data-edit-scope>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <Input
                                            value={feature.title}
                                            onChange={(e) => {
                                              setSections((prev) =>
                                                prev.map((s) => {
                                                  if (s.id !== "features")
                                                    return s;
                                                  const arr = Array.isArray(
                                                    s.content.features
                                                  )
                                                    ? [...s.content.features]
                                                    : [];
                                                  arr[index] = {
                                                    ...arr[index],
                                                    title: e.target.value,
                                                  };
                                                  return {
                                                    ...s,
                                                    content: {
                                                      ...s.content,
                                                      features: arr,
                                                    },
                                                  };
                                                })
                                              );
                                            }}
                                            placeholder="Feature title"
                                            className="font-medium"
                                          />
                                          <Select
                                            value={feature.icon}
                                            onValueChange={(val) =>
                                              setSections((prev) =>
                                                prev.map((s) => {
                                                  if (s.id !== "features")
                                                    return s;
                                                  const arr = Array.isArray(
                                                    s.content.features
                                                  )
                                                    ? [...s.content.features]
                                                    : [];
                                                  arr[index] = {
                                                    ...arr[index],
                                                    icon: val,
                                                  };
                                                  return {
                                                    ...s,
                                                    content: {
                                                      ...s.content,
                                                      features: arr,
                                                    },
                                                  };
                                                })
                                              )
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Icon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="target">
                                                Target
                                              </SelectItem>
                                              <SelectItem value="shield">
                                                Shield
                                              </SelectItem>
                                              <SelectItem value="zap">
                                                Zap
                                              </SelectItem>
                                              <SelectItem value="calendar">
                                                Calendar
                                              </SelectItem>
                                              <SelectItem value="credit-card">
                                                Credit Card
                                              </SelectItem>
                                              <SelectItem value="bar-chart">
                                                Bar Chart
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Textarea
                                          value={feature.description}
                                          onChange={(e) =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "features")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.features
                                                )
                                                  ? [...s.content.features]
                                                  : [];
                                                arr[index] = {
                                                  ...arr[index],
                                                  description: e.target.value,
                                                };
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    features: arr,
                                                  },
                                                };
                                              })
                                            )
                                          }
                                          placeholder="Feature description"
                                          rows={2}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) =>
                                            focusInside(
                                              (
                                                e.currentTarget as HTMLElement
                                              ).closest(
                                                "[data-edit-scope]"
                                              ) as HTMLElement
                                            )
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "features")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.features
                                                )
                                                  ? [...s.content.features]
                                                  : [];
                                                arr.splice(index, 1);
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    features: arr,
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
                                  </CardContent>
                                </Card>
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRICING */}
                  {activeSection === "pricing" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pricing-title">Section Title</Label>
                          <Input
                            id="pricing-title"
                            value={
                              sections.find((s) => s.id === "pricing")?.content
                                .title || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("pricing", {
                                title: e.target.value,
                              })
                            }
                            placeholder="Pricing section title"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={
                              sections.find((s) => s.id === "pricing")?.content
                                .billingToggle || false
                            }
                            onCheckedChange={(checked) =>
                              handleSectionUpdate("pricing", {
                                billingToggle: checked,
                              })
                            }
                          />
                          <Label>Show Monthly/Yearly Toggle</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pricing-subtitle">Subtitle</Label>
                          <Textarea
                            id="pricing-subtitle"
                            value={
                              sections.find((s) => s.id === "pricing")?.content
                                .subtitle || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("pricing", {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="Pricing subtitle"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Currency</Label>
                            <Input
                              value={
                                sections.find((s) => s.id === "pricing")
                                  ?.content?.currency || "IDR"
                              }
                              onChange={(e) =>
                                handleSectionUpdate("pricing", {
                                  currency: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="IDR"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Tax Mode</Label>
                            <Select
                              value={
                                sections.find((s) => s.id === "pricing")
                                  ?.content?.tax_mode || "inclusive"
                              }
                              onValueChange={(val: "inclusive" | "exclusive") =>
                                handleSectionUpdate("pricing", {
                                  tax_mode: val,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inclusive">
                                  inclusive
                                </SelectItem>
                                <SelectItem value="exclusive">
                                  exclusive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>
                            Pricing Plans (linked to product packages)
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() => {
                              const pkg = packages[0];
                              if (!pkg) return;

                              const defaultFeatures =
                                featuresRef.current.length > 0
                                  ? featuresRef.current
                                  : toStringFeatures(
                                      sections.find((s) => s.id === "features")
                                        ?.content?.features
                                    );

                              setSections((prev) =>
                                prev.map((s) => {
                                  if (s.id !== "pricing") return s;
                                  const arr = Array.isArray(s.content.plans)
                                    ? [...s.content.plans]
                                    : [];
                                  arr.push({
                                    name: pkg.name,
                                    description: pkg.description || "",
                                    price: { monthly: 0, yearly: 0 },
                                    features: defaultFeatures, // ← penting
                                    cta: "Start Free Trial",
                                    popular: false,
                                    package_id: pkg.id,
                                    package_code: pkg.package_code,
                                  });
                                  return {
                                    ...s,
                                    content: { ...s.content, plans: arr },
                                  };
                                })
                              );
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Add Plan
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {sections
                            .find((s) => s.id === "pricing")
                            ?.content.plans?.map((plan: any, index: number) => (
                              <Card
                                key={index}
                                className={
                                  plan.popular ? "ring-2 ring-purple-500" : ""
                                }
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <Select
                                      value={String(plan.package_id || "")}
                                      onValueChange={(pkgId) => {
                                        const pkg = packages.find(
                                          (p) => String(p.id) === String(pkgId)
                                        );
                                        const defaultFeatures =
                                          featuresRef.current.length > 0
                                            ? featuresRef.current
                                            : toStringFeatures(
                                                sections.find(
                                                  (s) => s.id === "features"
                                                )?.content?.features
                                              );

                                        setSections((prev) =>
                                          prev.map((s) => {
                                            if (s.id !== "pricing") return s;
                                            const arr = Array.isArray(
                                              s.content.plans
                                            )
                                              ? [...s.content.plans]
                                              : [];
                                            const cur = arr[index] ?? {};
                                            const current = toStringFeatures(
                                              cur.features
                                            );
                                            const isPlaceholder =
                                              current.length === 0 ||
                                              (current.length === 3 &&
                                                current[0] === "Feature 1" &&
                                                current[1] === "Feature 2" &&
                                                current[2] === "Feature 3");

                                            arr[index] = {
                                              ...cur,
                                              package_id: pkgId,
                                              name: pkg?.name || cur?.name,
                                              package_code: pkg?.package_code,
                                              description:
                                                pkg?.description ??
                                                cur?.description,
                                              features: isPlaceholder
                                                ? defaultFeatures
                                                : current,
                                            };

                                            return {
                                              ...s,
                                              content: {
                                                ...s.content,
                                                plans: arr,
                                              },
                                            };
                                          })
                                        );

                                        // harga otomatis dari pricelist
                                        syncPlanPriceFromPricelist(
                                          index,
                                          String(pkgId)
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select package" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {packages.map((p) => (
                                          <SelectItem
                                            key={p.id}
                                            value={String(p.id)}
                                          >
                                            {p.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Switch
                                      checked={!!plan.popular}
                                      onCheckedChange={(checked) =>
                                        setSections((prev) =>
                                          prev.map((s) => {
                                            if (s.id !== "pricing") return s;
                                            const arr = Array.isArray(
                                              s.content.plans
                                            )
                                              ? [...s.content.plans]
                                              : [];
                                            arr[index] = {
                                              ...arr[index],
                                              popular: checked,
                                            };
                                            return {
                                              ...s,
                                              content: {
                                                ...s.content,
                                                plans: arr,
                                              },
                                            };
                                          })
                                        )
                                      }
                                    />
                                  </div>
                                  <Textarea
                                    value={plan.description}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((s) => {
                                          if (s.id !== "pricing") return s;
                                          const arr = [...s.content.plans];
                                          arr[index] = {
                                            ...arr[index],
                                            description: e.target.value,
                                          };
                                          return {
                                            ...s,
                                            content: {
                                              ...s.content,
                                              plans: arr,
                                            },
                                          };
                                        })
                                      )
                                    }
                                    placeholder="Plan description"
                                    rows={2}
                                    className="text-sm"
                                  />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">
                                        Monthly Price
                                      </Label>
                                      <Input
                                        type="number"
                                        value={plan?.price?.monthly ?? ""}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "pricing") return s;
                                              const arr = [...s.content.plans];
                                              arr[index] = {
                                                ...arr[index],
                                                price: {
                                                  ...arr[index].price,
                                                  monthly: val,
                                                },
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  plans: arr,
                                                },
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="29"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Yearly Price
                                      </Label>
                                      <Input
                                        type="number"
                                        value={plan?.price?.yearly ?? ""}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "pricing") return s;
                                              const arr = [...s.content.plans];
                                              arr[index] = {
                                                ...arr[index],
                                                price: {
                                                  ...arr[index].price,
                                                  yearly: val,
                                                },
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  plans: arr,
                                                },
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="290"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      CTA Button
                                    </Label>
                                    <Input
                                      value={plan.cta}
                                      onChange={(e) =>
                                        setSections((prev) =>
                                          prev.map((s) => {
                                            if (s.id !== "pricing") return s;
                                            const arr = [...s.content.plans];
                                            arr[index] = {
                                              ...arr[index],
                                              cta: e.target.value,
                                            };
                                            return {
                                              ...s,
                                              content: {
                                                ...s.content,
                                                plans: arr,
                                              },
                                            };
                                          })
                                        )
                                      }
                                      placeholder="Start Free Trial"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      Features (one per line)
                                    </Label>
                                    <Textarea
                                      value={toStringFeatures(
                                        plan.features
                                      ).join("\n")}
                                      onChange={(e) => {
                                        const list = e.target.value
                                          .split("\n")
                                          .map((s) => s.trim())
                                          .filter(Boolean);
                                        setSections((prev) =>
                                          prev.map((s) => {
                                            if (s.id !== "pricing") return s;
                                            const arr = [...s.content.plans];
                                            arr[index] = {
                                              ...arr[index],
                                              features: list,
                                            };
                                            return {
                                              ...s,
                                              content: {
                                                ...s.content,
                                                plans: arr,
                                              },
                                            };
                                          })
                                        );
                                      }}
                                      placeholder={
                                        "Feature 1\nFeature 2\nFeature 3"
                                      }
                                      rows={4}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DEMO */}
                  {activeSection === "demo" && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="demo-title">Section Title</Label>
                        <Input
                          id="demo-title"
                          value={
                            sections.find((s) => s.id === "demo")?.content
                              .title || ""
                          }
                          onChange={(e) =>
                            handleSectionUpdate("demo", {
                              title: e.target.value,
                            })
                          }
                          placeholder="Demo section title"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Demo Videos</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id !== "demo"
                                    ? s
                                    : {
                                        ...s,
                                        content: {
                                          ...s.content,
                                          videos: [
                                            ...(Array.isArray(s.content.videos)
                                              ? s.content.videos
                                              : []),
                                            {
                                              title: "New Video",
                                              duration: "",
                                              thumbnail: "",
                                              url: "",
                                            },
                                          ],
                                        },
                                      }
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Video
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sections
                            .find((s) => s.id === "demo")
                            ?.content.videos?.map(
                              (video: any, index: number) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xs text-gray-600 mb-2">
                                          Video Thumbnail
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleDemoThumbUpload(index)
                                          }
                                        >
                                          <Upload className="h-3 w-3 mr-1" />
                                          Upload
                                        </Button>
                                      </div>
                                      <Input
                                        value={video.title}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "demo") return s;
                                              const arr = Array.isArray(
                                                s.content.videos
                                              )
                                                ? [...s.content.videos]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                title: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  videos: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Video title"
                                        className="font-medium"
                                      />
                                      <Input
                                        value={video.duration}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "demo") return s;
                                              const arr = Array.isArray(
                                                s.content.videos
                                              )
                                                ? [...s.content.videos]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                duration: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  videos: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Duration (e.g., 2:30)"
                                      />
                                      <Input
                                        value={video.url || ""}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "demo") return s;
                                              const arr = Array.isArray(
                                                s.content.videos
                                              )
                                                ? [...s.content.videos]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                url: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  videos: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Video URL"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 bg-transparent"
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "demo") return s;
                                                const arr = Array.isArray(
                                                  s.content.videos
                                                )
                                                  ? [...s.content.videos]
                                                  : [];
                                                arr.splice(index, 1);
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    videos: arr,
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
                                  </CardContent>
                                </Card>
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BENEFITS */}
                  {activeSection === "benefits" && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Benefits</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id !== "benefits"
                                    ? s
                                    : {
                                        ...s,
                                        content: {
                                          ...s.content,
                                          benefits: [
                                            ...(Array.isArray(
                                              s.content.benefits
                                            )
                                              ? s.content.benefits
                                              : []),
                                            {
                                              icon: "zap",
                                              title: "New Benefit",
                                              description: "",
                                            },
                                          ],
                                        },
                                      }
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Benefit
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sections
                            .find((s) => s.id === "benefits")
                            ?.content.benefits?.map(
                              (benefit: any, index: number) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <Input
                                          value={benefit.title}
                                          onChange={(e) =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "benefits")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.benefits
                                                )
                                                  ? [...s.content.benefits]
                                                  : [];
                                                arr[index] = {
                                                  ...arr[index],
                                                  title: e.target.value,
                                                };
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    benefits: arr,
                                                  },
                                                };
                                              })
                                            )
                                          }
                                          placeholder="Benefit title"
                                          className="font-medium"
                                        />
                                        <Select
                                          value={benefit.icon}
                                          onValueChange={(val) =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "benefits")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.benefits
                                                )
                                                  ? [...s.content.benefits]
                                                  : [];
                                                arr[index] = {
                                                  ...arr[index],
                                                  icon: val,
                                                };
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    benefits: arr,
                                                  },
                                                };
                                              })
                                            )
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Icon" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="zap">
                                              Zap
                                            </SelectItem>
                                            <SelectItem value="target">
                                              Target
                                            </SelectItem>
                                            <SelectItem value="users">
                                              Users
                                            </SelectItem>
                                            <SelectItem value="heart">
                                              Heart
                                            </SelectItem>
                                            <SelectItem value="shield">
                                              Shield
                                            </SelectItem>
                                            <SelectItem value="clock">
                                              Clock
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Textarea
                                        value={benefit.description}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "benefits") return s;
                                              const arr = Array.isArray(
                                                s.content.benefits
                                              )
                                                ? [...s.content.benefits]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                description: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  benefits: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Benefit description"
                                        rows={2}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 bg-transparent"
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "benefits")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.benefits
                                                )
                                                  ? [...s.content.benefits]
                                                  : [];
                                                arr.splice(index, 1);
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    benefits: arr,
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
                                  </CardContent>
                                </Card>
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {activeSection === "cta" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cta-title">Main Title</Label>
                          <Input
                            id="cta-title"
                            value={
                              sections.find((s) => s.id === "cta")?.content
                                .title || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("cta", {
                                title: e.target.value,
                              })
                            }
                            placeholder="CTA section title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cta-primary">
                            Primary Button Text
                          </Label>
                          <Input
                            id="cta-primary"
                            value={
                              sections.find((s) => s.id === "cta")?.content
                                .primaryCta || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("cta", {
                                primaryCta: e.target.value,
                              })
                            }
                            placeholder="Primary CTA text"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cta-subtitle">Subtitle</Label>
                          <Textarea
                            id="cta-subtitle"
                            value={
                              sections.find((s) => s.id === "cta")?.content
                                .subtitle || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("cta", {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="CTA subtitle"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cta-secondary">
                            Secondary Button Text
                          </Label>
                          <Input
                            id="cta-secondary"
                            value={
                              sections.find((s) => s.id === "cta")?.content
                                .secondaryCta || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("cta", {
                                secondaryCta: e.target.value,
                              })
                            }
                            placeholder="Secondary CTA text"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Trust Features</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {sections
                            .find((s) => s.id === "cta")
                            ?.content.features?.map(
                              (feature: string, index: number) => (
                                <Input
                                  key={index}
                                  value={feature}
                                  onChange={(e) =>
                                    setSections((prev) =>
                                      prev.map((s) => {
                                        if (s.id !== "cta") return s;
                                        const arr = Array.isArray(
                                          s.content.features
                                        )
                                          ? [...s.content.features]
                                          : [];
                                        arr[index] = e.target.value;
                                        return {
                                          ...s,
                                          content: {
                                            ...s.content,
                                            features: arr,
                                          },
                                        };
                                      })
                                    )
                                  }
                                  placeholder="Feature text"
                                />
                              )
                            )}
                        </div>
                      </div>
                      <div>
                        <Label>Statistics</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {sections
                            .find((s) => s.id === "cta")
                            ?.content.stats?.map((stat: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="p-3">
                                  <Input
                                    value={stat.value}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((s) => {
                                          if (s.id !== "cta") return s;
                                          const arr = Array.isArray(
                                            s.content.stats
                                          )
                                            ? [...s.content.stats]
                                            : [];
                                          arr[index] = {
                                            ...arr[index],
                                            value: e.target.value,
                                          };
                                          return {
                                            ...s,
                                            content: {
                                              ...s.content,
                                              stats: arr,
                                            },
                                          };
                                        })
                                      )
                                    }
                                    placeholder="99.9%"
                                    className="font-bold text-center mb-2"
                                  />
                                  <Input
                                    value={stat.label}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((s) => {
                                          if (s.id !== "cta") return s;
                                          const arr = Array.isArray(
                                            s.content.stats
                                          )
                                            ? [...s.content.stats]
                                            : [];
                                          arr[index] = {
                                            ...arr[index],
                                            label: e.target.value,
                                          };
                                          return {
                                            ...s,
                                            content: {
                                              ...s.content,
                                              stats: arr,
                                            },
                                          };
                                        })
                                      )
                                    }
                                    placeholder="Uptime"
                                    className="text-center text-sm"
                                  />
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TESTIMONIALS */}
                  {activeSection === "testimonials" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="testimonials-title">
                            Section Title
                          </Label>
                          <Input
                            id="testimonials-title"
                            value={
                              sections.find((s) => s.id === "testimonials")
                                ?.content.title || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("testimonials", {
                                title: e.target.value,
                              })
                            }
                            placeholder="Testimonials section title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="testimonials-subtitle">
                            Subtitle
                          </Label>
                          <Input
                            id="testimonials-subtitle"
                            value={
                              sections.find((s) => s.id === "testimonials")
                                ?.content.subtitle || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("testimonials", {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="Testimonials subtitle"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Statistics</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {sections
                            .find((s) => s.id === "testimonials")
                            ?.content.stats?.map((stat: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="p-3">
                                  <Input
                                    value={stat.value}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((s) => {
                                          if (s.id !== "testimonials") return s;
                                          const arr = Array.isArray(
                                            s.content.stats
                                          )
                                            ? [...s.content.stats]
                                            : [];
                                          arr[index] = {
                                            ...arr[index],
                                            value: e.target.value,
                                          };
                                          return {
                                            ...s,
                                            content: {
                                              ...s.content,
                                              stats: arr,
                                            },
                                          };
                                        })
                                      )
                                    }
                                    placeholder="10,000+"
                                    className="font-bold text-center mb-2"
                                  />
                                  <Input
                                    value={stat.label}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((s) => {
                                          if (s.id !== "testimonials") return s;
                                          const arr = Array.isArray(
                                            s.content.stats
                                          )
                                            ? [...s.content.stats]
                                            : [];
                                          arr[index] = {
                                            ...arr[index],
                                            label: e.target.value,
                                          };
                                          return {
                                            ...s,
                                            content: {
                                              ...s.content,
                                              stats: arr,
                                            },
                                          };
                                        })
                                      )
                                    }
                                    placeholder="Properties Managed"
                                    className="text-center text-sm"
                                  />
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Customer Testimonials</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id !== "testimonials"
                                    ? s
                                    : {
                                        ...s,
                                        content: {
                                          ...s.content,
                                          testimonials: [
                                            ...(Array.isArray(
                                              s.content.testimonials
                                            )
                                              ? s.content.testimonials
                                              : []),
                                            {
                                              quote: "",
                                              author: "",
                                              company: "",
                                            },
                                          ],
                                        },
                                      }
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Testimonial
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {sections
                            .find((s) => s.id === "testimonials")
                            ?.content.testimonials?.map(
                              (testimonial: any, index: number) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <Textarea
                                        value={testimonial.quote}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "testimonials")
                                                return s;
                                              const arr = Array.isArray(
                                                s.content.testimonials
                                              )
                                                ? [...s.content.testimonials]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                quote: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  testimonials: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Customer testimonial quote"
                                        rows={3}
                                      />
                                      <div className="grid grid-cols-2 gap-3">
                                        <Input
                                          value={testimonial.author}
                                          onChange={(e) =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "testimonials")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.testimonials
                                                )
                                                  ? [...s.content.testimonials]
                                                  : [];
                                                arr[index] = {
                                                  ...arr[index],
                                                  author: e.target.value,
                                                };
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    testimonials: arr,
                                                  },
                                                };
                                              })
                                            )
                                          }
                                          placeholder="Author name"
                                        />
                                        <Input
                                          value={testimonial.company}
                                          onChange={(e) =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "testimonials")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.testimonials
                                                )
                                                  ? [...s.content.testimonials]
                                                  : [];
                                                arr[index] = {
                                                  ...arr[index],
                                                  company: e.target.value,
                                                };
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    testimonials: arr,
                                                  },
                                                };
                                              })
                                            )
                                          }
                                          placeholder="Company/Position"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 bg-transparent"
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "testimonials")
                                                  return s;
                                                const arr = Array.isArray(
                                                  s.content.testimonials
                                                )
                                                  ? [...s.content.testimonials]
                                                  : [];
                                                arr.splice(index, 1);
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    testimonials: arr,
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
                                  </CardContent>
                                </Card>
                              )
                            )}
                        </div>
                      </div>
                      <div>
                        <Label>Partner Companies</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                          {sections
                            .find((s) => s.id === "testimonials")
                            ?.content.companies?.map(
                              (company: string, index: number) => (
                                <Input
                                  key={index}
                                  value={company}
                                  onChange={(e) =>
                                    setSections((prev) =>
                                      prev.map((s) => {
                                        if (s.id !== "testimonials") return s;
                                        const arr = Array.isArray(
                                          s.content.companies
                                        )
                                          ? [...s.content.companies]
                                          : [];
                                        arr[index] = e.target.value;
                                        return {
                                          ...s,
                                          content: {
                                            ...s.content,
                                            companies: arr,
                                          },
                                        };
                                      })
                                    )
                                  }
                                  placeholder="Company name"
                                />
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  {activeSection === "footer" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="footer-company">Company Name</Label>
                          <Input
                            id="footer-company"
                            value={
                              sections.find((s) => s.id === "footer")?.content
                                .companyName || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("footer", {
                                companyName: e.target.value,
                              })
                            }
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="footer-copyright">
                            Copyright Text
                          </Label>
                          <Input
                            id="footer-copyright"
                            value={
                              sections.find((s) => s.id === "footer")?.content
                                .copyright || ""
                            }
                            onChange={(e) =>
                              handleSectionUpdate("footer", {
                                copyright: e.target.value,
                              })
                            }
                            placeholder="© 2024 Company. All rights reserved."
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="footer-description">
                          Company Description
                        </Label>
                        <Textarea
                          id="footer-description"
                          value={
                            sections.find((s) => s.id === "footer")?.content
                              .description || ""
                          }
                          onChange={(e) =>
                            handleSectionUpdate("footer", {
                              description: e.target.value,
                            })
                          }
                          placeholder="Company description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Footer Sections</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent"
                            onClick={() =>
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id !== "footer"
                                    ? s
                                    : {
                                        ...s,
                                        content: {
                                          ...s.content,
                                          sections: [
                                            ...(Array.isArray(
                                              s.content.sections
                                            )
                                              ? s.content.sections
                                              : []),
                                            { title: "NEW", links: ["Item 1"] },
                                          ],
                                        },
                                      }
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Add Section
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sections
                            .find((s) => s.id === "footer")
                            ?.content.sections?.map(
                              (section: any, index: number) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <Input
                                        value={section.title}
                                        onChange={(e) =>
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "footer") return s;
                                              const arr = Array.isArray(
                                                s.content.sections
                                              )
                                                ? [...s.content.sections]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                title: e.target.value,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  sections: arr,
                                                },
                                              };
                                            })
                                          )
                                        }
                                        placeholder="Section title (e.g., PRODUCT)"
                                        className="font-semibold"
                                      />
                                      <Textarea
                                        value={
                                          Array.isArray(section.links)
                                            ? section.links.join("\n")
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const links = e.target.value
                                            .split("\n")
                                            .filter(Boolean);
                                          setSections((prev) =>
                                            prev.map((s) => {
                                              if (s.id !== "footer") return s;
                                              const arr = Array.isArray(
                                                s.content.sections
                                              )
                                                ? [...s.content.sections]
                                                : [];
                                              arr[index] = {
                                                ...arr[index],
                                                links,
                                              };
                                              return {
                                                ...s,
                                                content: {
                                                  ...s.content,
                                                  sections: arr,
                                                },
                                              };
                                            })
                                          );
                                        }}
                                        placeholder={"Link 1\nLink 2\nLink 3"}
                                        rows={4}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 bg-transparent"
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setSections((prev) =>
                                              prev.map((s) => {
                                                if (s.id !== "footer") return s;
                                                const arr = Array.isArray(
                                                  s.content.sections
                                                )
                                                  ? [...s.content.sections]
                                                  : [];
                                                arr.splice(index, 1);
                                                return {
                                                  ...s,
                                                  content: {
                                                    ...s.content,
                                                    sections: arr,
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
                                  </CardContent>
                                </Card>
                              )
                            )}
                        </div>
                      </div>
                      <div>
                        <Label>Social Media Links</Label>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label>Facebook</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label>Twitter</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label>LinkedIn</Label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Trust Badges</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {sections
                            .find((s) => s.id === "footer")
                            ?.content.badges?.map(
                              (badge: string, index: number) => (
                                <Input
                                  key={index}
                                  value={badge}
                                  onChange={(e) =>
                                    setSections((prev) =>
                                      prev.map((s) => {
                                        if (s.id !== "footer") return s;
                                        const arr = Array.isArray(
                                          s.content.badges
                                        )
                                          ? [...s.content.badges]
                                          : [];
                                        arr[index] = e.target.value;
                                        return {
                                          ...s,
                                          content: {
                                            ...s.content,
                                            badges: arr,
                                          },
                                        };
                                      })
                                    )
                                  }
                                  placeholder="Badge text"
                                />
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GENERIC PLACEHOLDER */}
                  {activeSection !== "hero" &&
                    activeSection !== "features" &&
                    activeSection !== "pricing" &&
                    activeSection !== "demo" &&
                    activeSection !== "benefits" &&
                    activeSection !== "cta" &&
                    activeSection !== "testimonials" &&
                    activeSection !== "footer" && (
                      <div className="text-center py-12">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Section Editor
                        </h3>
                        <p className="text-gray-600">
                          Configure settings for the{" "}
                          {sections.find((s) => s.id === activeSection)?.name}{" "}
                          section
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW MODAL (tidak mengubah style utama) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-lg shadow-2xl max-h=[90vh] overflow-hidden ${
              previewMode === "desktop"
                ? "w-full max-w-6xl"
                : previewMode === "tablet"
                ? "w-full max-w-3xl"
                : "w-full max-w-sm"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Landing Page Preview</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant={previewMode === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === "tablet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("tablet")}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-white">
                {/* HERO */}
                {sections.find((s) => s.id === "hero")?.enabled && (
                  <div
                    className="text-white py-20 px-6"
                    style={{
                      background: sections.find((s) => s.id === "hero")?.content
                        .backgroundImage
                        ? `url("${
                            sections.find((s) => s.id === "hero")?.content
                              .backgroundImage
                          }") center/cover no-repeat`
                        : undefined,
                      backgroundColor: "#4f46e5",
                    }}
                  >
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        {sections.find((s) => s.id === "hero")?.content.title ||
                          "Default Title"}
                      </h1>
                      <p className="text-xl md:text-2xl mb-8 text-purple-100">
                        {sections.find((s) => s.id === "hero")?.content
                          .subtitle || "Default subtitle"}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          size="lg"
                          className="bg-white text-purple-600 hover:bg-gray-100"
                        >
                          {sections.find((s) => s.id === "hero")?.content
                            .ctaText || "Get Started"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-purple-600 bg-transparent"
                        >
                          {sections.find((s) => s.id === "hero")?.content
                            .secondaryCta || "Learn More"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURES */}
                {sections.find((s) => s.id === "features")?.enabled && (
                  <div className="py-20 px-6 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                          {sections.find((s) => s.id === "features")?.content
                            .title || "Powerful Features"}
                        </h2>
                        <p className="text-xl text-gray-600">
                          {sections.find((s) => s.id === "features")?.content
                            .subtitle || "Everything you need"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sections
                          .find((s) => s.id === "features")
                          ?.content.features?.map(
                            (feature: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-sm"
                              >
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                                </div>
                                {/* pake feature.title (bukan feature.name) */}
                                <h3 className="text-xl font-semibold mb-2">
                                  {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                  {feature.description}
                                </p>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* DEMO */}
                {sections.find((s) => s.id === "demo")?.enabled && (
                  <div className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                          {sections.find((s) => s.id === "demo")?.content
                            .title || "See Product in Action"}
                        </h2>
                        <p className="text-xl text-gray-600">
                          {sections.find((s) => s.id === "demo")?.content
                            .subtitle || "Watch how our product works"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sections
                          .find((s) => s.id === "demo")
                          ?.content.videos?.map((video: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg shadow-sm overflow-hidden"
                            >
                              <div className="aspect-video bg-gray-900 relative">
                                {video.thumbnail ? (
                                  <img
                                    src={video.thumbnail}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                                    No thumbnail
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-90">
                                    <div className="w-0 h-0 border-l-4 border-l-gray-900 border-y-2 border-y-transparent ml-1"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold truncate">
                                  {video.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {video.duration}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* BENEFITS */}
                {sections.find((s) => s.id === "benefits")?.enabled && (
                  <div className="py-20 px-6 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {sections
                          .find((s) => s.id === "benefits")
                          ?.content.benefits?.map(
                            (benefit: any, index: number) => (
                              <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <div className="w-8 h-8 bg-purple-600 rounded"></div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                  {benefit.title}
                                </h3>
                                <p className="text-gray-600">
                                  {benefit.description}
                                </p>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                {sections.find((s) => s.id === "cta")?.enabled && (
                  <div className="py-20 px-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                      <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {sections.find((s) => s.id === "cta")?.content.title ||
                          "Ready to Transform?"}
                      </h2>
                      <p className="text-xl mb-8 text-purple-100">
                        {sections.find((s) => s.id === "cta")?.content
                          .subtitle || "Join thousands of users"}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Button
                          size="lg"
                          className="bg-white text-purple-600 hover:bg-gray-100"
                        >
                          {sections.find((s) => s.id === "cta")?.content
                            .primaryCta || "Start Free Trial"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-purple-600 bg-transparent"
                        >
                          {sections.find((s) => s.id === "cta")?.content
                            .secondaryCta || "View Pricing"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {sections
                          .find((s) => s.id === "cta")
                          ?.content.stats?.map((stat: any, index: number) => (
                            <div key={index} className="text-center">
                              <div className="text-3xl font-bold">
                                {stat.value}
                              </div>
                              <div className="text-purple-200">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                      </div>
                      {!!sections.find((s) => s.id === "cta")?.content.features
                        ?.length && (
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-purple-100">
                          {sections
                            .find((s) => s.id === "cta")
                            ?.content.features.map((f: string, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full border border-white/40 text-sm backdrop-blur-sm"
                              >
                                {f}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PRICING */}
                {sections.find((s) => s.id === "pricing")?.enabled && (
                  <div className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                          {sections.find((s) => s.id === "pricing")?.content
                            .title || "Choose Your Plan"}
                        </h2>
                        <p className="text-xl text-gray-600">
                          {sections.find((s) => s.id === "pricing")?.content
                            .subtitle || "Start your free trial today"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {sections
                          .find((s) => s.id === "pricing")
                          ?.content.plans?.map((plan: any, index: number) => (
                            <div
                              key={index}
                              className={`bg-white rounded-lg shadow-lg p-8 ${
                                plan.popular ? "ring-2 ring-purple-600" : ""
                              }`}
                            >
                              {plan.popular && (
                                <div className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                                  Most Popular
                                </div>
                              )}
                              <h3 className="text-2xl font-bold mb-2">
                                {plan.name}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {plan.description}
                              </p>
                              <div className="text-4xl font-bold mb-6">
                                ${plan.price?.monthly ?? plan.price}
                                <span className="text-lg text-gray-600">
                                  /month
                                </span>
                              </div>
                              <Button
                                className={`w-full mb-6 ${
                                  plan.popular
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : ""
                                }`}
                              >
                                {plan.cta}
                              </Button>
                              <ul className="space-y-3">
                                {(plan.features || []).map(
                                  (feature: string, fIndex: number) => (
                                    <li
                                      key={fIndex}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                      {feature}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TESTIMONIALS */}
                {sections.find((s) => s.id === "testimonials")?.enabled && (
                  <div className="py-20 px-6 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                          {sections.find((s) => s.id === "testimonials")
                            ?.content.title || "Trusted Worldwide"}
                        </h2>
                        <p className="text-xl text-gray-600">
                          {sections.find((s) => s.id === "testimonials")
                            ?.content.subtitle ||
                            "Join thousands of satisfied customers"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {sections
                          .find((s) => s.id === "testimonials")
                          ?.content.testimonials?.map(
                            (testimonial: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-sm"
                              >
                                <div className="flex mb-4">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-4 h-4 bg-yellow-400 rounded-sm mr-1"
                                    ></div>
                                  ))}
                                </div>
                                <p className="text-gray-700 mb-4">
                                  "{testimonial.quote}"
                                </p>
                                <div>
                                  <div className="font-semibold">
                                    {testimonial.author}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {testimonial.company}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                      </div>
                      {/* pakai companies (bukan partners) */}
                      <div className="flex justify-center items-center gap-8 opacity-60">
                        {(
                          sections.find((s) => s.id === "testimonials")?.content
                            .companies || []
                        ).map((company: string, index: number) => (
                          <div
                            key={index}
                            className="text-gray-400 font-semibold"
                          >
                            {company}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                {sections.find((s) => s.id === "footer")?.enabled && (
                  <div className="bg-gray-900 text-white py-16 px-6">
                    <div className="max-w-6xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                          <h3 className="text-xl font-bold mb-4">
                            {sections.find((s) => s.id === "footer")?.content
                              .companyName || "Company"}
                          </h3>
                          <p className="text-gray-400 mb-4">
                            {sections.find((s) => s.id === "footer")?.content
                              .description || "Company description"}
                          </p>
                          <div className="flex gap-4">
                            {(
                              sections.find((s) => s.id === "footer")?.content
                                .socialLinks || []
                            ).map((_: string, index: number) => (
                              <div
                                key={index}
                                className="w-8 h-8 bg-gray-700 rounded"
                              ></div>
                            ))}
                          </div>
                        </div>

                        {(
                          sections.find((s) => s.id === "footer")?.content
                            .sections || []
                        )
                          .slice(0, 2)
                          .map((sec: any, i: number) => (
                            <div key={i}>
                              <h4 className="font-semibold mb-4">
                                {sec.title || "Links"}
                              </h4>
                              <ul className="space-y-2 text-gray-400">
                                {(sec.links || []).map(
                                  (l: string, idx: number) => (
                                    <li key={idx}>{l}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          ))}

                        <div>
                          <h4 className="font-semibold mb-4">Trust</h4>
                          <div className="space-y-2">
                            {/* pakai badges (bukan trustBadges) */}
                            {(
                              sections.find((s) => s.id === "footer")?.content
                                .badges || []
                            ).map((badge: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-400"
                              >
                                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                {badge}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="border-top border-gray-800 pt-8 text-center text-gray-400">
                        <p>
                          {sections.find((s) => s.id === "footer")?.content
                            .copyright ||
                            `© 2024 ${
                              sections.find((s) => s.id === "footer")?.content
                                .companyName || "Company"
                            }. All rights reserved.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
