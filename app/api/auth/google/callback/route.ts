import { Google } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
};

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const storedCodeVerifier = cookieStore.get("google_code_verifier")?.value;

  // Clear OAuth cookies regardless of outcome
  cookieStore.delete("google_oauth_state");
  cookieStore.delete("google_code_verifier");

  if (error || !code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return NextResponse.redirect(`${origin}?auth_error=1`);
  }

  const google = new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${origin}/api/auth/google/callback`
  );

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
  } catch {
    return NextResponse.redirect(`${origin}?auth_error=1`);
  }

  let googleUser: GoogleUser;
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    if (!res.ok) throw new Error("userinfo failed");
    googleUser = await res.json();
  } catch {
    return NextResponse.redirect(`${origin}?auth_error=1`);
  }

  if (!googleUser.email || !googleUser.email_verified) {
    return NextResponse.redirect(`${origin}?auth_error=unverified`);
  }

  const email = googleUser.email.toLowerCase();

  // Find existing user by googleId or email, then link / create
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: googleUser.sub }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email, googleId: googleUser.sub },
    });
  } else if (!user.googleId) {
    // Existing email/password account — link it
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.sub },
    });
  }

  await createSession(user.id, user.email);
  return NextResponse.redirect(origin);
}
