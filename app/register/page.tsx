import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { RegistrationForm } from "@/components/registration-form";
import { Sprout, Mail, Phone } from "lucide-react";

export const metadata: Metadata = { title: "Registration Application" };

export default function RegisterPage() {
  return <>
    <PageIntro eyebrow="ENROLLMENT" title={<>A place to begin<br/><em>something wonderful.</em></>} intro="Use this form to apply for enrollment at Mother Nature Academy. The academy will review your application and contact you about availability and next steps." />
    <section className="register-section"><div className="container register-layout">
      <div className="register-aside"><div className="aside-icon"><Sprout/></div>
        <h2>Let’s get<br/><em>started.</em></h2>
        <p>This is an application, not a confirmed enrollment. The academy will contact you after reviewing the information.</p>
        <div className="aside-contact"><p><Mail size={16}/><a href="mailto:Laura@MotherNatureAcademy.com">Laura@MotherNatureAcademy.com</a></p><p><Phone size={16}/><a href="tel:+19109862836">(910) 986-2836</a></p></div>
        <div className="privacy-note">This form does not ask for medical, medication, allergy, immunization, or payment information. Please do not send those details by email. The academy can follow up directly if needed.</div>
      </div>
      <div className="register-card"><h2>Registration application</h2><p>Fields marked <span>*</span> are required.</p><RegistrationForm/></div>
    </div></section>
  </>;
}
