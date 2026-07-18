"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
};

export default function Modal({ titulo, aoFechar, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={aoFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            onClick={aoFechar}
            className="text-black/50 dark:text-white/50 hover:text-marca-vermelho"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
