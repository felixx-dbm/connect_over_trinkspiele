import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = { title: "Datenschutzerklärung – Prost" };

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] px-4 pt-12 pb-16 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/home"
          aria-label="Zurück"
          className="w-9 h-9 border border-[#14110F] flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="eyebrow mb-0.5">RECHTLICHES</p>
          <h1 className="display text-2xl">Datenschutz</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border border-amber-700 p-3 bg-amber-50">
        <Shield size={14} className="text-amber-700 flex-shrink-0" />
        <p className="text-xs text-amber-800 font-semibold leading-relaxed">
          Prost ist ein nicht-kommerzielles Hochschulprojekt (DHBW). Keine Werbung, kein Tracking, keine Weitergabe an Dritte zu kommerziellen Zwecken.
        </p>
      </div>

      <div className="space-y-px">
        <Section title="1. Verantwortlicher">
          <p>Felix Dobelmann</p>
          <p>E-Mail: <a href="mailto:dobelmannfelixx@gmail.com" className="text-amber-700 font-bold underline">dobelmannfelixx@gmail.com</a></p>
          <p className="text-[#6B5D42] text-sm">Hochschulprojekt im Rahmen des Studiums an der DHBW.</p>
        </Section>

        <Section title="2. Welche Daten wir verarbeiten">
          <ul className="space-y-2 text-sm">
            <li><span className="font-bold">Benutzername, E-Mail, Geburtsdatum</span> — bei Registrierung</li>
            <li><span className="font-bold">IP-Adresse</span> — bei jedem Serveraufruf (durch Vercel-Hosting)</li>
            <li><span className="font-bold">Ungefährer Standort (±200 m versetzt)</span> — nur wenn du eine Herausforderung auf der Karte postest</li>
            <li><span className="font-bold">Spielstatistiken</span> — Siege, Niederlagen, Matches, Crew-Zugehörigkeit</li>
            <li><span className="font-bold">Profilbild</span> — falls du eines hochlädst (optional)</li>
          </ul>
        </Section>

        <Section title="3. Zweck & Rechtsgrundlage">
          <ul className="space-y-2 text-sm">
            <li><span className="font-bold">Authentifizierung & Account</span> — Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
            <li><span className="font-bold">Altersverifikation (18+)</span> — Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)</li>
            <li><span className="font-bold">Standort für die Karte</span> — Art. 6 Abs. 1 lit. a DSGVO (Einwilligung; jederzeit widerrufbar unter Einstellungen → Datenschutz)</li>
            <li><span className="font-bold">Spielstatistiken & Rangliste</span> — Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
          </ul>
        </Section>

        <Section title="4. Auftragsverarbeiter (Drittanbieter)">
          <ul className="space-y-3 text-sm">
            <li>
              <span className="font-bold">Supabase Inc. (USA)</span> — Datenbank & Authentifizierung.
              Datentransfer in die USA auf Basis von Standardvertragsklauseln (SCC) gem. Art. 46 DSGVO.{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-700 font-bold underline">Datenschutzrichtlinie</a>
            </li>
            <li>
              <span className="font-bold">Vercel Inc. (USA)</span> — Hosting & Serverinfrastruktur.
              Datentransfer in die USA auf Basis von SCC gem. Art. 46 DSGVO.{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-700 font-bold underline">Datenschutzrichtlinie</a>
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          <p className="text-sm">
            Wir verwenden ausschließlich technisch notwendige Session-Cookies (Supabase Auth). Es werden <span className="font-bold">keine Tracking-, Analyse- oder Werbe-Cookies</span> eingesetzt. Ein Cookie-Banner ist daher nicht erforderlich.
          </p>
        </Section>

        <Section title="6. Speicherdauer">
          <p className="text-sm">
            Deine Daten werden gespeichert, solange dein Account aktiv ist. Du kannst deinen Account jederzeit vollständig löschen unter: <span className="font-bold">Einstellungen → Gefahrenzone → Account löschen.</span> Alle personenbezogenen Daten werden dabei unwiderruflich entfernt.
          </p>
        </Section>

        <Section title="7. Deine Rechte (Art. 15–21 DSGVO)">
          <ul className="space-y-1.5 text-sm">
            <li><span className="font-bold">Auskunft</span> — welche Daten wir über dich haben</li>
            <li><span className="font-bold">Berichtigung</span> — falsche Daten korrigieren lassen</li>
            <li><span className="font-bold">Löschung</span> — Account-Löschung in den Einstellungen</li>
            <li><span className="font-bold">Einschränkung & Widerspruch</span> — Verarbeitung einschränken</li>
            <li><span className="font-bold">Datenübertragbarkeit</span> — Daten in maschinenlesbarem Format anfragen</li>
          </ul>
          <p className="text-sm mt-3">
            Anfragen an: <a href="mailto:dobelmannfelixx@gmail.com" className="text-amber-700 font-bold underline">dobelmannfelixx@gmail.com</a>
          </p>
        </Section>

        <Section title="8. Beschwerderecht">
          <p className="text-sm">
            Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist der{" "}
            <span className="font-bold">Landesbeauftragte für Datenschutz und Informationsfreiheit Baden-Württemberg (LfDI BW)</span>.
          </p>
        </Section>

        <div className="border border-[#14110F] p-4 mt-2">
          <p className="text-xs text-[#6B5D42] font-semibold">
            Stand: Juli 2026 · Diese Datenschutzerklärung gilt für die Web-App unter connect-over-trinkspiele.vercel.app
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#14110F] p-5">
      <p className="eyebrow mb-3">{title}</p>
      <div className="text-[#14110F] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
