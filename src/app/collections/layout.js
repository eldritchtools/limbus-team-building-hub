import { Suspense } from "react";

export const metadata = {
    title: "Collections | Limbus Company Team Building Hub",
    description: "Browse collections of content managed by users"
};

export default function CollectionsLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
