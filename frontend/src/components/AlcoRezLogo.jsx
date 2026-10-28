import React from 'react';

/**
 * AlcoRez Logo Icon Mark (The Exact "AR" Geometric Monogram with Carved Bottle Silhouette)
 * Exact metallic champagne gold finish, bottle center silhouette, and warm amber backlight.
 */
export function AlcoRezIcon({ className = "h-10 w-auto" }) {
  return (
    <img
      src="/alcorez_logo.png"
      alt="AlcoRez"
      className={`object-contain rounded-lg select-none ${className}`}
      loading="eager"
    />
  );
}

/**
 * AlcoRez Full Brand Lockup with Title and Description
 */
export function AlcoRezBrandLockup({ subtitle = "Reserve. Verify. Collect." }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="group-hover:scale-105 transition-transform duration-200 shrink-0">
        <AlcoRezIcon className="h-10 w-auto" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center text-xl tracking-tight leading-none">
          <span className="text-amber-800 dark:text-amber-400 font-black">Alco</span>
          <span className="text-stone-900 dark:text-stone-100 font-extrabold">Rez</span>
        </div>
        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

export default AlcoRezIcon;
