import { Suspense } from "react";

export const metadata = {
    title: "My Profile | Limbus Company Team Building Hub",
    description: "View the user's builds or edit details"
};

export default function ProfileLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}