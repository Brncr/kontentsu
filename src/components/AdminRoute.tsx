import { Navigate } from "react-router-dom";

const ADMIN_SESSION_KEY = "kontentsu_admin_session";

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "authenticated";
}

export function setAdminAuthenticated(username: string, password: string) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
  sessionStorage.setItem("kontentsu_admin_creds", JSON.stringify({ username, password }));
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem("kontentsu_admin_creds");
}

// Admin credentials (hashed comparison would be ideal for production)
export const ADMIN_USERS = [
  { username: "brncrysis", password: "123456" },
  { username: "nenesk", password: "123456" },
];

export function validateAdmin(username: string, password: string): boolean {
  return ADMIN_USERS.some(
    (u) => u.username === username && u.password === password
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
