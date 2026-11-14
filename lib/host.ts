// Quem é o anfitrião — Flavio: edite os textos aqui. A foto vai em public/fotos/anfitriao.jpg.
// Sugestões para completar: bairro (nunca o endereço), há quanto tempo cozinha, por que começou,
// prato que mais faz, 1 coisa sua fora da cozinha. Fica fora: igreja/religião, endereço exato.
// Fatos com "{" não aparecem no site — preencha e eles surgem.
export const HOST = {
  name: "Flavio",
  photo: "/fotos/anfitriao.jpg",
  short: "Eu cozinho, sirvo e abro a porta. Vocês só precisam chegar com fome e com vontade de conversar.",
  intro: "Oi, eu sou o Flavio. Moro num apartamento de 40 m² e é nele que a mesa acontece.",
  why: "Não sou chef. Faço comida de casa, com calma, para pouca gente. A aposta é simples: ninguém precisa de casa grande para receber bem.",
  facts: [
    ["Prato que mais faço", "{seu prato}"],
    ["Na mesa", "Eu cozinho e sirvo. A conversa é de vocês."],
    ["Fora da cozinha", "{profissão, hobby ou de onde veio}"],
  ] as [string, string][],
  trust: "O endereço só vai para quem confirmou. Você sabe a data, o horário e quem vai te receber antes de dizer sim. Dúvida, alergia ou imprevisto: é só me chamar no WhatsApp do convite.",
};
