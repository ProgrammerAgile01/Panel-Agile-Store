// lib/api.ts
export const API_URL = "http://localhost:8000/api";
export const WAREHOUSE_API = "http://localhost:9000/api";
const WAREHOUSE_KEY = "dev-panel-key-abc";

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
   PANEL CATALOG (tabel mst_products) — dipakai ProductManagement
   ====================================================================== */

/**
 * List produk dari Panel (DB mst_products)
 * - endpoint: GET /api/catalog/products
 * - bisa mengembalikan paginator {data, meta, links}
 */
// Panel (public gateway)
export async function listPanelCatalogProducts(q?: string, perPage = 200) {
  const url = new URL(`${API_URL}/catalog/products`);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("per_page", String(perPage));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function syncPanelProducts() {
  const res = await fetch(`${API_URL}/catalog/products/sync`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getPanelCatalogProduct(codeOrId: string | number) {
  const res = await fetch(`${API_URL}/catalog/products/${codeOrId}`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res);
  return res.json(); // {data:{...}}
}

/**
 * Trigger sinkronisasi produk dari Warehouse → Panel DB
 * - endpoint: POST /api/catalog/products/sync
 */

/**
 * Sinkron satu produk by code/id
 * - endpoint: POST /api/catalog/products/{code}/sync
 */
export async function syncOnePanelProduct(codeOrId: string) {
  const res = await fetch(`${API_URL}/catalog/products/${codeOrId}/sync`, {
    method: "POST",
    headers: authHeaders({ Accept: "application/json" }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

/**
 * CRUD langsung ke /api/products (controller CRUD Panel)
 * - createProductPanel / updateProductPanel dipakai oleh modal Add/Edit
 */
// ===== fix 2: CRUD /api/products WAJIB kirim Authorization =====
export async function createProductPanel(payload: {
  product_code: string;
  product_name: string;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  db_name: string;
}) {
  const res = await fetch(`${API_URL}/products`, {
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

export async function updateProductPanel(
  id: string | number,
  payload: {
    product_name: string;
    category?: string | null;
    status?: string | null;
    description?: string | null;
    db_name: string;
  }
) {
  const res = await fetch(`${API_URL}/products/${id}`, {
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

export async function whListFeaturesByProduct(idOrCode: string) {
  const base = WAREHOUSE_API.replace(/\/$/, "");
  const url = `${base}/catalog/products/${encodeURIComponent(
    idOrCode
  )}/features`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-CLIENT-KEY": WAREHOUSE_KEY, // pastikan di-set "dev-panel-key-abc"
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j.message || JSON.stringify(j);
    } catch {}
    throw new Error(msg);
  }
  return res.json(); // bentuk: { data: Feature[], ... } (dari AppGenerate proxy)
}

// (opsional) GET /api/catalog/products/{idOrCode}/menus
export async function whListMenusByProduct(idOrCode: string) {
  const base = WAREHOUSE_API.replace(/\/$/, "");
  const url = `${base}/catalog/products/${encodeURIComponent(idOrCode)}/menus`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-CLIENT-KEY": WAREHOUSE_KEY,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    // tidak semua instalasi punya endpoint menus → biarkan diam2 kalau 404
    if (res.status === 404) return { data: [] };
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j.message || JSON.stringify(j);
    } catch {}
    throw new Error(msg);
  }
  return res.json(); // { data: Menu[] } atau bentuk serupa
}
