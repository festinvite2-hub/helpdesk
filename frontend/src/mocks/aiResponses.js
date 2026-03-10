const RESPONSES = [
  {
    keywords: ['wifi', 'internet', 'retea', 'conectare', 'net'],
    response:
      'Pentru probleme cu WiFi-ul, încearcă următorii pași:\n\n1. Deconectează-te de la rețea și reconectează-te\n2. Uită rețeaua WiFi din setări și adaug-o din nou\n3. Repornește telefonul/laptopul\n4. Verifică dacă alți colegi au aceeași problemă\n\nDacă problema persistă pe mai multe dispozitive, probabil e o problemă de infrastructură și trebuie creat un tichet.',
    sources: ['Ghid depanare WiFi intern', 'FAQ Rețea'],
  },
  {
    keywords: ['imprimanta', 'printer', 'printeaza', 'toner', 'scaner'],
    response:
      'Pentru probleme cu imprimanta:\n\n1. Verifică dacă imprimanta e pornită și conectată la rețea\n2. Verifică dacă are hârtie și toner\n3. Repornește imprimanta (oprește, așteaptă 30 sec, pornește)\n4. Încearcă să printezi o pagină de test\n\nDacă eroarea e "paper jam" dar nu e hârtie blocată, deschide toate capacele și verifică dacă există bucăți mici de hârtie.',
    sources: ['Manual imprimante HP', 'Procedura internă imprimante'],
  },
  {
    keywords: ['parola', 'cont', 'blocat', 'acces', 'login', 'loghez'],
    response:
      'Pentru probleme cu contul sau parola:\n\n1. Verifică dacă tastezi parola corect (Caps Lock dezactivat?)\n2. Încearcă să resetezi parola de pe pagina de login → "Am uitat parola"\n3. Dacă contul e blocat, așteaptă 15 minute și încearcă din nou\n\n⚠️ După 5 încercări eșuate, contul se blochează automat pentru 30 minute.\n\nDacă nu poți reseta singur parola, creează un tichet și un administrator te va ajuta.',
    sources: ['Politica de securitate conturi', 'Ghid resetare parolă'],
  },
  {
    keywords: ['proiector', 'videoproiector', 'hdmi', 'prezentare'],
    response:
      'Pentru probleme cu proiectorul:\n\n1. Verifică dacă cablul HDMI/VGA e conectat corect la ambele capete\n2. Apasă butonul "Source/Input" de pe telecomandă și selectează sursa corectă\n3. Pe laptop: apasă Windows+P și selectează "Duplicate" sau "Extend"\n4. Dacă LED-ul proiectorului clipește roșu, oprește-l 5 minute și repornește\n\nDacă proiectorul face zgomote anormale, nu-l mai folosi și creează un tichet urgent.',
    sources: ['Ghid utilizare proiectoare', 'Inventar echipamente săli'],
  },
]

const DEFAULT_RESPONSE = {
  response:
    'Nu am găsit informații specifice despre această problemă în baza de cunoștințe.\n\nÎți recomand să creezi un tichet pentru a primi ajutor de la echipa responsabilă. Descrie problema cât mai detaliat pentru a fi direcționat corect.',
  sources: [],
}

export function getAiResponse(message) {
  const lower = message.toLowerCase()
  const match = RESPONSES.find((responseItem) => responseItem.keywords.some((keyword) => lower.includes(keyword)))
  return match || DEFAULT_RESPONSE
}
