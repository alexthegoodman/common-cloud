import React from "react";

const FAQ = ({ language = "en" }) => {
  let copy = null;

  switch (language) {
    case "en":
      copy = {
        title: "Frequently Asked Questions",
        faqs: [
          {
            question: "How is Stunts different from Canva or After Effects?",
            answer:
              "Stunts strikes a perfect balance: it is far more powerful than Canva, enabling complex keyframe-based animations, yet it has a much shorter learning curve compared to After Effects, making it accessible for creators of all skill levels.",
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
              "Yes! You can use Stunts for free, but you will be limited to 3 projects at this time.",
          },
        ],
      };
      break;

    case "hi":
      copy = {
        title: "अक्सर पूछे जाने वाले प्रश्न",
        faqs: [
          {
            question: "Stunts, Canva या After Effects से कैसे अलग है?",
            answer:
              "Stunts एक परफेक्ट बैलेंस बनाता है: यह Canva से कहीं ज्यादा पावरफुल है, कॉम्प्लेक्स कीफ्रेम-बेस्ड एनिमेशन इनेबल करता है, फिर भी After Effects की तुलना में इसका लर्निंग कर्व बहुत छोटा है, जो इसे सभी स्किल लेवल के क्रिएटर्स के लिए एक्सेसिबल बनाता है।",
          },
          {
            question:
              "क्या जेनरेटिव कीफ्रेम्स परफेक्ट रूप से out of the box काम करते हैं?",
            answer:
              "जेनरेटिव कीफ्रेम्स को रिफाइनमेंट की जरूरत होती है। बेहतरीन रिजल्ट्स के लिए आपको उन्हें एडजस्ट करना पड़ सकता है।",
          },
          {
            question: "कौन से एक्सपोर्ट फॉर्मेट्स उपलब्ध हैं?",
            answer:
              "एडिटर फिलहाल केवल HD MP4 एक्सपोर्ट को सपोर्ट करता है, लेकिन 4K एक्सपोर्ट जल्द आ रहा है।",
          },
          {
            question: "क्या कोई फ्री ट्रायल या डेमो उपलब्ध है?",
            answer:
              "हां! आप Stunts को फ्री में उपयोग कर सकते हैं, लेकिन इस समय आप 3 प्रोजेक्ट्स तक सीमित रहेंगे।",
          },
        ],
      };
      break;

    default:
      break;
  }

  return (
    <div className="bg-slate-900 text-slate-200 py-12 px-6">
      <h1 className="text-4xl font-bold text-red-500 mb-8 text-center">
        {copy?.title}
      </h1>
      <div className="max-w-4xl mx-auto space-y-6">
        {copy?.faqs.map((faq, index) => (
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
