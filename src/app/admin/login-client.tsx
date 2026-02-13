"use client";

import { signIn } from "next-auth/react";
import { Lock } from "lucide-react";

export function AdminLoginPage() {
  return (
    <section className="grid-container py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-overlay flex items-center justify-center mb-6">
          <Lock size={28} className="text-ink-faint" />
        </div>

        <h1 className="text-2xl md:text-3xl">Quản trị</h1>
        <p className="mt-3 text-ink-muted">
          Vui lòng đăng nhập để truy cập trang quản trị.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Đăng nhập bằng Google
        </button>

        <p className="mt-4 text-xs text-ink-faint">
          Chỉ tài khoản admin mới có thể đăng nhập.
        </p>
      </div>
    </section>
  );
}
