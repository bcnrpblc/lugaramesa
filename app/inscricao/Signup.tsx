"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Flow, { type Step, type Values } from "@/components/Flow";
import { codeStatus, emailStatus, submitSignup } from "./actions";

const hasHealth = (v: Values) => ((v.allergies as string[]) || []).some((a) => a !== "nenhuma") || !!(v.allergy_notes as string)?.trim();

const RANGE3 = [
  { value: "0", label: "Nenhuma" },
  { value: "1", label: "1 vez" },
  { value: "2-3", label: "2 ou 3 vezes" },
  { value: "4+", label: "4 ou mais" },
];

const STEPS: Step[] = [
  { id: "email", kind: "email", title: "Qual é o seu e-mail?", help: "É por ele que a gente te reconhece. Nada de spam.", placeholder: "voce@email.com",
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim()) ? null : "Confere o e-mail?"),
    check: async (v) => {
      const s = await emailStatus(String(v));
      return s === "exists" ? "Esse e-mail já está na lista. Quando abrir uma mesa pra você, a mensagem chega." : s === "invalid" ? "Confere o e-mail?" : null;
    } },
  { id: "name", kind: "text", title: "Como podemos te chamar?", placeholder: "Seu nome", maxLength: 80 },
  { id: "whatsapp", kind: "tel", title: "Seu WhatsApp", help: "O convite chega por lá, 2 a 3 semanas antes do jantar.", placeholder: "(11) 98765-4321",
    validate: (v) => (String(v || "").replace(/\D/g, "").length >= 10 ? null : "Coloca o número com DDD.") },
  { id: "age_range", kind: "single", title: "Sua faixa de idade", help: "Ajuda a montar mesas misturadas.", options: [
    { value: "18-24", label: "18 a 24" }, { value: "25-34", label: "25 a 34" }, { value: "35-44", label: "35 a 44" }, { value: "45-54", label: "45 a 54" }, { value: "55+", label: "55 ou mais" } ] },
  { id: "life_stage", kind: "single", title: "Em que momento da vida você está?", options: [
    { value: "solteiro", label: "Solteiro(a)" }, { value: "namorando", label: "Namorando" }, { value: "casado", label: "Casado(a), sem filhos" },
    { value: "casado-filhos", label: "Com filhos" }, { value: "outro", label: "Outro / prefiro não dizer" } ] },
  { id: "allergies", kind: "multi", title: "Alguma alergia ou restrição alimentar?", help: "Usado só para pensar o cardápio. Fica só com o anfitrião.",
    options: [
      { value: "nenhuma", label: "Nenhuma", exclusive: true }, { value: "lactose", label: "Lactose" }, { value: "gluten", label: "Glúten" },
      { value: "frutos-do-mar", label: "Frutos do mar" }, { value: "castanhas", label: "Amendoim ou castanhas" }, { value: "ovo", label: "Ovo" },
      { value: "vegetariano", label: "Vegetariano(a)" }, { value: "vegano", label: "Vegano(a)" }, { value: "outra", label: "Outra" } ],
    notesKey: "allergy_notes", notesPlaceholder: "Quer detalhar? (ex.: alergia grave a camarão)" },
  { id: "never_eats", kind: "text", optional: true, title: "Algo que você não come de jeito nenhum?", help: "Não é alergia, é gosto mesmo. Pode pular.", placeholder: "Ex.: coentro, fígado" },
  { id: "wine", kind: "single", optional: true, title: "Topa vinho na mesa?", help: "Só tem vinho se todo mundo da mesa topar. Sem resposta conta como não.", options: [
    { value: "sim", label: "Topo" }, { value: "nao", label: "Prefiro sem" } ] },
  { id: "friday_ok", kind: "single", title: "Sexta à noite funciona pra você?", options: [
    { value: "sim", label: "Funciona, quase sempre" }, { value: "as-vezes", label: "Às vezes" }, { value: "dificil", label: "É difícil" } ] },
  { id: "base_hosted", kind: "single", title: "Nos últimos 3 meses, quantas vezes você recebeu alguém em casa para uma refeição?", options: RANGE3 },
  { id: "base_been_hosted", kind: "single", title: "E quantas vezes você foi recebido(a) na casa de alguém?", help: "Também nos últimos 3 meses.", options: RANGE3 },
  { id: "base_friends", kind: "single", title: "Quantos amigos você encontra fora da igreja ou do trabalho pelo menos 1 vez por mês?", options: [
    { value: "0", label: "Nenhum" }, { value: "1-2", label: "1 ou 2" }, { value: "3-5", label: "3 a 5" }, { value: "6+", label: "6 ou mais" } ] },
  { id: "would_host", kind: "single", title: "Você toparia abrir sua casa para um encontro?", help: "Um dia. Sem compromisso.", options: [
    { value: "sim", label: "Toparia" }, { value: "talvez", label: "Talvez, um dia" }, { value: "nao", label: "Acho que não" } ] },
  { id: "cooks_for_groups", kind: "single", title: "Você gosta ou sabe cozinhar para muita gente?", options: [
    { value: "sim", label: "Gosto e sei" }, { value: "aprendendo", label: "Gosto, mas tô aprendendo" }, { value: "nao", label: "Prefiro só comer" } ] },
  { id: "home_dish", kind: "text", optional: true, title: "Um prato que te lembra casa", help: "Pode pular. Mas a gente adora saber.", placeholder: "Ex.: o feijão da minha avó", maxLength: 120 },
  { id: "ref", kind: "text", optional: true, title: "Alguém te chamou?", help: "Se você recebeu um código de convite, coloca aqui. Se não, é só seguir.", placeholder: "Código (ex.: 7F3A9C)", maxLength: 12,
    check: async (v) => {
      const s = await codeStatus(String(v || ""));
      return s === "unknown" ? "Não achamos esse código. Confere ou apaga para seguir." : s === "full" ? "Esse código já foi usado 2 vezes. Apaga para seguir sem ele." : null;
    } },
  { id: "consent", kind: "consent", title: "Último passo", help: "Seus dados ficam só com o anfitrião e servem só para montar as mesas.",
    boxes: [
      { key: "consent_privacy", label: <>Li a <Link href="/privacidade" target="_blank" className="underline">política de privacidade</Link> e concordo com o uso dos meus dados para receber convites e montar as mesas.</> },
      { key: "consent_health", when: hasHealth, label: <>Autorizo o uso das minhas informações de alergia e restrição alimentar <b>apenas</b> para preparar o cardápio. Posso pedir para apagar quando quiser.</> },
    ] },
];

export default function Signup({ refCode }: { refCode: string }) {
  const router = useRouter();
  return (
    <Flow
      steps={STEPS}
      initial={refCode ? { ref: refCode } : {}}
      submitLabel="Quero meu lugar à mesa"
      intro={<p className="eyebrow mb-5 text-muted">Inscrição · 2 minutos</p>}
      onSubmit={async (v) => {
        const r = await submitSignup(v as Record<string, unknown>);
        if (!r.ok) return r.error;
        router.push(`/obrigado?c=${encodeURIComponent(r.code)}&n=${encodeURIComponent(r.name)}`);
        return null;
      }}
    />
  );
}
