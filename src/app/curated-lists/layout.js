import { Suspense } from "react";

export const metadata = {
    title: "Curated Lists | Limbus Company Team Building Hub",
    description: "Browse lists of builds curated by users"
};

export default function CuratedListsLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
