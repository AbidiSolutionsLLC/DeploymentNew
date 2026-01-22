import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQs = () => {
  const [expandedFAQ, setExpandedFAQ] = useState("What is HR Fusion?");

  const faqs = [
    {
      title: "What is HR Fusion?",
      content:
        "HR Fusion is ideal for businesses of all sizes—from startups to large enterprises—looking to streamline their employee and HR management processes. It's especially useful for HR departments, recruiters, managers, and employees alike.",
    },
    {
      title: "Who can use HR Fusion?",
      content:
        "HR Fusion is ideal for businesses of all sizes—from startups to large enterprises—looking to streamline their employee and HR management processes. It's especially useful for HR departments, recruiters, managers, and employees alike.",
    },
    {
      title: "Does HR Fusion offer a free trial?",
      content:
        "HR Fusion is ideal for businesses of all sizes—from startups to large enterprises—looking to streamline their employee and HR management processes. It's especially useful for HR departments, recruiters, managers, and employees alike.",
    },
    {
      title: "What modules does HR Fusion include?",
      content:
        "HR Fusion is ideal for businesses of all sizes—from startups to large enterprises—looking to streamline their employee and HR management processes. It's especially useful for HR departments, recruiters, managers, and employees alike.",
    },
  ];

  const toggleFAQ = (faqTitle) => {
    if (expandedFAQ === faqTitle) {
      setExpandedFAQ(null);
    } else {
      setExpandedFAQ(faqTitle);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary m-5 rounded-lg">
      {/* Main Content */}
      <main className="flex-1 p-8 ">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-6">
          {/* FAQs Section */}
          <div>
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h2 className="text-base font-medium text-center">
                HR Fusion - Frequently Asked Questions (FAQs)
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.title}
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  <button
                    className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50"
                    onClick={() => toggleFAQ(faq.title)}
                  >
                    <span className="text-sm font-medium">{faq.title}</span>
                    {expandedFAQ === faq.title ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  
                  {expandedFAQ === faq.title && faq.content && (
                    <div className="p-4 bg-white border-t border-gray-200 text-sm text-gray-600">
                      {faq.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQs;
