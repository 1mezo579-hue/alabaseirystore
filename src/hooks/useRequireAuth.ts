"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./useAuthStore";

type AllowedRole = "admin" | "manager" | "cashier" | "technician";

/**
 * Use this hook in protected pages.
 * Pass `allowedRoles` to restrict access by role.
 * Redirects cashiers and technicians to their respective landing modules if not allowed.
 */
export function useRequireAuth(allowedRoles?: AllowedRole[]) {
  const router = useRouter();
  const { user, isLoggedIn, isChecked, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isChecked) return;

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Role-based access: check if user role is allowed
    if (allowedRoles && user && !allowedRoles.includes(user.role as AllowedRole)) {
      if (user.role === "technician") {
        router.replace("/maintenance");
      } else if (user.role === "cashier") {
        router.replace("/cashier");
      } else {
        router.replace("/");
      }
    }
  }, [isChecked, isLoggedIn, user, router]);

  return { user, isChecked, isLoggedIn };
}
