import { useParams } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function PublicTracking() {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (token) {
      // Record the click
      const recordClickMutation = trpc.tracking.recordClick.useMutation();
      recordClickMutation.mutate({
        token,
        userAgent: navigator.userAgent,
        referer: document.referrer,
      });
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold neon-pink mb-4">CLICK RECORDED</h1>
        <p className="text-lg neon-cyan mb-8">Redirecting to awareness page...</p>
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary border-t-secondary rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
