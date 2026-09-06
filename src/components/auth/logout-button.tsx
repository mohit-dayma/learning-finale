"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
    setPending(false);
  }

  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={pending}>
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
