import ProtectedRoute from "@/app/database/ProtectedRoute";

export const metadata = {
    title: "Setup",
    description: "First time setup of a user's account"
};

export default function UsernameSetupLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
