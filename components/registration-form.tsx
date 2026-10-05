"use client";

import { FormEvent, useState } from "react";
import { useSiteDetails } from "@/components/public-site-details";
import { SavedWithoutEmailMessage, useContactInfo } from "@/components/contact-details";

const REGISTRATION_URL = "/api/registrations";

export function RegistrationForm() {
  const siteDetails = useSiteDetails();
  const contactInfo = useContactInfo();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "saved_without_email" | "error">("idle");
  const [immunizationStatus, setImmunizationStatus] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const payload: Record<string, unknown> = { ...data };
      const allergies = Array.from({ length: 3 }, (_, index) => {
        const allergenKey = `allergen_${index + 1}`;
        const reactionKey = `reaction_${index + 1}`;
        const allergen = String(data[allergenKey] ?? "").trim();
        const reaction = String(data[reactionKey] ?? "").trim();
        delete payload[allergenKey];
        delete payload[reactionKey];
        if (Boolean(allergen) !== Boolean(reaction)) throw new Error(`Please provide both an allergen and its reaction for allergy ${index + 1}, or leave both fields blank.`);
        return allergen && reaction ? { allergen, reaction } : null;
      }).filter((entry): entry is { allergen: string; reaction: string } => entry !== null);
      payload.allergies = allergies;
      const response = await fetch(REGISTRATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "We couldn't submit the application. Please try again or contact the academy.");
      form.reset();
      setImmunizationStatus("");
      setState(result.notification_sent ? "sent" : "saved_without_email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  return <form className="register-form" onSubmit={submit}>
    <div className="form-grid">
      <h3 className="form-section-title form-wide registration-page-title">Page 1 · Child & family details</h3>
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

      <h3 className="form-section-title form-wide registration-page-title">Page 2 · Health information & agreements</h3>
      <p className="form-wide registration-copy">Please share information the educators need to understand your child’s needs. Health details are encrypted in the application database, available only to signed-in academy administrators, and are not included in email notifications. Do not enter insurance, debit-card, or bank-account numbers.</p>
      <label className="form-wide">Medical conditions, disabilities, or debilitating fears<textarea name="medical_conditions" rows={4} maxLength={5000} /></label>
      <label className="form-wide">Medications your child is taking<textarea name="medications" rows={3} maxLength={5000} /></label>
      <fieldset className="form-wide allergy-fields"><legend>Known allergies and reactions <small>(up to three; leave both fields blank when not applicable)</small></legend>
        <div className="allergy-header"><span>Allergic to</span><span>Reaction</span></div>
        {Array.from({ length: 3 }, (_, index) => <div className="allergy-row" key={index}><label><span className="sr-only">Allergen {index + 1}</span><input name={`allergen_${index + 1}`} maxLength={200} aria-label={`Allergen ${index + 1}`} /></label><label><span className="sr-only">Reaction to allergen {index + 1}</span><input name={`reaction_${index + 1}`} maxLength={300} aria-label={`Reaction to allergen ${index + 1}`} /></label></div>)}
      </fieldset>
      <label>Are your child’s immunizations up to date? <span>*</span><select name="immunizations_up_to_date" required value={immunizationStatus} onChange={event => setImmunizationStatus(event.target.value)}><option value="" disabled>Select one</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <label className="form-wide">If no, please tell us why{immunizationStatus === "no" && <> <span>*</span></>}<textarea name="immunization_explanation" rows={3} maxLength={2000} required={immunizationStatus === "no"} /></label>
      <label className="form-wide">Other considerations you would like the academy to know<textarea name="other_considerations" rows={4} maxLength={5000} /></label>
      <p className="form-wide registration-copy enrollment-terms">Registering does not guarantee enrollment. The academy will review each application individually and discuss whether the program can reasonably support the child’s participation. If accepted, the academy will send a confirmation within one week after receiving this application and the {siteDetails.registration_fee} registration fee. If the academy cannot enroll the child, it will send an explanation and return the registration fee.</p>
      <label className="form-wide">Initial to acknowledge the enrollment terms above <span>*</span><input name="admission_policy_initials" required maxLength={20} autoComplete="off" /></label>
      <p className="form-wide registration-copy registration-mailing">If mailing the registration fee, make it payable to {contactInfo.business_name} and mail it to: {contactInfo.mailing_street}, {contactInfo.mailing_city}, {contactInfo.mailing_state} {contactInfo.mailing_postal_code}. Do not mail cash.</p>
      <label className="form-wide checkbox-label"><input name="payment_terms_acknowledged" type="checkbox" required value="yes" /><span>I agree to the monthly tuition draft terms for the selected schedule. Tuition will be drafted on the 1st of each month. I will provide debit- or credit-card payment details directly to the academy before September 1. This website form does not collect payment account information.</span></label>
      <label className="form-wide checkbox-label"><input name="health_information_consent" type="checkbox" required value="yes" /><span>I authorize the academy to receive and store the child health information I chose to provide in this application. I understand it is encrypted in storage, available to authorized academy administrators, and excluded from email notifications.</span></label>
      <label className="form-wide checkbox-label"><input name="accuracy_confirmed" type="checkbox" required value="yes" /><span>I confirm that the information above is accurate to the best of my knowledge.</span></label>
      <label className="form-wide checkbox-label"><input name="application_acknowledged" type="checkbox" required value="yes" /><span>I understand this is an application and does not guarantee enrollment. The academy will contact me about acceptance and next steps.</span></label>
      <label className="form-wide">Typed parent or guardian signature <span>*</span><input name="signature" required maxLength={120} autoComplete="name" /></label>
      <p className="form-wide registration-copy">Your submission date is recorded automatically and this typed signature applies to the application and acknowledgments above.</p>
      <div className="form-trap" aria-hidden="true"><label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </div>
    <div className="form-submit"><button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Submitting…" : "Submit application"}<span aria-hidden="true">↗</span></button><small>The academy will review the application and follow up. Submission is not confirmed enrollment.</small></div>
    {state === "sent" && <p className="form-success" role="status">Your application was submitted and an email notification was sent to the academy. The academy will follow up about next steps.</p>}
    {state === "saved_without_email" && <SavedWithoutEmailMessage kind="application" />}
    {state === "error" && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
