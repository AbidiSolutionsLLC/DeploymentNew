import { useSearchParams } from "react-router-dom";

/**
 * PROTOTYPE — variant switcher for the Project Portal UI redesign.
 * Plan: three structurally different portal designs (A / B / C) mounted on the
 * existing /project/* routes, selectable via `?variant=`. The current UI stays
 * the default so nothing changes when the param is absent.
 *
 * The chosen variant is mirrored to sessionStorage so it survives sidebar
 * navigation (react-router links don't carry search params).
 */

export const VARIANTS = [
  { key: "current", code: "0", name: "Current UI" },
  { key: "a", code: "A", name: "Command Center" },
  { key: "b", code: "B", name: "Split Workspace" },
  { key: "c", code: "C", name: "Board & Metrics" },
];

const STORAGE_KEY = "portal-prototype-variant";

export function useVariant() {
  const [searchParams, setSearchParams] = useSearchParams();

  const fromUrl = searchParams.get("variant");
  const raw = (fromUrl || sessionStorage.getItem(STORAGE_KEY) || "current").toLowerCase();
  const index = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === raw)
  );
  const current = VARIANTS[index];

  const step = (dir) => {
    const next = VARIANTS[(index + dir + VARIANTS.length) % VARIANTS.length];
    sessionStorage.setItem(STORAGE_KEY, next.key);
    const params = new URLSearchParams(searchParams);
    params.set("variant", next.key);
    setSearchParams(params, { replace: true });
  };

  return { variant: current.key, meta: current, step };
}

export default useVariant;
