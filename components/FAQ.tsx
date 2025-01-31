import React from "react";

const FAQ = () => {
  const faqs = [
    {
      question: "How is Stunts different from Canva or After Effects?",
      answer:
        "Stunts strikes a perfect balance: it is far more powerful than Canva, enabling complex keyframe-based animations, yet it has a much shorter learning curve compared to After Effects, making it accessible for creators of all skill levels.",
    },
    {
      question: "Is the editor available for platforms other than Windows?",
      answer:
        "Currently, the editor is only available for Web and Windows. Support for other platforms may come in the future.",
    },
    {
      question: "Do generative keyframes work perfectly out of the box?",
      answer:
        "Generative keyframes require refinement. You may need to adjust them for the best results.",
    },
    {
      question: "What export formats are available?",
      answer:
        "The editor supports HD MP4 export only for now, but 4K export is coming soon.",
    },
    {
      question: "Is there a free trial or demo available?",
      answer:
        "Yes! You can use Stunts for free, but videos will include a watermark of the Stunts logo.",
    },
  ];

  return (
    <div className="bg-slate-900 text-slate-200 py-12 px-6">
      <h1 className="text-4xl font-bold text-red-500 mb-8 text-center">
        Frequently Asked Questions
      </h1>
      <div className="max-w-4xl mx-auto space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="p-6 bg-slate-800 rounded-md shadow-md">
            <h2 className="text-2xl font-semibold text-red-400">
              {faq.question}
            </h2>
            <p className="mt-4 text-slate-300">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
