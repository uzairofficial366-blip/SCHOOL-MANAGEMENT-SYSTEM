import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  try {
    // Clear any server-side session cookies by returning explicit cookie expiry headers
    const response = NextResponse.json({ success: true });
    
    // Expire all next-auth cookies explicitly
    const cookiesToClear = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "authjs.callback-url",
      "authjs.csrf-token",
      "__Secure-authjs.callback-url",
      "__Secure-authjs.csrf-token",
      "__Host-authjs.csrf-token",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
    ];
    
    cookiesToClear.forEach(name => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
