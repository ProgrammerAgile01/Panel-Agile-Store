// lib/api.ts
export const API_URL = "http://localhost:8000/api";
export const WAREHOUSE_API = "http://localhost:9000/api";
const WAREHOUSE_KEY = "dev-panel-key-abc";
export const TRANSLATE_API = `${API_URL}/translate-batch`;

import { getToken, setToken, clearToken } from "./auth";

/* ========== Helpers ========== */
function isFileLike(v: any) {
  return (
    typeof File !== "undefined" && (v instanceof File || v instanceof Blob)
  );
}

function hasBinary(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some(isFileLike);
}

function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((vv, i) => fd.append(`${k}[${i}]`, vv as any));
    } else if (v !== undefined && v !== null) {
      fd.append(k, v as any);
    }
  });
  return fd;
}

async function parseError(res: Response) {
  let msg = `${res.status} ${res.statusText}`;
  try {
    const err = await res.json();
    msg = err.message || JSON.stringify(err);
  } catch {}
  throw new Error(msg);
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ========== AUTH ========== */
export async function login(
  email: string,
  password: string,
  level?: { id?: number; name?: string }
) {
  const body: any = { email, password };
  if (level?.id) body.level_id = level.id;
  if (level?.name) body.level_name = level.name;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return parseError(res);
  const data = await res.json();

  if (data?.token) setToken(data.token);
  return data; // {token, user, current_level, permissions, menus, ...}
}

export async function me() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function logout() {
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: authHeaders({ Accept: "application/json" }),
    });
    // walau gagal, tetap clear token
    clearToken();
    if (!res.ok) return parseError(res);
    return res.json();
  } catch (e) {
    clearToken();
    throw e;
  }
}

export async function refreshToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  const data = await res.json();
  if (data?.token) setToken(data.token);
  return data;
}

