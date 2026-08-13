import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/common/Providers";
import FloatingChatbot from "@/components/common/FloatingChatbot";
import MetaPixel from "@/components/common/MetaPixel";

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
  metadataBase: new URL("https://www.porville.com"),
  keywords: ["fresh meat", "chicken online", "mutton delivery", "porville", "hygienic meat", "delhi meat shop", "FSSAI registered meat shop"],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <body>
        <MetaPixel />
        <noscript>
          <img height="1" width="1" style={{display:'none'}} alt=""
            src="https://www.facebook.com/tr?id=1277240787865091&ev=PageView&noscript=1"
          />
        </noscript>
        <Providers>
          {children}
          <FloatingChatbot />
        </Providers>
      </body>
    </html>
  );
}
