import { useEffect, useState } from "react";
import { Btn, Input, Select } from "../components/ui.jsx";
import Modal from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { usePlans } from "../hooks/usePlans.js";
import { formatINR, shortPeriod } from "../lib/format.js";
import { createBookingSchema, DURATIONS } from "@cowork/shared/schemas";
import { localDate } from "@cowork/shared/dates";

// localDate comes from the shared package, so the browser and the bookings
// service agree on which day "today" is.
const todayStr = localDate;

export default function BookSpaceModal({ open, onClose, onBooked }) {
  const [spaces, setSpaces] = useState([]);
  const { plans } = usePlans();
  const [form, setForm] = useState({ spaceId: "", plan: "", duration: DURATIONS[2], startsOn: todayStr(), seats: 1 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load the catalog when the modal first opens, not on mount — no point paying
  // for it on every page view.
  useEffect(() => {
    if (!open || spaces.length) return;
    api.spaces()
      .then(({ spaces }) => {
        setSpaces(spaces);
        if (spaces[0]) set("spaceId", spaces[0].id);
      })
      .catch((e) => setErr(e.message));
  }, [open, spaces.length]);

  useEffect(() => { if (open) setErr(""); }, [open]);

  // Default to the featured plan once the catalog arrives.
  useEffect(() => {
    if (!form.plan && plans?.length) set("plan", (plans.find((p) => p.featured) ?? plans[0]).name);
  }, [plans, form.plan]);

  const submit = async () => {
    setErr("");
    const payload = { ...form, seats: Number(form.seats) };

    // The server's own schema, run in the browser: one source of truth for the
    // rules, and the user sees the identical message without a round trip.
    const parsed = createBookingSchema.safeParse(payload);
    if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }

    setSaving(true);
    try {
      const { booking } = await api.createBooking(parsed.data);
      onBooked(booking);
      onClose();
    } catch (e) {
      // Stay open on failure: closing would throw away what they typed.
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selected = spaces.find((s) => s.id === form.spaceId);

  return (
    <Modal open={open} onClose={onClose} title="Book a Space">
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Space Type</label>
        <select
          value={form.spaceId}
          onChange={(e) => set("spaceId", e.target.value)}
          style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}}>
          {spaces.length === 0 && <option value="">Loading spaces…</option>}
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name} — {s.type} ({s.capacity} seats)</option>
          ))}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Date" type="date" min={todayStr()} value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)}/>
        <Select label="Duration" options={DURATIONS} value={form.duration} onChange={(e) => set("duration", e.target.value)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:".55fr 1.45fr",gap:12}}>
        <Input
          label="Seats" type="number" min={1} max={selected?.capacity ?? 50}
          value={form.seats} onChange={(e) => set("seats", e.target.value)}/>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Plan</label>
          <select value={form.plan} onChange={(e) => set("plan", e.target.value)}
            style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}}>
            {!plans && <option value="">Loading plans…</option>}
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.name}>{p.name} – {formatINR(p.price)}/{shortPeriod(p.period)}</option>
            ))}
          </select>
        </div>
      </div>

      {err && (
        <div style={{padding:"10px 14px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,fontSize:13,color:"var(--red)",marginBottom:14}}>
          ⚠ {err}
        </div>
      )}

      <Btn
        variant="primary"
        disabled={saving}
        style={{width:"100%",textAlign:"center",padding:13,fontSize:14,marginTop:4,opacity:saving?.7:1}}
        onClick={submit}>
        {saving ? "Booking…" : "Confirm Booking →"}
      </Btn>
    </Modal>
  );
}
