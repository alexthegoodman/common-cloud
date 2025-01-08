"use client";

import Link from "next/link";

export default function StuntsLayout({ children = null }) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black to-slate-900">
        {children}

        {/* Footer */}

        <section className="container mx-auto px-4 py-16">
          <div>
            <ul className="flex flex-row gap-5">
              <li>
                <Link href="/stunts/privacy-policy/">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/stunts/terms-of-service/">Terms of Service</Link>
              </li>
              <li>
                <Link href="/stunts/shopping-policies/">Shopping Policies</Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
