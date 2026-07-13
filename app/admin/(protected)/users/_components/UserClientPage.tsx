"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Shield, User as UserIcon } from "lucide-react";
import UserFormModal, { UserData, type User } from "./UserFormModal";

interface UserClientPageProps {
  initialUsers: User[];
  currentUserId: string;
}

/** Komponen klien manajemen user dengan operasi CRUD dan modal form. */
export default function UserClientPage({ initialUsers, currentUserId }: UserClientPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /** Menampilkan pesan status sementara yang hilang otomatis setelah 3 detik. */
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  /** Membuat pengguna baru melalui API dan menambahkannya ke daftar. */
  const handleCreate = async (data: UserData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menambah pengguna");
    }

    const newUser = await res.json();
    setUsers([...users, newUser]);
    showMessage("success", "Pengguna berhasil ditambahkan");
  };

  /** Memperbarui data pengguna terpilih melalui API. */
  const handleEdit = async (data: UserData) => {
    if (!editingUser) return;

    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengupdate pengguna");
    }

    const updated = await res.json();
    setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
    showMessage("success", "Pengguna berhasil diupdate");
  };

  /** Menghapus pengguna berdasarkan ID setelah validasi akun sendiri. */
  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      showMessage("error", "Tidak bisa menghapus akun sendiri");
      return;
    }

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus pengguna");
      }

      setUsers(users.filter((u) => u.id !== id));
      showMessage("success", "Pengguna berhasil dihapus");
    } catch (err: any) {
      showMessage("error", err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  /** Membuka modal form dalam mode tambah pengguna baru. */
  const openCreateModal = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  /** Membuka modal form dalam mode edit pengguna yang dipilih. */
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl hover:bg-emerald-800 transition font-medium"
        >
          <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                        {(u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{u.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        u.role === "superadmin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <Shield size={12} />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pengguna "${u.name}"?`)) {
                            handleDelete(u.id);
                          }
                        }}
                        disabled={isDeleting === u.id || u.id === currentUserId}
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon size={32} className="text-gray-300" />
                      <span>Belum ada pengguna</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingUser ? handleEdit : handleCreate}
        user={editingUser}
      />
    </div>
  );
}
