import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
}) {
  return (
    <div className="border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
        {description}
      </p>

      {(primaryAction || secondaryAction) ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {primaryAction ? (
            primaryAction.to ? (
              <Link
                to={primaryAction.to}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {primaryAction.label}
              </button>
            )
          ) : null}

          {secondaryAction ? (
            secondaryAction.to ? (
              <Link
                to={secondaryAction.to}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                {secondaryAction.label}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}