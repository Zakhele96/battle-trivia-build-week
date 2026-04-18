import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, register as registerRequest } from "../api/authApi";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await registerRequest({
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });

      login(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Google sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-white">Register</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Create your account to join the BTS rooms.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          <input
            name="displayName"
            placeholder="Display name"
            value={form.displayName}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
          />

          <input
            name="phoneNumber"
            placeholder="Phone number"
            value={form.phoneNumber}
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
            {isSubmitting ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}