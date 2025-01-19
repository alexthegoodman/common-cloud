"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div>
        <ul className="flex flex-row gap-5">
          <li>
            <Link href="/privacy-policy/">Privacy Policy</Link>
          </li>
          <li>
            <Link href="/terms-of-service/">Terms of Service</Link>
          </li>
          <li>
            <Link href="/shopping-policies/">Shopping Policies</Link>
          </li>
          <li>
            <Link href="/account-deletion/">Account Deletion</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
