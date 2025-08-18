"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
const COOKIE_NAME = "admin-auth-token";
const secret = new TextEncoder().encode(process.env.ADMIN_AUTH_SECRET);

export async function isAuthenticated() {
  const t1 = performance.now();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    const t2 = performance.now();
    const t = t2 - t1;
    console.log("Time: ", t);
    return false;
  }

  try {
    await jose.jwtVerify(token, secret);
    const t2 = performance.now();
    const t = t2 - t1;
    console.log("Time: ", t);
    return true;
  } catch (error) {
    return false;
  }
}

export async function login(prevState, formData) {
  const password = formData.get("password");
  const rememberMe = formData.get("remember-me");

  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, message: "رمز عبور وارد شده اشتباه است." };
  }

  const expirationTime = rememberMe === "on" ? "30d" : "2h"; // ۳۰ روز یا ۲ ساعت
  const token = await new jose.SignJWT({ role: "admin" }) // می‌توانید اطلاعات بیشتری هم در توکن بگذارید
    .setProtectedHeader({ alg: "HS256" }) // الگوریتم امضا
    .setExpirationTime(expirationTime) // تنظیم تاریخ انقضا
    .setIssuedAt()
    .sign(secret);

  const maxAgeInSeconds = rememberMe === "on" ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeInSeconds,
  });

  redirect("/admin");
}

export async function logout() {
  cookies().delete(COOKIE_NAME);
  // پیشنهاد: برای تجربه کاربری بهتر، پس از خروج کاربر را به صفحه‌ای هدایت کنید.
  redirect("/");
}
