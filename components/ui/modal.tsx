"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, className, children }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/70 transition-opacity duration-200"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto hide-scrollbar rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-gray-200",
          "p-5 sm:p-6 pt-6 sm:pt-6",
          "animate-in slide-in-from-bottom-2 sm:zoom-in-95 duration-200",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