/* ========== Fetch list (mendukung query string) ========== */
export async function fetchData(entity: string) {
  const res = await fetch(`${API_URL}/${entity}`, {
    cache: "no-store",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  const response = await res.json();
  return Array.isArray(response) ? response : response.data;
}

/* ========== Create (auto JSON/FormData) ========== */
export async function createData(entity: string, data: any) {
  const multipart = hasBinary(data);
  const res = await fetch(`${API_URL}/${entity}`, {
    method: "POST",
    headers: authHeaders(
      multipart
        ? { Accept: "application/json" }
        : { "Content-Type": "application/json", Accept: "application/json" }
    ),
    body: multipart ? toFormData(data) : JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return await res.json();
}

/* ========== Get by id ========== */
export async function getDataById(entity: string, id: string | number) {
  const res = await fetch(`${API_URL}/${entity}/${id}`, {
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  const response = await res.json();
  return response.data || response;
}

/* ========== Update (auto JSON/FormData) ========== */
export async function updateData(
  entity: string,
  id: string | number,
  data: any
) {
  const multipart = hasBinary(data);
  if (multipart) {
    const fd = toFormData(data);
    fd.append("_method", "PUT");
    const res = await fetch(`${API_URL}/${entity}/${id}`, {
      method: "POST",
      headers: authHeaders({ Accept: "application/json" }),
      body: fd,
    });
    if (!res.ok) return parseError(res);
    return await res.json();
  } else {
    const payload = { ...data };
    const res = await fetch(`${API_URL}/${entity}/${id}`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return parseError(res);
    return await res.json();
  }
}

/* ========== Delete ========== */
export async function deleteData(entity: string, id: string | number) {
  const res = await fetch(`${API_URL}/${entity}/${id}`, {
    method: "DELETE",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  return await res.json();
}

/* ========== (opsional) Stats generik ========== */
export async function fetchStats(entity: string) {
  const res = await fetch(`${API_URL}/${entity}/stats`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Gagal mengambil statistik untuk ${entity}`);
  const response = await res.json();
  return response.data ?? response;
}

/* ======================================================================
   Helpers khusus Matrix Level
   ====================================================================== */

export async function fetchLevels() {
  const raw = await fetchData("level_users");

  const mapStatus = (s: any) => {
    if (s === "Aktif") return "Active";
    if (s === "Tidak Aktif") return "Inactive";
    return s ?? "Active";
  };

  return (raw as any[]).map((r) => ({
    id: r.id,
    name: r.name ?? r.nama_level ?? "",
    description: r.description ?? r.deskripsi ?? "",
    status: mapStatus(r.status),
    default_homepage: r.default_homepage ?? r.defaultHomepage ?? "dashboard",
  }));
}

export async function fetchNavItems() {
  return await fetchData("nav-items");
}

export async function fetchLevelPermissions(levelId: string | number) {
  return await fetchData(`level-permissions?level_id=${levelId}`);
}

export async function saveLevelPermissions(
  levelId: string | number,
  permissions: Array<{
    nav_item_id: number;
    access: boolean;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    print: boolean;
  }>
) {
  return await createData("level-permissions/bulk", {
    level_id: levelId,
    permissions,
  });
}

export async function fetchNavItemsTree() {
  const res = await fetch(`${API_URL}/nav-items?format=tree`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  const json = await res.json();
  return json.data ?? []; // <— kembalikan langsung array
}

/* ======================================================================
   WAREHOUSE CLIENT (Agile Warehouse Gateway)
   ====================================================================== */

/* ======================================================================
   PRODUCTS (Panel Agile Store) — sumber sidebar
   ====================================================================== */

export async function listPanelCatalogProducts(q?: string, perPage = 200) {
  const base = API_URL.replace(/\/$/, "");
  const url = new URL(`${base}/catalog/products`);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("per_page", String(perPage));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getPanelCatalogProduct(codeOrId: string | number) {
  const res = await fetch(`${API_URL}/catalog/products/${codeOrId}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // {data:{...}}
}

/* ======================================================================
   FEATURES & MENUS (READ-ONLY mirror)
   ====================================================================== */

export async function panelListFeaturesByProduct(
  codeOrId: string,
  refresh = false
) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/features`
  );
  if (refresh) url.searchParams.set("refresh", "1");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { data: rows(item_type=FEATURE) }
}

export async function panelListMenusByProduct(
  codeOrId: string,
  refresh = false
) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/menus`
  );
  if (refresh) url.searchParams.set("refresh", "1");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { data: rows(item_type in MENU,SUBMENU) }
}
export async function panelSyncMenusByProduct(codeOrId: string) {
  const res = await fetch(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/menus/sync`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) return parseError(res);
  return res.json(); // { success, count }
}
// Tambahan helper: update harga parent feature (item_type=FEATURE saja)
export async function panelUpdateParentFeaturePrice(
  productCodeOrId: string,
  featureIdOrCode: string,
  priceAddon: number
) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(
      productCodeOrId
    )}/features/${encodeURIComponent(featureIdOrCode)}/price`
  );

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ price_addon: Number(priceAddon) }),
    cache: "no-store",
  });

  if (!res.ok) {
    // beri pesan jelas untuk 401/403
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Unauthorized: silakan login lagi untuk mengirim perubahan."
      );
    }
    const errTxt = await res.text().catch(() => "");
    throw new Error(errTxt || `HTTP ${res.status}`);
  }

  return res.json();
}

/* ======================================================================
   (Opsional) CRUD Products via JWT (dipakai halaman lain di Panel)
   ====================================================================== */

// export async function createProductPanel(payload: {
//   product_code: string;
//   product_name: string;
//   category?: string | null;
//   status?: string | null;
//   description?: string | null;
//   db_name: string;
// }) {
//   const res = await fetch(`${API_URL}/products`, {
//     method: "POST",
//     headers: authHeaders({
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     }),
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) return parseError(res);
//   return res.json();
// }

