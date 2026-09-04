"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/store";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.isHrFlow) {
      router.replace("/company");
    } else if (user.result) {
      router.replace("/dashboard");
    } else {
      router.replace("/mbti-test");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading Meridian…</p>
    </div>
  );
}
