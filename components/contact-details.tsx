"use client";

import { useEffect, useState } from "react";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";

export type ContactInfo = {
  business_name: string;
  physical_street: string;
  physical_city: string;
  physical_state: string;
  physical_postal_code: string;
  mailing_street: string;
  mailing_city: string;
  mailing_state: string;
  mailing_postal_code: string;
  educator_1_name: string;
  educator_1_title: string;
  educator_1_phone: string;
  educator_1_email: string;
  educator_2_name: string;
  educator_2_title: string;
  educator_2_phone: string;
  educator_2_email: string;
};

export const initialContactInfo: ContactInfo = {
  business_name: "Mother Nature Academy LLC",
  physical_street: "148 Hill Lane", physical_city: "Carthage", physical_state: "NC", physical_postal_code: "28327",
  mailing_street: "PO Box 2597", mailing_city: "Southern Pines", mailing_state: "NC", mailing_postal_code: "28388",
  educator_1_name: "Laura Snyder", educator_1_title: "Miss Laura", educator_1_phone: "(910) 986-2836", educator_1_email: "Laura@MotherNatureAcademy.com",
  educator_2_name: "Elise Snyder", educator_2_title: "Miss CC", educator_2_phone: "(910) 975-4541", educator_2_email: "Elise@MotherNatureAcademy.com",
};

export function useContactInfo() {
  const [contact, setContact] = useState<ContactInfo>(initialContactInfo);
  useEffect(() => {
    fetch("/api/contact-info")
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) setContact({ ...initialContactInfo, ...data }); })
      .catch(() => {});
  }, []);
  return contact;
}

function educatorsFrom(contact: ContactInfo) {
  const values = contact as unknown as Record<string, string>;
  return [1, 2].map(index => ({
    name: values[`educator_${index}_name`],
    title: values[`educator_${index}_title`],
    phone: values[`educator_${index}_phone`],
    email: values[`educator_${index}_email`],
  }));
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ContactCards() {
  const contact = useContactInfo();
  return <div className="contact-cards">
    {educatorsFrom(contact).map((educator, index) => <article key={index}><span><Phone/></span><div>
      <h3>{educator.name}{educator.title ? ` · ${educator.title}` : ""}</h3>
      <a href={phoneHref(educator.phone)}>{educator.phone}</a>
      <a href={`mailto:${educator.email}`}>{educator.email}</a>
      <small>Call, text, or email {educator.name.split(" ")[0]}.</small>
    </div></article>)}
    <article><span><MapPin/></span><div><h3>Physical address</h3><p>{contact.physical_street}<br/>{contact.physical_city}, {contact.physical_state} {contact.physical_postal_code}</p><small>Private farm · Visits by appointment.</small></div></article>
    <article><span><Clock3/></span><div><h3>Mailing address</h3><p>{contact.business_name}<br/>{contact.mailing_street}<br/>{contact.mailing_city}, {contact.mailing_state} {contact.mailing_postal_code}</p></div></article>
  </div>;
}

export function FooterContactInfo() {
  const contact = useContactInfo();
  const educators = educatorsFrom(contact);
  return <>
    <p><MapPin size={16} /> {contact.physical_city}, {contact.physical_state}</p>
    {educators.map((educator, index) => <div className="footer-educator" key={index}>
      <p><Phone size={16} /> <a href={phoneHref(educator.phone)}>{educator.title || educator.name} · {educator.phone}</a></p>
      <p><Mail size={16} /> <a href={`mailto:${educator.email}`}>{educator.email}</a></p>
    </div>)}
  </>;
}

export function FooterCopyright() {
  const contact = useContactInfo();
  return <span>© {new Date().getFullYear()} {contact.business_name}</span>;
}

export function RegistrationContactInfo() {
  const contact = useContactInfo();
  return <>{educatorsFrom(contact).map((educator, index) => <div className="registration-contact-person" key={index}>
    <p><Mail size={16}/><a href={`mailto:${educator.email}`}>{educator.email}</a></p>
    <p><Phone size={16}/><a href={phoneHref(educator.phone)}>{educator.title || educator.name} · {educator.phone}</a></p>
  </div>)}</>;
}

export function SavedWithoutEmailMessage({ kind }: { kind: "inquiry" | "application" }) {
  const contact = useContactInfo();
  const label = kind === "inquiry" ? "Your inquiry was saved" : "Your application was saved";
  return <p className="form-error" role="status">{label}, but the academy’s email notification could not be sent. Please contact {educatorsFrom(contact).map((educator, index) => <span key={index}>{index ? " or " : " "}<a href={`mailto:${educator.email}`}>{educator.title || educator.name}</a> at <a href={phoneHref(educator.phone)}>{educator.phone}</a></span>)}.</p>;
}
