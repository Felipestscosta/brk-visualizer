import { Poppins } from "next/font/google";
import "./../globals.css";

const poppins = Poppins({
  weight: ["400", "600", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brk | Catálogo",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased bg-no-repeat bg-zinc-950 min-h-[100dvh] text-zinc-50`}
      >
        {children}
      </body>
    </html>
  );
}
