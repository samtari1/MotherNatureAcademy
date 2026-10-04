"use client";

import { useEffect, useState } from "react";

const API_BASE = "";
export type SiteDetails = { hours: string; campus_location: string; tuition_2_days: string; tuition_3_days: string; tuition_5_days: string; registration_fee: string; school_year: string };
export const fallbackSiteDetails: SiteDetails = { hours: "Monday–Friday, 9:00 am–12:00 pm", campus_location: "Carthage, North Carolina", tuition_2_days: "$325", tuition_3_days: "$425", tuition_5_days: "$575", registration_fee: "$100", school_year: "2026–2027" };

export function useSiteDetails() {
  const [details, setDetails] = useState<SiteDetails>(fallbackSiteDetails);
  useEffect(() => {
    fetch(`${API_BASE}/api/site-content`)
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) setDetails({ ...fallbackSiteDetails, ...data }); })
      .catch(() => {});
  }, []);
  return details;
}

export function HomeHours() {
  const details = useSiteDetails();
  return <p>{details.hours}<br />{details.campus_location}</p>;
}
