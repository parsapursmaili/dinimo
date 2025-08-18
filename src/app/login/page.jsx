import LoginForm from "./loginForm";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
      {/* انیمیشن و استایل‌های بهبود یافته به این بخش اضافه شده */}
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ورود به پنل مدیریت</h1>
          <p className="text-foreground/70">
            برای دسترسی به بخش مدیریت، لطفاً رمز عبور خود را وارد کنید.
          </p>
        </div>

        {/* استایل بهبود یافته برای کادر اصلی فرم */}
        <div className="bg-secondary p-8 rounded-2xl shadow-lg w-full border border-foreground/10">
          <LoginForm />
        </div>

        <div className="text-center mt-6 text-sm text-foreground/50">
          <p>&copy; {new Date().getFullYear()} تمام حقوق محفوظ است.</p>
        </div>
      </div>
    </main>
  );
}