/**
 * Create product.
 * Accepts either:
 *  - plain object (will be sent as JSON), OR
 *  - FormData (file already appended) OR
 *  - object with File/Blob values (will be converted to FormData by hasBinary/toFormData)
 */
export async function createProductPanel(payload: any) {
  // If caller already passed FormData -> send directly
  if (payload instanceof FormData) {
    const headers = authHeaders({ Accept: "application/json" });
    // remove Content-Type if present (some authHeaders impl might set it)
    delete (headers as any)["Content-Type"];
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers,
      body: payload,
      credentials: "include",
    });
    if (!res.ok) return parseError(res);
    return res.json();
  }

  // If payload contains File/Blob somewhere -> convert to FormData
  if (hasBinary(payload)) {
    const fd = toFormData(payload);
    const headers = authHeaders({ Accept: "application/json" });
    delete (headers as any)["Content-Type"];
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers,
      body: fd,
      credentials: "include",
    });
    if (!res.ok) return parseError(res);
    return res.json();
  }

  // Fallback JSON (existing behaviour)
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

// export async function updateProductPanel(
//   id: string | number,
//   payload: {
//     product_name: string;
//     category?: string | null;
//     status?: string | null;
//     db_name: string | null;
//     description?: string | null;
//   }
// ) {
//   const res = await fetch(`${API_URL}/products/${id}`, {
//     method: "PUT",
//     headers: authHeaders({
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     }),
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) return parseError(res);
//   return res.json();
// }

/**
 * Update product.
 * Accepts FormData, object-with-binary, or JSON object.
 * When sending FormData we use POST + _method=PUT (method spoofing) to be compatible with API routes.
 */
export async function updateProductPanel(id: string | number, payload: any) {
  // If payload already FormData -> append _method and send POST
  if (payload instanceof FormData) {
    payload.append("_method", "PUT");
    const headers = authHeaders({ Accept: "application/json" });
    delete (headers as any)["Content-Type"];
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "POST",
      headers,
      body: payload,
      credentials: "include",
    });
    if (!res.ok) return parseError(res);
    return res.json();
  }

  // If payload contains File/Blob somewhere -> convert to FormData + _method
  if (hasBinary(payload)) {
    const fd = toFormData(payload);
    fd.append("_method", "PUT");
    const headers = authHeaders({ Accept: "application/json" });
    delete (headers as any)["Content-Type"];
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "POST",
      headers,
      body: fd,
      credentials: "include",
    });
    if (!res.ok) return parseError(res);
    return res.json();
  }

  // JSON path (PUT)
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
/* ======================================================================
   PACKAGES (Public + Admin)
   ====================================================================== */

// PUBLIC — list packages by product (reader untuk FE katalog)
export async function panelListPackagesByProduct(
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
  if (!res.ok) return parseError(res);
  return res.json(); // { data: [...] }
}

