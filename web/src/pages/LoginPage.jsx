import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogin, login as loginRequest } from "../api/authApi";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useAuth } from "../hooks/useAuth";

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

      login(data);
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
      login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-white">Login</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Sign in to enter the BTS rooms.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="emailOrUsername"
            placeholder="Email or username"
            value={form.emailOrUsername}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            or
          </span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <GoogleAuthButton
          onCredential={handleGoogleLogin}
          disabled={isSubmitting}
        />

        <p className="mt-4 text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}