import ProtectedRoute from "@/app/database/ProtectedRoute";

export const metadata = {
    title: "Edit Team Build | Limbus Company Team Building Hub",
    description: "Edit a team build"
};

export default function EditBuildLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
