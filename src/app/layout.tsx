import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Longy · Аудит скорости старения",
  description:
    "Персональный аудит: оценка потери здоровых лет из-за образа жизни и три главных рычага. Методология Li et al., J Intern Med 2024.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
