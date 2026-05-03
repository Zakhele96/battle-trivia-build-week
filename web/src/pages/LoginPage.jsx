import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  googleLogin,
  login as loginRequest,
  requestLoginCode,
  resendVerification,
  verifyLoginCode,
  verifyEmail,
} from "../api/authApi";
import EmailVerificationPanel from "../components/auth/EmailVerificationPanel";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function AuthShell({ title, description, children, footer, isLight }) {
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`auth-page min-h-screen overflow-x-hidden bg-neutral-950 text-white ${
        isLight ? "auth-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[78rem] items-start px-3 py-[max(0.85rem,env(safe-area-inset-top))] pb-6 sm:px-6 sm:py-6 lg:items-center lg:px-8">
        <div className="grid w-full min-w-0 gap-4 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:hidden">
            <div className="inline-flex rounded-full border border-blue-400/15 bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200/80">
              BTS account
            </div>
            <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.05em] text-white">
              Fast rooms. Clean competition. Real app energy.
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-neutral-300">
              Sign in and get straight back into live rooms, standings, and your profile without cramped mobile overflow.
            </p>
          </div>
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
            <div className="mx-auto w-full max-w-[34rem] min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)] sm:rounded-[32px] sm:p-7 lg:max-w-none">
              <div className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70">
                BTS account
              </div>
              <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
                {title}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-neutral-400 sm:text-[15px]">
                {description}
              </p>

              <div className="mt-5 min-w-0 sm:mt-6">{children}</div>

              <div className="mt-4 sm:mt-5">{footer}</div>
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
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();

  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationOtp, setVerificationOtp] = useState("");
  const [loginMode, setLoginMode] = useState(isIosDevice() ? "code" : "password");
  const [showCodeLoginPanel, setShowCodeLoginPanel] = useState(false);
  const [codeLoginIdentity, setCodeLoginIdentity] = useState("");
  const [codeLoginOtp, setCodeLoginOtp] = useState("");
  const [codeLoginError, setCodeLoginError] = useState("");
  const [codeLoginMessage, setCodeLoginMessage] = useState("");
  const iosDevice = isIosDevice();

  const from = location.state?.from?.pathname || "/";
  const referralQuery = useMemo(() => {
    const ref = searchParams.get("ref");
    if (!ref) return "";

    const params = new URLSearchParams({
      ref,
      source: searchParams.get("source") || "leaderboard-share",
      mode: searchParams.get("mode") || "combined",
      period: searchParams.get("period") || "current",
    });

    return `?${params.toString()}`;
  }, [searchParams]);
  const hasReferral = Boolean(searchParams.get("ref"));

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      const nextError = err?.response?.data;
      if (nextError?.requiresEmailVerification) {
        setShowVerificationPanel(true);
        setVerificationEmail(nextError.email || form.emailOrUsername.trim());
        setVerificationMessage(nextError.message || "Verify your email before logging in.");
        setVerificationError("");
      } else {
        setError(nextError?.message || "Login failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setError("");
    setIsSubmitting(true);

    try {
      const data = await googleLogin({
        idToken: credential,
        referredByUserId: searchParams.get("ref") || null,
        referralSource: searchParams.get("source") || "leaderboard-share",
        referralMode: searchParams.get("mode") || "combined",
        referralPeriod: searchParams.get("period") || "current",
      });
      login(data, "google");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLoginCode = async (event) => {
    event.preventDefault();
    setError("");
    setCodeLoginError("");
    setCodeLoginMessage("");
    setIsSubmitting(true);

    try {
      const data = await requestLoginCode({
        emailOrUsername: form.emailOrUsername.trim(),
      });
      setCodeLoginIdentity(form.emailOrUsername.trim());
      setCodeLoginOtp("");
      setShowCodeLoginPanel(true);
      setCodeLoginMessage(data?.message || "We sent a login code to your email.");
    } catch (err) {
      setCodeLoginError(err?.response?.data?.message || "Could not send a login code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyLoginCode = async (event) => {
    event.preventDefault();
    setCodeLoginError("");
    setCodeLoginMessage("");
    setIsSubmitting(true);

    try {
      const data = await verifyLoginCode({
        emailOrUsername: codeLoginIdentity,
        otp: codeLoginOtp,
      });
      login(data, "local");
      navigate(from, { replace: true });
    } catch (err) {
      setCodeLoginError(err?.response?.data?.message || "Could not verify that login code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setVerificationError("");
    setVerificationMessage("");
    setIsSubmitting(true);

    try {
      const data = await verifyEmail({
        email: verificationEmail,
        otp: verificationOtp,
      });
      login(data, "local");
      navigate(from, { replace: true });
    } catch (err) {
      setVerificationError(
        err?.response?.data?.message || "Could not verify that code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationError("");
    setVerificationMessage("");
    setIsSubmitting(true);

    try {
      const data = await resendVerification({ email: verificationEmail });
      setVerificationMessage(
        data?.message || "A new verification code has been sent."
      );
    } catch (err) {
      setVerificationError(
        err?.response?.data?.message || "Could not resend the verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      isLight={resolvedTheme === "light"}
      title="Welcome back"
      description={
        showVerificationPanel
          ? "Your local account still needs email verification. Enter the code we sent, then you'll be logged straight in."
          : showCodeLoginPanel
            ? "Enter the email code we sent, then BTS will log you straight in."
            : loginMode === "code"
              ? "Sign in with an email code or continue with Google."
              : "Sign in with your BTS account or continue with Google."
      }
      footer={
        <p className="text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            to={`/register${referralQuery}`}
            className="font-medium text-blue-300 hover:text-blue-200"
          >
            Register
          </Link>
        </p>
      }
    >
      <div className="min-w-0 space-y-5">
        {!showVerificationPanel && hasReferral ? (
          <div className="rounded-[18px] border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            You came in through a BTS player invite. Log in if you already have an account, or register to join the challenge.
          </div>
        ) : null}

        {showVerificationPanel ? (
          <>
            <EmailVerificationPanel
              email={verificationEmail}
              otp={verificationOtp}
              onOtpChange={setVerificationOtp}
              onVerify={handleVerifyEmail}
              onResend={handleResendVerification}
              onBack={() => {
                setShowVerificationPanel(false);
                setVerificationError("");
                setVerificationMessage("");
              }}
              isSubmitting={isSubmitting}
              message={verificationMessage}
              error={verificationError}
              title="Verify your email before login"
              description="This BTS account was created with email and password, so it needs one email check first."
            />

            <div className="text-sm text-neutral-500">
              Once the code is accepted, BTS signs you in immediately.
            </div>
          </>
        ) : showCodeLoginPanel ? (
          <>
            <EmailVerificationPanel
              email={codeLoginIdentity}
              otp={codeLoginOtp}
              onOtpChange={setCodeLoginOtp}
              onVerify={handleVerifyLoginCode}
              onResend={async () => {
                setCodeLoginError("");
                setCodeLoginMessage("");
                setIsSubmitting(true);

                try {
                  const data = await requestLoginCode({
                    emailOrUsername: codeLoginIdentity,
                  });
                  setCodeLoginMessage(data?.message || "A fresh login code has been sent.");
                } catch (err) {
                  setCodeLoginError(
                    err?.response?.data?.message || "Could not resend that login code."
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onBack={() => {
                setShowCodeLoginPanel(false);
                setCodeLoginError("");
                setCodeLoginMessage("");
              }}
              isSubmitting={isSubmitting}
              message={codeLoginMessage}
              error={codeLoginError}
              title="Enter your login code"
              description="We sent a 6-digit code to your email. Enter it and BTS will sign you in."
              submitLabel="Sign in with code"
            />

            <div className="text-sm text-neutral-500">
              This works for iPhone-friendly passwordless accounts too.
            </div>
          </>
        ) : (
          <>
            <GoogleAuthButton
              onCredential={handleGoogleLogin}
              disabled={isSubmitting}
              label="Continue with Google"
            />

            <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setLoginMode("password")}
                className={`rounded-[14px] px-3 py-2 text-sm font-semibold transition ${
                  loginMode === "password"
                    ? "bg-blue-600 text-white"
                    : "text-neutral-300 hover:bg-white/[0.04]"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("code")}
                className={`rounded-[14px] px-3 py-2 text-sm font-semibold transition ${
                  loginMode === "code"
                    ? "bg-blue-600 text-white"
                    : "text-neutral-300 hover:bg-white/[0.04]"
                }`}
              >
                Email code
              </button>
            </div>

            {iosDevice && loginMode === "code" ? (
              <div className="rounded-[18px] border border-blue-400/18 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                iPhone sign-in can use a one-time email code instead of a saved password.
              </div>
            ) : null}

            <div className="flex min-w-0 items-center gap-3">
              <div className="h-px min-w-0 flex-1 bg-white/10" />
              <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                {loginMode === "code" ? "or get a login code" : "or sign in with BTS"}
              </span>
              <div className="h-px min-w-0 flex-1 bg-white/10" />
            </div>

            <form
              onSubmit={loginMode === "code" ? handleRequestLoginCode : handleSubmit}
              autoComplete={loginMode === "code" ? "off" : "on"}
              className="min-w-0 space-y-4"
            >
              <div className="min-w-0">
                <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Email or username
                </label>
                <input
                  name="emailOrUsername"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="you@example.com or username"
                  value={form.emailOrUsername}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="block w-full min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/20 disabled:opacity-60"
                />
              </div>

              {loginMode === "password" ? (
                <div className="min-w-0">
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="block w-full min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/20 disabled:opacity-60"
                  />
                </div>
              ) : (
                <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
                  BTS will email a 6-digit code to the address on this local account.
                </div>
              )}

              {(loginMode === "code" ? codeLoginError : error) ? (
                <div className="rounded-[16px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
                  {loginMode === "code" ? codeLoginError : error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? loginMode === "code"
                    ? "Sending code..."
                    : "Logging in..."
                  : loginMode === "code"
                    ? "Send login code"
                    : "Login"}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}
