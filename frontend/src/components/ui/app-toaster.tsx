"use client";

import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { Toaster } from "sonner";

/** Colors via `globals.css` (`data-type`). Fixed layout classes for consistent size. */
const toastShell =
  "shopai-toast !box-border !min-h-[4.75rem] !w-[var(--width)] !rounded-2xl !border-0 !px-4 !py-3 !pr-11 !font-sans !shadow-xl";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      expand
      richColors={false}
      closeButton
      duration={3800}
      gap={12}
      offset={20}
      mobileOffset={16}
      visibleToasts={4}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: toastShell,
          title: "!text-sm !font-semibold !leading-5 !text-white",
          description:
            "!mt-0.5 !line-clamp-2 !min-h-[2.5rem] !text-sm !leading-5 !text-white/85",
          actionButton:
            "!rounded-lg !bg-white/15 !text-white !text-xs !font-semibold hover:!bg-white/25",
          cancelButton:
            "!rounded-lg !bg-white/10 !text-white/90 !text-xs !font-medium",
          closeButton: "shopai-toast-close",
          success: toastShell,
          error: toastShell,
          info: toastShell,
          warning: toastShell,
        },
      }}
      icons={{
        success: <CircleCheck className="h-5 w-5 shrink-0 text-white" strokeWidth={2.5} />,
        error: <CircleX className="h-5 w-5 shrink-0 text-white" strokeWidth={2.5} />,
        info: <Info className="h-5 w-5 shrink-0 text-white" strokeWidth={2.5} />,
        warning: <TriangleAlert className="h-5 w-5 shrink-0 text-white" strokeWidth={2.5} />,
      }}
    />
  );
}
