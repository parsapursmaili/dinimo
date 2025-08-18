"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  LoaderCircle,
  LogIn,
} from "lucide-react";

// دکمه ورود با استایل‌های بهبود یافته
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full button-primary flex items-center justify-center gap-2 transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed group shadow-md hover:shadow-lg hover:-translate-y-0.5"
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin h-5 w-5" />
          <span>در حال بررسی...</span>
        </>
      ) : (
        <>
          <span>ورود</span>
          <LogIn className="h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, {
    success: true,
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && state.message && (
        <div className="flex items-center gap-3 bg-error-background text-error p-3 rounded-lg border border-error-border animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-2 text-foreground/80"
        >
          رمز عبور
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full pl-10 pr-10 py-3 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
            placeholder="••••••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 transition-colors"
            aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* کامپوننت Toggle Switch مدرن */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="remember-me"
          className="text-sm text-foreground/80 cursor-pointer"
        >
          مرا به خاطر بسپار
        </label>
        <label
          htmlFor="remember-me"
          className="relative inline-flex items-center cursor-pointer"
        >
          {/* چک‌باکس اصلی که مخفی است و منطق را کنترل می‌کند */}
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="sr-only peer" // sr-only آن را از دید پنهان می‌کند اما برای screen readerها قابل دسترس است
            defaultChecked
          />
          {/* بدنه سوییچ (Track) */}
          <div className="w-11 h-6 bg-input-border rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:bg-primary transition-colors"></div>
          {/* دایره سوییچ (Thumb) */}
          <div className="absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-full"></div>
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
