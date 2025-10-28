"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus, MessageSquare } from "lucide-react";

import { fetchData, createData, updateData, deleteData } from "@/lib/api";
import { useToast } from "@/lib/use-toast";

interface WhatsAppRecipient {
  id: string;
  phoneNumber: string;
  name: string;
  position: string;
  created_at?: string;
  updated_at?: string;
}

export function WhatsAppSettings() {
  const [recipients, setRecipients] = useState<WhatsAppRecipient[]>([]);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    name: "",
    position: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast ? useToast() : { toast: (arg: any) => {} };

  const STORAGE_KEY = "whatsapp-recipients";

  /* ========== Helpers (frontend side) ========== */

  // Normalize visible user input to international format before sending to API.
  // - "08571234" -> "+628571234"
  // - "8571234"  -> "+628571234"
  // - "628571234" -> "+628571234"
  // - "+628571234" -> "+628571234"
  function normalizeToInternational(raw: string) {
    if (!raw) return raw;
    // remove non-digit and non-plus chars
    let s = raw.trim();
    // keep leading +, remove other non-digit chars
    s = s.replace(/[^+\d]/g, "");

    // already + then digits -> accept
    if (/^\+\d+$/.test(s)) return s;

    // starts with 0 -> replace 0 with +62
    if (/^0\d+$/.test(s)) {
      return "+62" + s.slice(1);
    }

    // starts with 62 -> add +
    if (/^62\d+$/.test(s)) {
      return "+" + s;
    }

    // starts with 8 or 9 (common local mobile without leading 0) -> assume +62
    if (/^[89]\d+$/.test(s)) {
      return "+62" + s;
    }

    // fallback: strip non-digits and return
    const digits = s.replace(/\D/g, "");
    if (digits === "") return raw.trim();
    return digits.length && digits[0] === "0"
      ? "+62" + digits.slice(1)
      : "+" + digits;
  }

  function persistLocal(data: WhatsAppRecipient[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  function mapApiToUi(item: any): WhatsAppRecipient {
    return {
      id:
        item.id?.toString?.() ??
        item._id?.toString?.() ??
        Date.now().toString(),
      phoneNumber: item.phone_number ?? item.phoneNumber ?? "",
      name: item.name ?? item.fullName ?? "",
      position: item.position ?? item.positionName ?? "",
      created_at: item.created_at ?? item.createdAt ?? undefined,
      updated_at: item.updated_at ?? item.updatedAt ?? undefined,
    };
  }

  function validateForm(): boolean {
    if (
      !formData.phoneNumber.trim() ||
      !formData.name.trim() ||
      !formData.position.trim()
    ) {
      setError("Please fill in all fields");
      return false;
    }

    const raw = formData.phoneNumber.replace(/\s+/g, "");

    // Accept:
    // - +628123...
    // - 08123...
    // - 8123...
    // digits only or starting with +
    const ok = /^(\+?[0-9]{6,20})$/.test(raw);
    if (!ok) {
      setError(
        "Phone number invalid. Use digits, optionally start with + or 0, e.g. +62812345678 or 085712345678"
      );
      return false;
    }

    setError(null);
    return true;
  }

  /* ========== Load recipients (try API, fallback to localStorage) ========== */
  async function loadRecipients() {
    setLoading(true);
    try {
      const data = await fetchData("whatsapp-recipients");
      const arr = Array.isArray(data) ? data : data?.data ?? data;
      const normalized = (arr ?? []).map(mapApiToUi);
      setRecipients(normalized);
      persistLocal(normalized);
    } catch (e: any) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setRecipients(JSON.parse(saved));
        } else {
          setRecipients([]);
        }
        toast?.({
          title: "Offline mode",
          description: "Terhubung ke API gagal — menggunakan data lokal.",
        });
      } catch {
        setRecipients([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    persistLocal(recipients);
  }, [recipients]);

  /* ========== Handlers ========== */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRecipient = async () => {
    if (!validateForm()) {
      toast?.({ title: "Gagal", description: error ?? "Periksa input" });
      return;
    }

    // Normalize phone to international format before sending to API
    const normalizedPhone = normalizeToInternational(
      formData.phoneNumber.trim()
    );

    const payload = {
      phone_number: normalizedPhone, // API expects snake_case
      name: formData.name.trim(),
      position: formData.position.trim(),
    };

    setSavingId(editingId ?? "new");
    try {
      if (editingId) {
        await updateData("whatsapp-recipients", editingId, payload);
        toast?.({ title: "Updated", description: "Recipient updated" });
      } else {
        await createData("whatsapp-recipients", payload);
        toast?.({ title: "Added", description: "Recipient added" });
      }

      await loadRecipients();
      setEditingId(null);
      setFormData({ phoneNumber: "", name: "", position: "" });
    } catch (e: any) {
      console.error("save error", e);
      toast?.({
        title: "Error",
        description: e.message ?? "Gagal menyimpan recipient",
      });
      // fallback local optimistic behavior
      if (!editingId) {
        const newRec: WhatsAppRecipient = {
          id: Date.now().toString(),
          phoneNumber: formData.phoneNumber,
          name: formData.name,
          position: formData.position,
        };
        setRecipients((prev) => [...prev, newRec]);
        persistLocal([...recipients, newRec]);
        setFormData({ phoneNumber: "", name: "", position: "" });
      } else {
        setRecipients((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  phoneNumber: formData.phoneNumber,
                  name: formData.name,
                  position: formData.position,
                }
              : r
          )
        );
        persistLocal(recipients);
        setEditingId(null);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleEditRecipient = (recipient: WhatsAppRecipient) => {
    setFormData({
      phoneNumber: recipient.phoneNumber,
      name: recipient.name,
      position: recipient.position,
    });
    setEditingId(recipient.id);
  };

  const handleDeleteRecipient = async (id: string) => {
    const ok = window.confirm(
      "Delete recipient? This action cannot be undone."
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteData("whatsapp-recipients", id);
      const updated = recipients.filter((r) => r.id !== id);
      setRecipients(updated);
      persistLocal(updated);
      toast?.({ title: "Deleted", description: "Recipient removed" });
      if (editingId === id) {
        setEditingId(null);
        setFormData({ phoneNumber: "", name: "", position: "" });
      }
    } catch (e: any) {
      console.error("delete error", e);
      toast?.({
        title: "Error",
        description: e.message ?? "Gagal menghapus recipient",
      });
      // fallback local delete
      const updated = recipients.filter((r) => r.id !== id);
      setRecipients(updated);
      persistLocal(updated);
      if (editingId === id) {
        setEditingId(null);
        setFormData({ phoneNumber: "", name: "", position: "" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      phoneNumber: "",
      name: "",
      position: "",
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mt-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          WhatsApp Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage WhatsApp message recipients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Recipient" : "Add Recipient"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Update recipient details"
                : "Add a new WhatsApp recipient"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                name="phoneNumber"
                placeholder="e.g., +62812345678 or 085712345678"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                name="name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Input
                name="position"
                placeholder="e.g., Manager, Support Team"
                value={formData.position}
                onChange={handleInputChange}
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddRecipient}
                className="flex-1"
                disabled={!!savingId}
              >
                <Plus className="h-4 w-4 mr-2" />
                {savingId
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                  ? "Update"
                  : "Add"}
              </Button>
              {editingId && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipients List Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recipients List</CardTitle>
            <CardDescription>
              {recipients.length === 0
                ? "No recipients added yet"
                : `${recipients.length} recipient(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading recipients…
              </div>
            ) : recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No WhatsApp recipients configured yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first recipient to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-4 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {recipient.position}
                      </div>
                      <div className="text-sm text-primary mt-1">
                        {recipient.phoneNumber}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecipient(recipient)}
                        className="hover:bg-primary/10"
                        disabled={!!savingId || !!deletingId}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecipient(recipient.id)}
                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                        disabled={deletingId === recipient.id || !!savingId}
                      >
                        {deletingId === recipient.id ? (
                          "Deleting..."
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
