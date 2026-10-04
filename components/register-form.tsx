"use client";

import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function RegisterForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "saved_without_email" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`${API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.detail || "We couldn't submit your request. Please try again or email us.");
      }
      form.reset();
      setState(result.notification_sent ? "sent" : "saved_without_email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  return <form className="register-form" onSubmit={submit}>
    <div className="form-grid">
      <label>Parent or guardian name <span>*</span><input name="parent_name" autoComplete="name" required maxLength={120} /></label>
      <label>Email address <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
      <label>Child’s first name<input name="child_name" maxLength={80} /></label>
      <label>Child’s age <span>*</span><select name="child_age" required defaultValue=""><option value="" disabled>Select age</option><option>2.5</option><option>3</option><option>4</option><option>5</option><option>Other / not yet born</option></select></label>
      <label>Schedule of interest<select name="schedule" defaultValue=""><option value="" disabled>Select a schedule</option><option>2 days — Tuesday & Thursday</option><option>3 days — Monday, Wednesday & Friday</option><option>5 days — Monday through Friday</option><option>Not sure yet</option></select></label>
      <label className="form-wide">What would you like us to know?<textarea name="message" rows={5} maxLength={2000} placeholder="Tell us a little about your child or ask a question." /></label>
      <label className="form-wide checkbox-label"><input name="consent" type="checkbox" required value="yes" /><span>I agree that Mother Nature Academy may contact me about this inquiry. Please do not include sensitive medical or personal information here.</span></label>
      <div className="form-trap" aria-hidden="true"><label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </div>
    <div className="form-submit"><button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send inquiry"}<span aria-hidden="true">↗</span></button><small>We’ll follow up by email or phone. Sending this form is an inquiry, not a confirmed enrollment.</small></div>
    {state === "sent" && <p className="form-success" role="status">Thank you! Your inquiry was saved and the academy was emailed. We’ll be in touch soon.</p>}
    {state === "saved_without_email" && <p className="form-error" role="status">Your inquiry was saved, but the academy’s email notification could not be sent. Please also contact us at <a href="mailto:Laura@MotherNatureAcademy.com">Laura@MotherNatureAcademy.com</a> or call (910) 986-2836.</p>}
    {state === "error" && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
