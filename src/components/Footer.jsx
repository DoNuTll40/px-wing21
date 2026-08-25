import { ExternalLink } from "lucide-react";

const app_version = import.meta.env.VITE_APP_VERSION || "1.0.0";

export default function Footer({ title = "PX Daily Report System" }) {
  const formattedVersion = app_version.startsWith("v")
    ? app_version
    : `v${app_version}`;

  return (
    <footer className="mt-6 mb-2 text-center text-xs text-gray-400 font-mono select-none space-y-0.5">
      <p className="flex items-center justify-center gap-1.5 flex-wrap">
        <span>{title}</span>
        <span className="text-gray-500">{formattedVersion}</span>
      </p>
      <p className="text-[11px] text-gray-400">
        &copy; {new Date().getFullYear()} Developed by{" "}
        <a
          href="https://github.com/DoNuTll40"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-amber-500 hover:text-amber-400 transition-colors"
        >
          <span>Nuttawoot Chaowna</span>
          <ExternalLink className="w-2.5 h-2.5 stroke-[2.5]" />
        </a>
      </p>
    </footer>
  );
}