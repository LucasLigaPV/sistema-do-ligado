import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, sans-serif;
          --primary: #EFC200;
          --primary-dark: #D4A900;
          --primary-light: #F5D84A;
          --primary-bg: #FFF9E6;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      {children}
    </div>
  );
}