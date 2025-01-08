"use client";

export default function PolicyLayout({ children = null }) {
  return (
    <>
      <section className="container mx-auto px-4 py-16 policy">
        {children}
      </section>
      <style>
        {`
        .policy p {
            margin-bottom: 15px;
        }
        .policy ul {
            margin-bottom: 15px;
        }
        `}
      </style>
    </>
  );
}
