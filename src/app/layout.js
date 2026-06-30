import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/common/Providers";
import FloatingChatbot from "@/components/common/FloatingChatbot";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Porville | Fresh Cut Pure Standards",
    template: "%s | Porville",
  },
  description: "Porville offers premium, fresh, and hygienic cuts of Chicken, Mutton, Quail, Duck, and Farm Fresh Eggs. FSSAI registered. Order online for 2-hour express delivery.",
  metadataBase: new URL("https://porville.com"),
  keywords: ["fresh meat", "chicken online", "mutton delivery", "porville", "hygienic meat", "sangam vihar meat shop", "FSSAI registered meat shop"],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <body>
        <Providers>
          {children}
          <FloatingChatbot />
        </Providers>
      </body>
    </html>
  );
}
