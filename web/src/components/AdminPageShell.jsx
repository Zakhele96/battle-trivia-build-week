export default function AdminPageShell({
  eyebrow = "Admin",
  title,
  description,
  actions = null,
  children,
  maxWidth = "max-w-6xl",
}) {
  return (
    <div className={`px-4 py-8 lg:px-8`}>
      <div className={`mx-auto ${maxWidth}`}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {eyebrow ? (
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {eyebrow}
              </div>
            ) : null}

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
              {title}
            </h1>

            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}