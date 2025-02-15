"use client";

import Link from "next/link";

export default function Header({ showLogo = false }) {
  return (
    <section className="container mx-auto px-4 pt-8">
      <div className="flex flex-row justify-between">
        <div>
          {showLogo && (
            <Link href="/stunts">
              <img
                src="/stunts_logo_blackground.png"
                alt="Stunts Logo"
                className="mx-auto h-20"
              />
            </Link>
          )}
        </div>
        <ul className="flex flex-row gap-5 text-white">
          <li>
            <Link href="/blog/">Blog</Link>
          </li>
          <li>
            <Link href="/login/">Login</Link>
          </li>
          <li>
            <Link href="/register/">Register</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
