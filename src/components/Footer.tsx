import React from 'react';

interface FooterProps {
  onOpenSupport?: () => void;
  onOpenServices?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSupport, onOpenServices }) => {
  return (
    <footer className="bg-white border-t border-[#ebe2cf] mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
        <div className="font-bold text-[#1f1b10]">
          © 2024 Pintuco. Todos los derechos reservados.
        </div>

        <nav className="flex flex-wrap justify-center items-center gap-6">
          <a
            href="#privacidad"
            onClick={(e) => e.preventDefault()}
            className="text-[#4d4632] hover:text-[#725c00] hover:underline decoration-[#725c00] opacity-80 hover:opacity-100 transition-opacity text-xs"
          >
            Política de Privacidad
          </a>
          <a
            href="#terminos"
            onClick={(e) => e.preventDefault()}
            className="text-[#4d4632] hover:text-[#725c00] hover:underline decoration-[#725c00] opacity-80 hover:opacity-100 transition-opacity text-xs"
          >
            Términos de Uso
          </a>
          <button
            onClick={onOpenSupport}
            className="text-[#4d4632] hover:text-[#725c00] hover:underline decoration-[#725c00] opacity-80 hover:opacity-100 transition-opacity text-xs"
          >
            Contáctanos
          </button>
          <a
            href="https://pintuco.com.co"
            target="_blank"
            rel="noreferrer"
            className="text-[#4d4632] hover:text-[#725c00] hover:underline decoration-[#725c00] opacity-80 hover:opacity-100 transition-opacity text-xs"
          >
            Sitios Globales
          </a>
        </nav>
      </div>
    </footer>
  );
};
