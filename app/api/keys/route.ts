import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { StoredKey } from "@/lib/generated/prisma/client";
import { encryptApiKey, decryptApiKey } from "@/lib/key-encryption";
import { detectProvider } from "@/lib/detect-provider";

function maskKey(plain: string): string {
  if (plain.length <= 12) return "•".repeat(plain.length);
  return `${plain.slice(0, 8)}${"•".repeat(Math.min(16, plain.length - 12))}${plain.slice(-4)}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.storedKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const keys = rows.map((row: StoredKey) => {
    let keyPreview = "••••••••";
    try {
      const plain = decryptApiKey(row.encryptedKey, row.iv, row.authTag);
      keyPreview = maskKey(plain);
    } catch {
      // decryption failed — show placeholder
    }
    return {
      id: row.id,
      label: row.label,
      provider: row.provider,
      keyPreview,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key?: string; label?: string; provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { key, label, provider: manualProvider } = body;

  if (!key || typeof key !== "string" || key.trim().length === 0 || key.length > 512) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const trimmed = key.trim();
  const detectedProvider = detectProvider(trimmed);
  const provider = manualProvider || detectedProvider;
  const keyLabel =
    label?.trim() ||
    `${provider.charAt(0).toUpperCase() + provider.slice(1)} Key`;

  const { encrypted, iv, authTag } = encryptApiKey(trimmed);

  const stored = await prisma.storedKey.create({
    data: {
      userId: session.userId,
      label: keyLabel,
      encryptedKey: encrypted,
      iv,
      authTag,
      provider,
    },
    select: { id: true, label: true, provider: true, createdAt: true },
  });

  return NextResponse.json({ key: stored }, { status: 201 });
}
