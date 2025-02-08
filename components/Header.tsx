"use client";

import Link from "next/link";

export default function Header() {
  return (
    <section className="container mx-auto px-4 pt-8">
      <div className="flex flex-row justify-end">
        <ul className="flex flex-row gap-5">
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
