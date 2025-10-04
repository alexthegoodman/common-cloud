"use client";

import Link from "next/link";

export default function Header({ language = "en", showLogo = false }) {
  let copy = null;
  switch (language) {
    case "en":
      copy = {
        blog: "Blog",
        login: "Login",
        register: "Register",
      };
      break;

    case "hi":
      copy = {
        blog: "ब्लॉग",
        login: "लॉगिन",
        register: "रजिस्टर",
      };
      break;

    case "bn":
      copy = {
        blog: "",
        login: "",
        register: "",
      };
      break;

    default:
      break;
  }

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
        <nav role="navigation" aria-label="Main navigation">
          <ul className="flex flex-row gap-5 text-white">
            <li>
              <Link href="/blog/">{copy?.blog}</Link>
            </li>
            {/* <li>
              <Link href="/login/">{copy?.login}</Link>
            </li> */}
            {/* <li>
              <Link href="/register/">{copy?.register}</Link>
            </li> */}
          </ul>
        </nav>
      </div>
    </section>
  );
}
