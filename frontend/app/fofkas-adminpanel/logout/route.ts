import { cookies } from "next/headers";

// "Вийти" button, and also used when the login has expired: removes the cookie and opens the login page
// The address is relative on purpose: inside Docker the server sees itself as 0.0.0.0:3000,
// and a full address built from it would not open in the browser.
async function logout() {
  (await cookies()).delete("access_token");
  return new Response(null, { status: 303, headers: { Location: "/fofkas-adminpanel/login" } });
}

export const GET = logout;
export const POST = logout;
