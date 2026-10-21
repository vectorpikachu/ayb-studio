const LETTERS: Record<string, string> = {
  "ա": "a",
  "բ": "b",
  "գ": "g",
  "դ": "d",
  "ե": "e",
  "զ": "z",
  "է": "e",
  "ը": "ə",
  "թ": "t",
  "ժ": "zh",
  "ի": "i",
  "լ": "l",
  "խ": "kh",
  "ծ": "ts",
  "կ": "k",
  "հ": "h",
  "ձ": "dz",
  "ղ": "gh",
  "ճ": "ch",
  "մ": "m",
  "յ": "y",
  "ն": "n",
  "շ": "sh",
  "ո": "o",
  "չ": "ch",
  "պ": "p",
  "ջ": "j",
  "ռ": "rr",
  "ս": "s",
  "վ": "v",
  "տ": "t",
  "ր": "r",
  "ց": "ts",
  "ւ": "v",
  "փ": "p",
  "ք": "k",
  "օ": "o",
  "ֆ": "f",
};

const PUNCTUATION: Record<string, string> = {
  "։": ".",
  "֊": "-",
  "՞": "?",
  "՜": "!",
  "՛": "",
  "՝": ",",
};

function transliterateWord(word: string): string {
  const chars = Array.from(word);
  let out = "";
  let initial = true;

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const lower = char.toLowerCase();
    const upper = char !== lower;
    let value: string | null = null;

    if (lower === "ո" && chars[i + 1]?.toLowerCase() === "ւ") {
      value = "u";
      i += 1;
    } else if (lower === "և") {
      value = initial ? "yev" : "ev";
    } else if (lower === "ե") {
      value = initial ? "ye" : "e";
    } else if (lower === "ո") {
      value = initial ? "vo" : "o";
    } else if (LETTERS[lower]) {
      value = LETTERS[lower];
    }

    if (!value) {
      out += char;
      initial = false;
      continue;
    }

    out += upper ? value[0].toUpperCase() + value.slice(1) : value;
    initial = false;
  }

  return out;
}

/**
 * The learner-facing romanization used throughout Ayb: no diacritics or
 * apostrophes, aspirated consonants folded into t/k/p, ռ written rr, and the
 * word-initial ե/ո/և glides written ye/vo/yev.
 */
export function practicalTranslit(text: string): string {
  let out = "";
  let word = "";

  const flush = () => {
    if (word) {
      out += transliterateWord(word);
      word = "";
    }
  };

  for (const char of Array.from(text)) {
    const lower = char.toLowerCase();
    if (LETTERS[lower] || lower === "և") {
      word += char;
    } else {
      flush();
      out += PUNCTUATION[char] ?? char;
    }
  }
  flush();

  return out
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}
