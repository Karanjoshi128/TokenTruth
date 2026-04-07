import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { decryptApiKey } from "@/lib/key-encryption";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

// Reveal the actual key value (for copy/test)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const limit = checkRateLimit(`reveal:${session.userId}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const row = await prisma.storedKey.findUnique({ where: { id } });

  if (!row || row.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let plain: string;
  try {
    plain = decryptApiKey(row.encryptedKey, row.iv, row.authTag);
  } catch {
    return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
  }

  return NextResponse.json({ key: plain });
}

// Update label
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.storedKey.findUnique({ where: { id } });

  if (!row || row.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  const updated = await prisma.storedKey.update({
    where: { id },
    data: { label: body.label.trim() },
    select: { id: true, label: true, provider: true, updatedAt: true },
  });

  return NextResponse.json({ key: updated });
}

// Delete a stored key
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.storedKey.findUnique({ where: { id } });

  if (!row || row.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.storedKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
