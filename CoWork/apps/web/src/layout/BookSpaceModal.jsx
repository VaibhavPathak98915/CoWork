import { useCallback, useEffect, useState } from "react";
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

export default function BookSpaceModal({ open, onClose, onBooked, initialSpaceId = null }) {
  const [spaces, setSpaces] = useState([]);
  const [spacesError, setSpacesError] = useState("");
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const { plans, error: plansError, loading: loadingPlans, refresh: refreshPlans } = usePlans();
  const [form, setForm] = useState({ spaceId: "", plan: "", duration: DURATIONS[2], startsOn: todayStr(), seats: 1 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadSpaces = useCallback(async () => {
    setLoadingSpaces(true);
    setSpacesError("");
    try {
      const { spaces } = await api.spaces();
      setSpaces(spaces);
      if (spaces[0]) setForm((f) => ({ ...f, spaceId: f.spaceId || spaces[0].id }));
    } catch (e) {
      setSpacesError(e.message);
      setSpaces([]);
    } finally {
      setLoadingSpaces(false);
    }
  }, []);

  // Load the catalog when the modal first opens, not on mount — no point paying
  // for it on every page view. A previous failure leaves the list empty, so
  // re-opening retries.
  useEffect(() => {
    if (!open || spaces.length) return;
    loadSpaces();
  }, [open, spaces.length, loadSpaces]);

  useEffect(() => { if (open) setErr(""); }, [open]);

  // Opened from a Spaces card: select that space rather than the first one.
  useEffect(() => {
    if (open && initialSpaceId) set("spaceId", initialSpaceId);
  }, [open, initialSpaceId]);

  const catalogError = spacesError || plansError;
  const retryCatalog = () => { loadSpaces(); refreshPlans(); };
  const catalogReady = spaces.length > 0 && Boolean(plans?.length);

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
  // seatsFree is null when the bookings service is unreachable; fall back to
  // capacity rather than blocking the field entirely.
  const maxSeats = selected ? selected.seatsFree ?? selected.capacity : 50;

  return (
    <Modal open={open} onClose={onClose} title="Book a Space">
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Space Type</label>
        <select
          value={form.spaceId}
          onChange={(e) => set("spaceId", e.target.value)}
          style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}}>
          {spaces.length === 0 && (
            <option value="">
              {loadingSpaces ? "Loading spaces…" : spacesError ? "Couldn't load spaces" : "No spaces available"}
            </option>
          )}
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name} — {s.seatsFree == null ? `${s.capacity} seats` : `${s.seatsFree} of ${s.capacity} free`}
            </option>
          ))}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Date" type="date" min={todayStr()} value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)}/>
        <Select label="Duration" options={DURATIONS} value={form.duration} onChange={(e) => set("duration", e.target.value)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:".55fr 1.45fr",gap:12}}>
        <Input
          label="Seats" type="number" min={1} max={maxSeats}
          value={form.seats} onChange={(e) => set("seats", e.target.value)}/>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>Plan</label>
          <select value={form.plan} onChange={(e) => set("plan", e.target.value)}
            style={{width:"100%",padding:"11px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}}>
            {!plans?.length && (
              <option value="">
                {loadingPlans ? "Loading plans…" : plansError ? "Couldn't load plans" : "No plans available"}
              </option>
            )}
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.name}>{p.name} – {formatINR(p.price)}/{shortPeriod(p.period)}</option>
            ))}
          </select>
        </div>
      </div>

      {catalogError && (
        <div style={{padding:"10px 14px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,fontSize:13,color:"var(--red)",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span>⚠ {catalogError}</span>
          <Btn variant="ghost" style={{fontSize:12,padding:"6px 14px"}} onClick={retryCatalog}>Retry</Btn>
        </div>
      )}

      {err && (
        <div style={{padding:"10px 14px",background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:8,fontSize:13,color:"var(--red)",marginBottom:14}}>
          ⚠ {err}
        </div>
      )}

      <Btn
        variant="primary"
        disabled={saving || !catalogReady}
        style={{width:"100%",textAlign:"center",padding:13,fontSize:14,marginTop:4,
          opacity:(saving || !catalogReady)?.5:1,
          cursor:(saving || !catalogReady)?"not-allowed":"pointer"}}
        onClick={submit}>
        {saving ? "Booking…" : catalogError ? "Unavailable" : "Confirm Booking →"}
      </Btn>
    </Modal>
  );
}