// ADMIN — CRUD packages
export async function adminListPackages(params?: {
  product_code?: string;
  product_id?: string;
  status?: "active" | "inactive";
  q?: string;
  per_page?: number;
}) {
  const url = new URL(`${API_URL}/packages`);
  if (params?.product_code)
    url.searchParams.set("product_code", params.product_code);
  if (params?.product_id) url.searchParams.set("product_id", params.product_id);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.per_page != null)
    url.searchParams.set("per_page", String(params.per_page));

  const res = await fetch(url.toString(), {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { data: rows|pagination }
}

export async function createPackage(payload: {
  product_code: string;
  product_id?: string | null;
  name: string;
  package_code?: string | null;
  description?: string | null;
  notes?: string | null;
  status?: "active" | "inactive";
  order_number?: number;
}) {
  const res = await fetch(`${API_URL}/packages`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updatePackage(
  id: number | string,
  payload: Partial<{
    product_code: string;
    product_id?: string | null;
    name: string;
    package_code?: string | null;
    description?: string | null;
    notes?: string | null;
    status?: "active" | "inactive";
    order_number?: number;
  }>
) {
  const res = await fetch(`${API_URL}/packages/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function deletePackage(id: number | string) {
  const res = await fetch(`${API_URL}/packages/${id}`, {
    method: "DELETE",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
// Matrix read
export async function getPackageMatrix(
  codeOrId: string,
  type: "features" | "menus" | "both" = "both"
) {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/matrix`
  );
  if (type) url.searchParams.set("type", type);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // {data:{product,packages,features,menus,matrix}}
}

// Bulk save
export async function savePackageMatrix(
  codeOrId: string,
  changes: Array<{
    item_type: "feature" | "menu";
    item_id: string;
    package_id: number;
    enabled: boolean;
  }>
) {
  const res = await fetch(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/matrix/bulk`,
    {
      method: "POST",
      headers: authHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify({ changes }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Toggle one cell
export async function togglePackageMatrixCell(
  codeOrId: string,
  payload: {
    item_type: "feature" | "menu";
    item_id: string;
    package_id: number;
    enabled: boolean;
  }
) {
  const res = await fetch(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/matrix/toggle`,
    {
      method: "PATCH",
      headers: authHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
// ========= MATRIX PACKAGE (READ/WRITE) ========

// READ agregat untuk Matrix (public)
export async function fetchMatrixByProduct(codeOrId: string): Promise<{
  data: {
    product: any;
    packages: Array<{
      id: number | string;
      product_id: number | string;
      product_code: string;
      package_code?: string;
      name: string;
      description?: string | null;
      status: "active" | "inactive";
      notes?: string | null;
      order_number?: number | null;
    }>;
    features: Array<{
      id: string;
      product_code: string;
      type: "FEATURE" | string;
      code: string;
      name: string;
      description?: string | null;
      module?: string | null;
      price_addon?: number | null;
      is_active?: boolean;
      order_number?: number | null;
    }>;
    menus: Array<{
      id: number | string;
      product_code: string;
      type: "menu";
      code: string;
      name: string;
      description?: string | null;
      module?: string | null;
      is_active?: boolean;
      order_number?: number | null;
    }>;
    matrix: Array<{
      item_type: "feature" | "menu";
      item_id: string;
      package_id: number | string;
      enabled: boolean;
    }>;
  };
}> {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/matrix`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to load matrix (${res.status})`);
  }
  return res.json();
}

// WRITE bulk (JWT)
export async function saveMatrixBulkAPI(
  codeOrId: string,
  changes: Array<{
    item_type: "feature" | "menu";
    item_id: string;
    package_id: number | string;
    enabled: boolean;
  }>
) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/matrix/bulk`;

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ changes }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to save matrix (${res.status})`);
  }
  return res.json();
}

// WRITE toggle (JWT)
export async function toggleMatrixCellAPI(
  codeOrId: string,
  payload: {
    item_type: "feature" | "menu";
    item_id: string;
    package_id: number | string;
    enabled: boolean;
  }
) {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/matrix/toggle`;

  const res = await fetch(url, {
    method: "PATCH", // <— cocok dengan controller
    headers: authHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to toggle cell (${res.status})`);
  }
  return res.json();
}

/* ======================================================================
   DURATIONS (CRUD)
   ====================================================================== */

