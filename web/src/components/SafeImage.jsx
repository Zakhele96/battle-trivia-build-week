import { useState } from "react";

export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  fallbackLabel = "No image",
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={[
          "flex items-center justify-center bg-slate-100 text-xs text-slate-400",
          className,
          fallbackClassName,
        ].join(" ")}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}