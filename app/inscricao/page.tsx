import type { Metadata } from "next";
import Signup from "./Signup";

export const metadata: Metadata = { title: "Quero meu lugar à mesa" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return <Signup refCode={(ref || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)} />;
}
