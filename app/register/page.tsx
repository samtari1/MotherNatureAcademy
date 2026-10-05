import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { RegistrationForm } from "@/components/registration-form";
import { Sprout } from "lucide-react";
import { RegistrationContactInfo } from "@/components/contact-details";

export const metadata: Metadata = { title: "Registration Application" };

export default function RegisterPage() {
  return <>
    <PageIntro eyebrow="ENROLLMENT" title={<>A place to begin<br/><em>something wonderful.</em></>} intro="Use this form to apply for enrollment at Mother Nature Academy. The academy will review your application and contact you about availability and next steps." />
    <section className="register-section"><div className="container register-layout">
      <div className="register-aside"><div className="aside-icon"><Sprout/></div>
        <h2>Let’s get<br/><em>started.</em></h2>
        <p>This is an application, not a confirmed enrollment. The academy will contact you after reviewing the information.</p>
        <div className="aside-contact"><RegistrationContactInfo /></div>
        <div className="privacy-note">Health details entered in the application are encrypted in the database and shown only in the signed-in admin area. They are not included in email notifications. Do not enter debit-card, bank-account, or insurance numbers.</div>
      </div>
      <div className="register-card"><h2>Registration application</h2><p>Fields marked <span>*</span> are required.</p><RegistrationForm/></div>
    </div></section>
  </>;
}
