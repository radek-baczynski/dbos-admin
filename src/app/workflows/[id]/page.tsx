"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkflowDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) {
      router.replace(`/workflows?detail=${encodeURIComponent(id)}`);
    } else {
      router.replace("/workflows");
    }
  }, [id, router]);

  return (
    <div className="relative z-10 flex items-center justify-center p-8 md:p-10">
      <p className="text-sm text-[var(--text-muted)]">
        Redirecting to workflow…
      </p>
    </div>
  );
}
