import type { ReactNode } from "react";

// Icons of the social networks (5.11): the footer of the site and the list of socials in the
// admin panel (Загальні налаштування → Футер) draw the same ones. The client chooses a network,
// its icon comes from here; a new network needs an icon here and its name in the backend
// (backend/app/schemas/settings.py, Network).

export type Network = "facebook" | "instagram" | "youtube" | "telegram" | "viber" | "tiktok" | "linkedin";

/** The networks in the order of the list in the admin panel, with their names */
export const NETWORKS: { value: Network; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "telegram", label: "Telegram" },
  { value: "viber", label: "Viber" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
];

export const networkLabel = (network: Network) => NETWORKS.find((n) => n.value === network)?.label ?? network;

const paths: Record<Network, ReactNode> = {
  facebook: <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6v4h3v8h4v-8h3l1-4h-4V6.5c0-.3.2-.5.5-.5H15z" />,
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r=".6" />
    </>
  ),
  telegram: (
    <>
      <path d="M21.5 4.5 2.8 11.6c-.8.3-.8 1.4 0 1.7l4.6 1.6 1.8 5.4c.2.7 1.1.9 1.6.4l2.6-2.5 4.7 3.5c.6.4 1.4.1 1.6-.6L22.7 5.7c.2-.8-.5-1.5-1.2-1.2z" />
      <path d="m7.4 14.9 10.1-6.6-7.3 8.4" />
    </>
  ),
  viber: (
    <>
      <path d="M12 2.8c5.4 0 8.4 2.6 8.4 7.6s-3 7.6-8.4 7.6c-.7 0-1.4 0-2-.1L7 21v-3.6C4.6 16.2 3.6 13.9 3.6 10.4c0-5 3-7.6 8.4-7.6z" />
      <path d="M9.6 7.4c-.7 0-1.3.6-1.1 1.4.6 2.6 2.6 4.6 5.2 5.2.8.2 1.4-.4 1.4-1.1v-.6l-1.7-.8-.8.8c-1-.5-1.8-1.3-2.3-2.3l.8-.8-.8-1.7z" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14.5 3v11.8a3.8 3.8 0 1 1-3.8-3.8" />
      <path d="M14.5 3c.4 2.6 2.4 4.6 5 4.9" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5" />
    </>
  ),
};

/** The icon of a network, in the colour of the text around it */
export function SocialIcon({ network, size = 18 }: { network: Network; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[network]}
    </svg>
  );
}
