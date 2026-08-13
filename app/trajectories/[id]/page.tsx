import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { TrajectoryDetailClient } from "@/components/TrajectoryDetailClient";

interface IndexEntry {
  id: string;
}

function loadIndex(): IndexEntry[] {
  const p = path.join(process.cwd(), "public", "data", "index.json");
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function generateStaticParams() {
  return loadIndex().map(({ id }) => ({ id }));
}

export const dynamicParams = false;

export default async function TrajectoryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) notFound();
  return <TrajectoryDetailClient id={id} />;
}
