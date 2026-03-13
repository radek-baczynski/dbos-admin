import { redirect } from "next/navigation";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function QueuedRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const p = new URLSearchParams();
  p.set("mode", "queued");
  const keys = Object.keys(params).filter((k) => k !== "mode" && k !== "page");
  for (const key of keys) {
    const v = params[key];
    if (typeof v === "string") p.set(key, v);
    else if (Array.isArray(v)) v.forEach((val) => p.append(key, val));
  }
  redirect(`/workflows?${p.toString()}`);
}
