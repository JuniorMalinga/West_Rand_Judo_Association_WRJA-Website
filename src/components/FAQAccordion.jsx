import { useState, useRef } from "react";
import Reveal from "./Reveal";
import faqs from "../data/faqs";

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  // CHANGE: Store references to each FAQ answer so we can measure
  // its real height instead of using a fixed max-height.
  const answerRefs = useRef([]);

  const toggleFAQ = (index) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <div className="faq-list">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <Reveal
            key={faq.question}
            delay={index * 60}
            className="faq-item"
          >
            <button
              type="button"
              className={`faq-question ${
                isOpen ? "faq-question-open" : ""
              }`}
              onClick={() => toggleFAQ(index)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
            >
              <span>{faq.question}</span>

              <span
                className="faq-toggle-icon"
                aria-hidden="true"
              >
                {isOpen ? "\u2212" : "+"}
              </span>
            </button>

            <div
              id={`faq-answer-${index}`}
              ref={(element) => {
                answerRefs.current[index] = element;
              }}
              className={`faq-answer ${
                isOpen ? "faq-answer-open" : ""
              }`}
            
              style={{
                maxHeight: isOpen
                  ? `${answerRefs.current[index]?.scrollHeight || 0}px`
                  : "0px",
              }}
            >
              <p>{faq.answer}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}