import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PublicPolicies } from "@/components/public-policies";

export const metadata: Metadata = { title: "Policies & Family Handbook" };

export default function PoliciesPage() {
  return <><PageIntro eyebrow="FAMILY INFORMATION" title={<>A little more about<br/><em>how we care.</em></>} intro="A practical overview of outdoor learning and family policies at Mother Nature Academy." /><PublicPolicies /></>;
}
