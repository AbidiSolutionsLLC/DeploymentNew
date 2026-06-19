import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageContainer from "../../components/ui/PageContainer";

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
    <PageContainer
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions about HR Fusion"
    >
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-6">
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
    </PageContainer>
  );
};

export default FAQs;
