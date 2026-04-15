import { useMemo } from "react";
import { SITE_CONFIG } from "../config/siteConfig";
import { trackEvent } from "../api/analyticsApi";

export default function FloatingWhatsAppButton() {
  const phone =
    SITE_CONFIG?.whatsapp?.number ||
    SITE_CONFIG?.whatsappNumber ||
    "27679208446";

  const message =
    SITE_CONFIG?.whatsapp?.defaultMessage ||
    "Hello, I would like more information from Sivubela Intuthuko.";

  const whatsappUrl = useMemo(() => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }, [phone, message]);

  if (!phone) return null;

  return (
   <a
    href={whatsappUrl}
    target="_blank"
    rel="noreferrer"
    aria-label="Chat with us on WhatsApp"
    onClick={() =>
        trackEvent({
        eventName: "whatsapp_click",
        pageType: "contact",
        label: "floating_whatsapp_button",
        })
    }
    className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-3 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg transition hover:bg-green-600 sm:bottom-6 sm:right-6"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .18 5.32.18 11.88c0 2.1.55 4.15 1.6 5.96L0 24l6.34-1.66a11.82 11.82 0 0 0 5.72 1.47h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.14-3.43-8.45ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.99 1-3.67-.23-.38a9.86 9.86 0 0 1-1.52-5.27c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.13 1.03 6.99 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.89 9.9Zm5.44-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </span>

      <span className="hidden text-sm font-semibold sm:inline">
        Chat on WhatsApp
      </span>
    </a>
  );
}