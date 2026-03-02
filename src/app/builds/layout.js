import { Suspense } from "react";

export const metadata = {
    title: "Team Builds | Limbus Company Team Building Hub",
    description: "Browse team builds"
};

export default function BuildsLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
