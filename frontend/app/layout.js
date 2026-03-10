import localFont from "next/font/local";
import "./globals.css";

const montserrat = localFont({
  src: "./fonts/montserrat-latin-wght-normal.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  title: "MNIST CNN Visualizer",
  description: "See what a CNN sees when classifying handwritten digits",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={montserrat.variable + " antialiased"}>
        {children}
      </body>
    </html>
  );
}
