import ProtectedRoute from "@/app/database/ProtectedRoute";

export const metadata = {
    title: "New Team Build | Limbus Company Team Building Hub",
    description: "Create a new team build"
};

export default function NewBuildLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