export async function fetchDurations(params?: {
  status?: "active" | "archived";
  q?: string;
}) {
  const url = new URL(`${API_URL}/durations`);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.q) url.searchParams.set("q", params.q);

  const res = await fetch(url.toString(), {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { success, data: Duration[] }
}

export type DurationPayload = {
  name: string;
  length: number;
  unit: "day" | "week" | "month" | "year";
  code?: string | null;
  is_default?: boolean;
  status: "active" | "archived";
  notes?: string | null;
};

export async function createDuration(payload: DurationPayload) {
  const res = await fetch(`${API_URL}/durations`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { success, data }
}

export async function updateDuration(
  id: string | number,
  payload: DurationPayload
) {
  const res = await fetch(`${API_URL}/durations/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { success, data }
}

export async function deleteDuration(id: string | number) {
  const res = await fetch(`${API_URL}/durations/${id}`, {
    method: "DELETE",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  return res.json(); // { success }
}

/* ======================================================================
   PriceList (CRUD)
   ====================================================================== */
export type PricelistItemDTO = {
  duration_id: string | number;
  package_id: string | number;
  price: number;
  discount?: number | null; // backend nominal (dari persen)
  min_billing_cycle?: number | null;
  prorate?: boolean | null;
  effective_start?: string | null;
  effective_end?: string | null;
};

export type PricelistDTO = {
  currency: string;
  tax_mode: "inclusive" | "exclusive";
  items: PricelistItemDTO[];
};

export async function getPricelistByProduct(
  codeOrId: string
): Promise<PricelistDTO> {
  const url = `${API_URL}/catalog/products/${encodeURIComponent(
    codeOrId
  )}/pricelist`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      txt || `Gagal mengambil pricelist (${res.status} ${res.statusText})`
    );
  }
  return res.json();
}

export async function updatePricelistHeader(
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
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Gagal update header (${res.status})`);
  }
  return res.json();
}

export async function upsertPricelistItems(
  codeOrId: string,
  payload: PricelistDTO
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
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Gagal menyimpan pricelist (${res.status})`);
  }
  return res.json();
}

// ---------- LOADER DATA PRODUK + PACKAGES + DURATIONS ----------
export type SidebarProduct = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  product_code: string;
};

export type SimplePackage = {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  package_code?: string;
};

export type SimpleDuration = {
  id: string;
  name: string;
  code: string;
  months: number;
  status: "active" | "inactive";
};

export async function listCatalogProductsSlim(
  q?: string
): Promise<SidebarProduct[]> {
  const base = API_URL.replace(/\/$/, "");
  const url = new URL(`${base}/catalog/products`);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("per_page", "200");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      txt || `Gagal mengambil produk (${res.status} ${res.statusText})`
    );
  }

  const json = await res.json().catch(() => ({}));
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];

  return rows.map((r) => ({
    id: String(r.id ?? r.product_id ?? r.code ?? crypto.randomUUID()),
    name:
      String(
        r.product_name ?? r.name ?? r.title ?? r.product_code ?? "Product"
      ) || "Product",
    description: String(r.description ?? r.product_description ?? "") || "",
    status: (String(r.status ?? "active").toLowerCase() === "inactive"
      ? "inactive"
      : "active") as "active" | "inactive",
    product_code: String(r.product_code ?? r.code ?? r.slug ?? "") || "",
  }));
}

export async function listPackagesByProduct(
  codeOrId: string,
  includeInactive = false
): Promise<SimplePackage[]> {
  const url = new URL(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/packages`
  );
  if (includeInactive) url.searchParams.set("include_inactive", "1");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Gagal mengambil packages (${res.status})`);
  }
  const json = await res.json().catch(() => ({}));
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? r.package_name ?? "Package"),
    description: String(r.description ?? "") || "",
    status: (String(r.status ?? "active").toLowerCase() === "inactive"
      ? "inactive"
      : "active") as "active" | "inactive",
    package_code: r.package_code ? String(r.package_code) : undefined,
  }));
}

export async function listDurationsActive(): Promise<SimpleDuration[]> {
  const url = new URL(`${API_URL}/durations`);
  url.searchParams.set("status", "active");

  const res = await fetch(url.toString(), {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      txt || `Gagal mengambil durations (${res.status} ${res.statusText})`
    );
  }
  const json = await res.json().catch(() => ({}));
  const rows: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    code: String(r.code ?? ""),
    months: Number(r.months ?? 1),
    status: (String(r.status ?? "active").toLowerCase() === "archived"
      ? "inactive"
      : "active") as "active" | "inactive",
  }));
}

/**
 * Helper gabungan buat komponen Pricelist
 */
export async function loadPricelistBundle(codeOrId: string) {
  const [packages, durations, pricelist] = await Promise.all([
    listPackagesByProduct(codeOrId, false),
    listDurationsActive(),
    getPricelistByProduct(codeOrId),
  ]);
  return { packages, durations, pricelist };
}
// GET landing
export async function getLandingByProduct(codeOrId: string) {
  const res = await fetch(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/landing`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // {data:{product,page,sections}}
}

