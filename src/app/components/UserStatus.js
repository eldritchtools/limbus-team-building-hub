import "./UserStatus.css";
import { useAuth } from "../database/authProvider";
import { useRouter } from "next/navigation";

function UserStatus() {
    const { user, profile, logout } = useAuth();
    const router = useRouter();

    return <div style={{ padding: "0.5rem", paddingLeft: "1rem", borderBottom: "1px #444 solid", fontSize: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            Welcome, {profile ? profile.username : "Guest"}!
            {user ? 
                <button onClick={() => logout()} className="log-in-out">Logout</button> : 
                <button onClick={() => router.push("/login")} className="log-in-out">Login</button> 
            }
        </div>
    </div>

}

export default UserStatus;
