import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const navigate = useNavigate();

  const links = [
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
    { label: 'Contact Us', href: '/' },
    { label: 'Support', href: '/' },
  ];

  return (
    <footer className="bg-surface-container-high w-full py-12">
      <div className="flex flex-col items-center gap-4 px-10">
        <div className="text-base font-bold text-on-surface">
          Daffodil International University
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {links.map((link, index) => (
            <button
              key={index}
              onClick={() => navigate(link.href)}
              className="font-['Inter'] text-xs uppercase tracking-widest text-outline hover:text-primary transition-all"
            >
              {link.label}
            </button>
          ))}
        </div>

        <p className="font-['Inter'] text-xs uppercase tracking-widest text-outline mt-4">
          © 2024 Daffodil International University. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};
