import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogin, login as loginRequest } from "../api/authApi";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useAuth } from "../hooks/useAuth";

function AuthShell({ title, description, children, footer }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[78rem] items-start px-4 py-4 sm:px-6 sm:py-6 lg:items-center lg:px-8">
        <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="hidden min-w-0 lg:flex">
            <div className="w-full overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
                BTS
              </div>

              <h1 className="mt-4 text-[42px] font-semibold tracking-[-0.05em] text-white">
                Fast rooms. Clean competition. Real app energy.
              </h1>

              <p className="mt-4 max-w-[34rem] text-[15px] leading-7 text-neutral-300">
                Sign in to jump into Battle Trivia, Word Scramble, live standings,
                and your player profile without losing the premium feel of the app.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Rooms
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    Live and social
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Weekly
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    Standings
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Identity
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    Google or BTS
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-stretch lg:items-center">
            <div className="mx-auto w-full max-w-[34rem] min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)] sm:rounded-[32px] sm:p-7 lg:max-w-none">
              <div className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70">
                BTS account
              </div>
              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
                {title}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-neutral-400 sm:text-[15px]">
                {description}
              </p>

              <div className="mt-6 min-w-0">{children}</div>

              <div className="mt-5">{footer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await loginRequest({
        emailOrUsername: form.emailOrUsername.trim(),
        password: form.password,
      });

      login(data, "local");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setError("");
    setIsSubmitting(true);

    try {
      const data = await googleLogin(credential);
      login(data, "google");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your BTS account or continue with Google to jump straight back into the rooms."
      footer={
        <p className="text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-blue-300 hover:text-blue-200">
            Register
          </Link>
        </p>
      }
    >
      <div className="min-w-0 space-y-5">
        <GoogleAuthButton
          onCredential={handleGoogleLogin}
          disabled={isSubmitting}
          label="Continue with Google"
        />

        <div className="flex min-w-0 items-center gap-3">
          <div className="h-px min-w-0 flex-1 bg-white/10" />
          <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            or sign in with BTS
          </span>
          <div className="h-px min-w-0 flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <div className="min-w-0">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              Email or username
            </label>
            <input
              name="emailOrUsername"
              placeholder="you@example.com or username"
              value={form.emailOrUsername}
              onChange={handleChange}
              disabled={isSubmitting}
              className="block w-full min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/20 disabled:opacity-60"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              disabled={isSubmitting}
              className="block w-full min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/20 disabled:opacity-60"
            />
          </div>

          {error ? (
            <div className="rounded-[16px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}