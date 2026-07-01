"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { isReplay, nextDeterministicId, injectAuthForReplay } from "@/lib/meticulous";
import SharedBanner from "@/components/SharedBanner";

type Item = { id: number; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Replay-safe: during a Meticulous replay, authenticate before guarding so the
    // dashboard renders (otherwise the guard redirects to /login and this screen is
    // never covered). Runs synchronously so isAuthenticated() below sees the token.
    injectAuthForReplay();
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const loadItems = async () => {
      setIsLoading(true);
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.items);
      setIsLoading(false);
    };
    loadItems();
  }, [router]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    // Deterministic id during replay avoids flaky visual diffs from Date.now(). (#9)
    const id = isReplay() ? nextDeterministicId() : Date.now();
    // Fire a write request; Meticulous mocks this on replay (no real side-effect). (#3)
    void fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).catch((error) => {
      console.error("Failed to persist item:", error);
    });
    setItems((prev) => [...prev, { id, name: newName.trim() }]);
    setNewName("");
  };

  const handleRemove = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section>
      <SharedBanner />
      <h1 style={{ color: "#5158cf" }}>Dashboard — Updated</h1>

      <form onSubmit={handleAdd} data-testid="form-add-item" style={{ display: "flex", gap: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New item name"
          data-testid="input-name-item"
          style={{ flex: 1, padding: 8 }}
        />
        <button
          type="submit"
          data-testid="btn-add-item"
          style={{ padding: "8px 16px", background: "#5158cf", color: "#fff", border: 0, borderRadius: 6 }}
        >
          Add
        </button>
      </form>

      {isLoading ? (
        <p data-testid="text-items-loading">Loading...</p>
      ) : (
        <ul data-testid="list-items">
          {items.map((item) => (
            <li key={item.id} data-testid={`row-item-${item.id}`} style={{ marginBottom: 6 }}>
              {item.name}{" "}
              <button
                onClick={() => handleRemove(item.id)}
                data-testid={`btn-remove-item-${item.id}`}
                style={{ marginLeft: 8, color: "#dc2626", border: 0, background: "none", cursor: "pointer" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
