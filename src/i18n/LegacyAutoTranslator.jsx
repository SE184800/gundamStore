import { useEffect } from "react";
import { translateRawText } from "./translations";

const ORIGINAL_TEXT = Symbol("originalText");
const ORIGINAL_PLACEHOLDER = Symbol("originalPlaceholder");
const ORIGINAL_TITLE = Symbol("originalTitle");
const ORIGINAL_ARIA = Symbol("originalAria");

function getLanguage() {
  const saved =
    window.localStorage.getItem("language") ||
    window.localStorage.getItem("locale") ||
    "vi";

  return saved.toLowerCase() === "en" ? "en" : "vi";
}

function rememberText(node) {
  if (!node[ORIGINAL_TEXT]) {
    node[ORIGINAL_TEXT] = node.nodeValue;
  }

  return node[ORIGINAL_TEXT];
}

function rememberAttr(element, attr, symbol) {
  if (!element[symbol]) {
    element[symbol] = element.getAttribute(attr) || "";
  }

  return element[symbol];
}

function translatePage() {
  if (!document.body) return;

  const language = getLanguage();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();

        if (["script", "style", "textarea", "input", "option"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }

        return node.nodeValue && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach((node) => {
    const original = rememberText(node);
    const translated = translateRawText(original, language);

    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  });

  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
    const original = rememberAttr(el, "placeholder", ORIGINAL_PLACEHOLDER);
    const translated = translateRawText(original, language);

    if (el.getAttribute("placeholder") !== translated) {
      el.setAttribute("placeholder", translated);
    }
  });

  document.querySelectorAll("[title]").forEach((el) => {
    const original = rememberAttr(el, "title", ORIGINAL_TITLE);
    const translated = translateRawText(original, language);

    if (el.getAttribute("title") !== translated) {
      el.setAttribute("title", translated);
    }
  });

  document.querySelectorAll("[aria-label]").forEach((el) => {
    const original = rememberAttr(el, "aria-label", ORIGINAL_ARIA);
    const translated = translateRawText(original, language);

    if (el.getAttribute("aria-label") !== translated) {
      el.setAttribute("aria-label", translated);
    }
  });
}

let scheduled = false;

function scheduleTranslate() {
  if (scheduled) return;

  scheduled = true;

  window.requestAnimationFrame(() => {
    scheduled = false;
    translatePage();
  });
}

export default function LegacyAutoTranslator() {
  useEffect(() => {
    scheduleTranslate();

    const run = () => {
      scheduleTranslate();
      setTimeout(scheduleTranslate, 120);
    };

    window.addEventListener("gundam-language-change", run);
    window.addEventListener("click", run, true);
    window.addEventListener("focusin", run, true);
    window.addEventListener("mouseover", run, true);

    const observer = new MutationObserver(run);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      window.removeEventListener("gundam-language-change", run);
      window.removeEventListener("click", run, true);
      window.removeEventListener("focusin", run, true);
      window.removeEventListener("mouseover", run, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
