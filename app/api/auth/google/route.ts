import { Google, generateState, generateCodeVerifier } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const google = new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${origin}/api/auth/google/callback`
  );

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set("google_oauth_state", state, cookieOpts);
  cookieStore.set("google_code_verifier", codeVerifier, cookieOpts);

  return NextResponse.redirect(url.toString());
}
