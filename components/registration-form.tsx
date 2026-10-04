"use client";

import { FormEvent, useState } from "react";
import { useSiteDetails } from "@/components/public-site-details";

const REGISTRATION_URL = "/api/registrations";

export function RegistrationForm() {
  const siteDetails = useSiteDetails();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "saved_without_email" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(REGISTRATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "We couldn't submit the application. Please try again or contact the academy.");
      form.reset();
      setState(result.notification_sent ? "sent" : "saved_without_email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  return <form className="register-form" onSubmit={submit}>
    <div className="form-grid">
      <label className="form-wide">Applying for school year <span>*</span><select name="school_year" required value={siteDetails.school_year} onChange={() => {}}><option value={siteDetails.school_year}>{siteDetails.school_year}</option></select></label>
      <label>Child’s full name <span>*</span><input name="child_name" required maxLength={120} autoComplete="off" /></label>
      <label>Nickname<input name="child_nickname" maxLength={80} /></label>
      <label>Child’s age <span>*</span><select name="child_age" required defaultValue=""><option value="" disabled>Select age</option><option>2.5</option><option>3</option><option>4</option><option>5</option><option>Other / not yet born</option></select></label>
      <label>Date of birth <span>*</span><input name="child_date_of_birth" type="date" required /></label>
      <label>Child lives with <span>*</span><select name="lives_with" required defaultValue=""><option value="" disabled>Select one</option><option>Mother</option><option>Father</option><option>Both parents</option><option>Other</option></select></label>
      <label>Schedule <span>*</span><select name="schedule" required defaultValue=""><option value="" disabled>Select a schedule</option><option value="2_days">2 days — Tuesday & Thursday — $325/month</option><option value="3_days">3 days — Monday, Wednesday & Friday — $425/month</option><option value="5_days">5 days — Monday through Friday — $575/month</option></select></label>
      <p className="form-wide registration-copy">The current registration fee is {siteDetails.registration_fee}. Enrollment is confirmed by the academy after review. Please confirm current fees and availability with the academy.</p>

      <h3 className="form-section-title form-wide">Responsible party</h3>
      <label>Full name <span>*</span><input name="guardian_name" required maxLength={120} autoComplete="name" /></label>
      <label>Relationship to child <span>*</span><input name="guardian_relationship" required maxLength={80} /></label>
      <label className="form-wide">Street address <span>*</span><input name="address" required maxLength={200} autoComplete="street-address" /></label>
      <label>City <span>*</span><input name="city" required maxLength={100} autoComplete="address-level2" /></label>
      <label>State <span>*</span><input name="state" required maxLength={2} minLength={2} defaultValue="NC" autoComplete="address-level1" /></label>
      <label>ZIP code <span>*</span><input name="postal_code" required maxLength={20} autoComplete="postal-code" /></label>
      <label>Cell phone <span>*</span><input name="cell_phone" type="tel" required maxLength={40} autoComplete="tel" /></label>
      <label>Home phone<input name="home_phone" type="tel" maxLength={40} /></label>
      <label>Work phone<input name="work_phone" type="tel" maxLength={40} /></label>
      <label className="form-wide">Email address <span>*</span><input name="guardian_email" type="email" required maxLength={254} autoComplete="email" /></label>

      <h3 className="form-section-title form-wide">Second responsible party <small>(optional)</small></h3>
      <label>Full name<input name="second_guardian_name" maxLength={120} /></label>
      <label>Relationship to child<input name="second_guardian_relationship" maxLength={80} /></label>
      <label>Phone<input name="second_guardian_phone" type="tel" maxLength={40} /></label>
      <label>Email<input name="second_guardian_email" type="email" maxLength={254} /></label>

      <p className="form-wide registration-copy">Do not enter medical conditions, disabilities, fears, medications, allergies, immunization information, or payment details here. The academy can arrange a direct follow-up for information needed after an initial application.</p>
      <label className="form-wide checkbox-label"><input name="accuracy_confirmed" type="checkbox" required value="yes" /><span>I confirm that the information above is accurate to the best of my knowledge.</span></label>
      <label className="form-wide checkbox-label"><input name="application_acknowledged" type="checkbox" required value="yes" /><span>I understand this is an application and does not guarantee enrollment. The academy will contact me about acceptance and next steps.</span></label>
      <label className="form-wide">Typed parent or guardian signature <span>*</span><input name="signature" required maxLength={120} autoComplete="name" /></label>
      <div className="form-trap" aria-hidden="true"><label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </div>
    <div className="form-submit"><button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Submitting…" : "Submit application"}<span aria-hidden="true">↗</span></button><small>The academy will review the application and follow up. Submission is not confirmed enrollment.</small></div>
    {state === "sent" && <p className="form-success" role="status">Your application was submitted and an email notification was sent to the academy. The academy will follow up about next steps.</p>}
    {state === "saved_without_email" && <p className="form-error" role="status">Your application was saved, but the email notification could not be sent. Please contact <a href="mailto:Laura@MotherNatureAcademy.com">Laura</a> at (910) 986-2836 or <a href="mailto:Elise@MotherNatureAcademy.com">Elise</a> at (910) 975-4541.</p>}
    {state === "error" && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
