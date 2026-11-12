// Quem é o anfitrião — Flavio: troque os {…} pelos seus dados. A foto vai em public/fotos/anfitriao.jpg.
// Fica fora: igreja/religião, endereço exato, sobrenome se não quiser.
export const HOST = {
  name: "Flavio",
  photo: "/fotos/anfitriao.jpg",
  short: "Eu cozinho, sirvo e abro a porta. Vocês só precisam chegar com fome e com vontade de conversar.",
  intro: "Oi, eu sou o Flavio. Moro em {bairro}, num apartamento de 40 m², e cozinho {há quanto tempo / desde quando}.",
  why: "Comecei a mesa porque {o motivo, em uma frase: ex. percebi que conhecia muita gente e jantava com quase ninguém}. Não sou chef. Faço comida de casa, com calma, para pouca gente.",
  facts: [
    ["Prato que mais faço", "{seu prato}"],
    ["Na mesa", "Eu cozinho e sirvo. A conversa é de vocês."],
    ["Fora da cozinha", "{1 coisa sua: profissão, hobby, de onde veio}"],
  ] as [string, string][],
  trust: "O endereço só vai para quem confirmou. Você sabe a data, o horário e quem vai te receber antes de dizer sim. Dúvida, alergia ou imprevisto: é só me chamar no WhatsApp do convite.",
};
