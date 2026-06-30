"use client";

import { useEffect, useState } from "react";

type Item = { id: number; name: string };

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    setIsLoading(true);
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data.items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setItems((prev) => [...prev, { id: Date.now(), name: newName.trim() }]);
    setNewName("");
  };

  const handleRemove = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section>
      <h1>Dashboard</h1>

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
