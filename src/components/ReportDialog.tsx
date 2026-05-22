import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type ReportTarget = { type: "comment" | "project" | "profile"; id: string } | null;

interface Props {
  target: ReportTarget;
  onClose: () => void;
}

export function ReportDialog({ target, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (!target) return;
    const r = reason.trim();
    if (!r) return toast.error("Please describe the issue.");
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: target.type,
      target_id: target.id,
      reason: r,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reported. Mods will review.");
    setReason("");
    onClose();
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && (setReason(""), onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display inline-flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report {target?.type}
          </DialogTitle>
          <div className="rule-double mt-2" />
          <DialogDescription className="pt-2 small-caps text-xs">
            Tell our moderators what's wrong. False reports may be acted on.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          autoFocus
          placeholder="Describe the issue (spam, harassment, copyright, etc.)"
          className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary text-sm"
        />
        <DialogFooter>
          <button
            type="button"
            onClick={() => { setReason(""); onClose(); }}
            className="px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !reason.trim()}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium disabled:opacity-50 text-sm inline-flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            {busy ? "Sending…" : "Submit report"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
