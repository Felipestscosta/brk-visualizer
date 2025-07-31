import { Poppins } from "next/font/google";
import "./../globals.css";

const poppins = Poppins({
  weight: ["400", "600", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brk | Diagnóstico de produtos",
  description: "Analise e mensuração de informações inconsistentes na base ERP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased bg-gradient-to-tr from-slate-50 to-slate-950 bg-no-repeat min-h-[100dvh]`}
      >
        {children}
      </body>
    </html>
  );
}
