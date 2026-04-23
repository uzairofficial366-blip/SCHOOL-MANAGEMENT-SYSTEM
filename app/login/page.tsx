"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", tenantSlug: "", totpCode: "" });
  const [error, setError] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      ...form,
      redirect: false,
    });

    setLoading(false);

    if (res?.error === "MFA_REQUIRED") { setNeedsMfa(true); return; }
    if (res?.error) { setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error); return; }
    if (res?.ok) router.push("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand fade-up">
          <div className="brand-icon">🎓</div>
          <span className="brand-name gradient-text">EduERP</span>
        </div>
        <div className="login-tagline fade-up fade-up-1">
          <h1>Unified Education<br />Management Platform</h1>
          <p>Streamline your institution with AI-powered insights, real-time analytics, and seamless communication.</p>
        </div>
        <div className="login-features fade-up fade-up-2">
          {[
            { icon: "🤖", text: "AI-powered predictive analytics" },
            { icon: "🔒", text: "FERPA & GDPR compliant security" },
            { icon: "📊", text: "Real-time dashboards & reports" },
            { icon: "📱", text: "Mobile-first responsive design" },
          ].map((f) => (
            <div className="feature-pill" key={f.text}>
              <span>{f.icon}</span> {f.text}
            </div>
          ))}
        </div>
        <div className="login-stats fade-up fade-up-3">
          {[["50K+","Students"],["200+","Institutions"],["99.9%","Uptime"]].map(([n,l]) => (
            <div className="login-stat" key={l}>
              <strong>{n}</strong><span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card glass fade-up">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your institution portal</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">School Code</label>
              <input name="tenantSlug" type="text" placeholder="e.g. greenvalley-high"
                className="form-input" value={form.tenantSlug} onChange={handleChange} required autoComplete="organization" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" placeholder="you@school.edu"
                className="form-input" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" placeholder="••••••••"
                className="form-input" value={form.password} onChange={handleChange} required autoComplete="current-password" />
            </div>

            {needsMfa && (
              <div className="form-group fade-up">
                <label className="form-label">Authenticator Code (MFA)</label>
                <input name="totpCode" type="text" placeholder="6-digit code"
                  className="form-input" value={form.totpCode} onChange={handleChange}
                  maxLength={6} pattern="\d{6}" autoComplete="one-time-code" autoFocus />
                <p className="form-hint">Enter the code from your authenticator app</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <span className="loading-spin">⟳</span> : null}
              {loading ? "Signing in…" : needsMfa ? "Verify & Sign In" : "Sign In"}
            </button>
          </form>

          <div className="login-roles">
            <p>Quick demo roles:</p>
            <div className="role-pills">
              {["Admin","Teacher","Student","Parent","Accountant"].map((r) => (
                <span className="role-pill" key={r}>{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, hsl(224 40% 6%), hsl(224 35% 12%));
        }
        .login-left {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          padding: 3rem 4rem; gap: 2rem;
        }
        .login-brand { display: flex; align-items: center; gap: 0.75rem; }
        .brand-icon { font-size: 2.5rem; }
        .brand-name { font-family: var(--font-display); font-size: 2rem; font-weight: 800; }
        .login-tagline h1 {
          font-family: var(--font-display); font-size: 2.8rem; font-weight: 800;
          color: white; line-height: 1.2; margin-bottom: 1rem;
        }
        .login-tagline p { font-size: 1.05rem; color: hsl(0 0% 100% / 0.6); line-height: 1.6; max-width: 420px; }
        .login-features { display: flex; flex-direction: column; gap: 0.6rem; }
        .feature-pill {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: hsl(0 0% 100% / 0.07); border: 1px solid hsl(0 0% 100% / 0.1);
          padding: 0.5rem 1rem; border-radius: 999px;
          font-size: 0.875rem; color: hsl(0 0% 100% / 0.8); width: fit-content;
        }
        .login-stats { display: flex; gap: 2.5rem; margin-top: 0.5rem; }
        .login-stat { display: flex; flex-direction: column; }
        .login-stat strong { font-size: 1.8rem; font-weight: 800; color: white; }
        .login-stat span { font-size: 0.8rem; color: hsl(0 0% 100% / 0.5); }
        .login-right {
          width: 480px; display: flex; align-items: center; justify-content: center;
          padding: 2rem; background: hsl(0 0% 100% / 0.02);
          border-left: 1px solid hsl(0 0% 100% / 0.06);
        }
        .login-card { width: 100%; padding: 2.5rem; border-radius: 1.25rem; }
        .login-header { margin-bottom: 1.75rem; }
        .login-header h2 { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: white; }
        .login-header p { color: hsl(0 0% 100% / 0.5); font-size: 0.9rem; margin-top: 0.25rem; }
        .login-form { display: flex; flex-direction: column; gap: 1.1rem; margin-bottom: 1.5rem; }
        .login-form .form-input { background: hsl(0 0% 100% / 0.07); border-color: hsl(0 0% 100% / 0.12); color: white; }
        .login-form .form-input::placeholder { color: hsl(0 0% 100% / 0.3); }
        .login-form .form-input:focus { border-color: hsl(var(--primary)); background: hsl(0 0% 100% / 0.1); }
        .login-form .form-label { color: hsl(0 0% 100% / 0.8); }
        .form-hint { font-size: 0.76rem; color: hsl(0 0% 100% / 0.4); }
        .w-full { width: 100%; }
        .alert-error {
          background: hsl(var(--danger)/0.15); border: 1px solid hsl(var(--danger)/0.3);
          color: hsl(var(--danger)); padding: 0.75rem 1rem; border-radius: 8px;
          font-size: 0.875rem; margin-bottom: 1rem;
        }
        .login-roles { border-top: 1px solid hsl(0 0% 100% / 0.1); padding-top: 1rem; }
        .login-roles p { font-size: 0.78rem; color: hsl(0 0% 100% / 0.35); margin-bottom: 0.5rem; }
        .role-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .role-pill {
          font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 999px;
          background: hsl(var(--primary)/0.2); color: hsl(var(--primary-light));
          border: 1px solid hsl(var(--primary)/0.25);
        }
        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-right { width: 100%; border-left: none; }
        }
      `}</style>
    </div>
  );
}
