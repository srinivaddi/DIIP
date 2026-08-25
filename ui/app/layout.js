import React from "react";
import "./globals.css";

export const metadata = {
  title: "DIIP Hub",
  description: "Digital Institutional Intelligence Platform Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
