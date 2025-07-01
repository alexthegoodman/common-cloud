"use client";

import Link from "next/link";

export default function Footer({ color = "black", subset = "" }) {
  return (
    <footer className={`container mx-auto px-4 py-16 text-${color}`} role="contentinfo">
      <div className="flex flex-row justify-between">
        <div>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-row gap-5 mb-5">
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
          </nav>
          {subset === "stunts" && (
            <nav aria-label="Alternative tools navigation">
              <ul className="flex flex-row gap-5">
                <li>
                  <Link href="/stunts/after-effects-alternative/">
                    After Effects Alternative
                  </Link>
                </li>
                <li>
                  <Link href="/stunts/canva-alternative/">Canva Alternative</Link>
                </li>
                <li>
                  <Link href="/stunts/capcut-alternative/">
                    CapCut Alternative
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>

        <span>&copy; {new Date().getFullYear()} Common</span>
      </div>
    </footer>
  );
}
