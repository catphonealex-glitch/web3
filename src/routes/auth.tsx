import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Mic2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-cta items-center justify-center shadow-neon mb-3">
            <Mic2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="small-caps text-xs text-muted-foreground">Members Only</p>
          <h1 className="font-display text-3xl mt-1">{mode === "signup" ? "Join the studio" : "Welcome back"}</h1>
          <div className="rule-double mt-3 mb-3 max-w-[8rem] mx-auto" />
          <p className="text-sm text-muted-foreground font-serif-italic">
            {mode === "signup" ? "Create your DubStage account" : "Sign in to continue"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 paper rounded-sm p-6">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-muted-foreground small-caps">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                placeholder="VoxMaster"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground small-caps">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground small-caps">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-cta text-primary-foreground font-medium disabled:opacity-50 shadow-neon"
          >
            {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </form>
      </div>
    </main>
  );
}
