// contentScript.js
(() => {
  const STYLE_ID = "osu-x-m-style";
  const CLASS_NAME = "osu-x-m";

  // Inject CSS once
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${CLASS_NAME} {
        position: relative;
        display: inline-block;
      }

      .${CLASS_NAME}::before,
      .${CLASS_NAME}::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200%;        /* how wide the X is relative to the letter */
        height: 6px;        /* thickness of the X stroke */
        background: #BB0000; /* OSU scarlet */
        transform-origin: center;
        pointer-events: none;
      }

      .${CLASS_NAME}::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      .${CLASS_NAME}::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
    `;
    document.head.appendChild(style);
  }

  // Walk text nodes and wrap every M/m
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const text = node.nodeValue;
        if (!text || !/[Mm]/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.nodeName;
        // Skip script-y or input-y places
        if (
          ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION"].includes(
            tagName
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.isContentEditable) {
          return NodeFilter.FILTER_REJECT;
        }

        // Don't double-process already wrapped content
        if (
          parent.nodeType === Node.ELEMENT_NODE &&
          parent.closest("." + CLASS_NAME)
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodesToProcess = [];
  let current;
  while ((current = walker.nextNode())) {
    nodesToProcess.push(current);
  }

  nodesToProcess.forEach((textNode) => {
    const text = textNode.nodeValue;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "M" || ch === "m") {
        const span = document.createElement("span");
        span.className = CLASS_NAME;
        span.textContent = ch;
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(ch));
      }
    }

    textNode.parentNode.replaceChild(frag, textNode);
  });
})();