// SAVE landing (JWT required)
export async function saveLandingByProduct(
  codeOrId: string,
  payload: {
    status?: "draft" | "published";
    meta?: Record<string, any>;
    sections: Array<{
      id?: string;
      section_key: string;
      name: string;
      enabled: boolean;
      display_order: number;
      content?: any;
      // ✅ baru: kirim mirror EN jika ada
      content_en?: any;
      // (opsional kalau mau pakai): name_en?: string;
    }>;
  }
) {
  const res = await fetch(
    `${API_URL}/catalog/products/${encodeURIComponent(codeOrId)}/landing`,
    {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ==================== UPLOAD MEDIA ====================
async function tryRefreshToken() {
  // contoh: pukul endpoint refresh, simpan token baru
  const resp = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!resp.ok) return false;
  const j = await resp.json();
  if (j?.access_token) {
    localStorage.setItem("access_token", j.access_token);
    return true;
  }
  return false;
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = authHeaders();
  // JANGAN set Content-Type (biar browser atur multipart boundary)
  // Pastikan tidak ada "Content-Type" di headers
  delete (headers as any)["Content-Type"];

  let res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const headers2 = authHeaders();
      delete (headers2 as any)["Content-Type"];
      res = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: headers2,
        body: formData,
      });
    }
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return String(data.url); // sebaiknya absolute URL dari backend
}

/* ===================== AGILE STORE SETTINGS ===================== */

export type AgileItem = {
  id?: number;
  item_type?: string;

  // Lokal/ID
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  cta_label?: string | null;

  // EN (dasar)
  title_en?: string | null;
  subtitle_en?: string | null;
  description_en?: string | null;
  cta_label_en?: string | null;

  order?: number;
  product_code?: string | null;
  package_id?: number | string | null;
  duration_id?: number | string | null;

  price_monthly?: number | string | null;
  price_yearly?: number | string | null;

  extras?: any | null; // ID
  extras_en?: any | null; // EN
};

export type AgileSection = {
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
  theme?: any | null;

  // bilingual
  content?: any | null; // ID (lokal)
  content_en?: any | null; // EN (dasar)

  items?: AgileItem[];
};

// Kembalikan SELALU { data: AgileSection[] }
export async function getAgileSections(): Promise<{ data: AgileSection[] }> {
  const res = await fetch(`${API_URL}/agile-store/sections`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) {
    await parseError(res);
    throw new Error("Failed to load sections");
  }
  const json = await res.json().catch(() => ({}));
  const rows: AgileSection[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];
  return { data: rows };
}

export async function getAgileSectionByKey(
  key: string
): Promise<{ data: AgileSection | null }> {
  const res = await fetch(
    `${API_URL}/agile-store/sections/${encodeURIComponent(key)}`,
    {
      headers: authHeaders({ Accept: "application/json" }),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    await parseError(res);
    throw new Error("Failed to load section");
  }
  const json = await res.json().catch(() => ({}));
  const data = json?.data ?? json ?? null;
  return { data };
}

export async function upsertAgileSections(payload: {
  sections: AgileSection[];
}) {
  const res = await fetch(`${API_URL}/agile-store/sections/upsert`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await parseError(res);
    throw new Error("Failed to save sections");
  }
  const json = await res.json().catch(() => ({}));
  return { success: true, ...(typeof json === "object" ? json : {}) };
}
