"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootIndex() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect base route / directly to /dashboard
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ color: "#718096", fontFamily: "sans-serif", padding: "40px" }}>
      Redirecting to DIIP Hub...
    </div>
  );
}
