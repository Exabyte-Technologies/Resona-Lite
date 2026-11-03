export const HOME_QUOTES = [
  'Make room for quiet',
  'Take a breath. Begin again.',
  'Find a little stillness',
  'One quiet moment is enough',
  'Give yourself space to pause',
  'Return to your own rhythm',
  'Let the day soften',
  'Let calm find you',
] as const;

export function chooseHomeQuote(previous: string | null): string {
  const choices = HOME_QUOTES.filter(quote => quote !== previous);
  return choices[Math.floor(Math.random() * choices.length)];
}
