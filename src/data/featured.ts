export type FeaturedWord = {
  id: string;
  hy: string;
  translit: string;
  pos: string;
  level: "A1" | "A2" | "B1";
  en: string;
  ru: string;
  zh: string;
  example: {
    hy: string;
    translit: string;
    en: string;
    ru: string;
    zh: string;
  };
};

export const featuredWords: FeaturedWord[] = [
  {
    id: "jur",
    hy: "ջուր",
    translit: "jur",
    pos: "名词 · noun",
    level: "A1",
    en: "water",
    ru: "вода",
    zh: "水",
    example: {
      hy: "Ես ամեն օր ջուր եմ խմում։",
      translit: "Yes amen or jur em khmum.",
      en: "I drink water every day.",
      ru: "Я пью воду каждый день.",
      zh: "我每天都喝水。",
    },
  },
  {
    id: "barev",
    hy: "բարև",
    translit: "barev",
    pos: "感叹词 · interjection",
    level: "A1",
    en: "hello; hi",
    ru: "привет; здравствуй",
    zh: "你好",
    example: {
      hy: "Բարև, ես Արմանն եմ։",
      translit: "Barev, yes Armann em.",
      en: "Hello, I am Arman.",
      ru: "Привет, я Арман.",
      zh: "你好，我是阿尔曼。",
    },
  },
  {
    id: "ser",
    hy: "սեր",
    translit: "ser",
    pos: "名词 · noun",
    level: "A1",
    en: "love",
    ru: "любовь",
    zh: "爱",
    example: {
      hy: "Սերը մեծ ուժ է։",
      translit: "Serə mets uzh e.",
      en: "Love is a great force.",
      ru: "Любовь — великая сила.",
      zh: "爱是一种强大的力量。",
    },
  },
  {
    id: "tun",
    hy: "տուն",
    translit: "tun",
    pos: "名词 · noun",
    level: "A1",
    en: "house; home",
    ru: "дом",
    zh: "家；房子",
    example: {
      hy: "Մեր տունը փոքր է, բայց տաք է։",
      translit: "Mer tunə p’ok’r e, bayts’ tak’ e.",
      en: "Our house is small, but it is warm.",
      ru: "Наш дом маленький, но тёплый.",
      zh: "我们的房子很小，但很温暖。",
    },
  },
  {
    id: "girk",
    hy: "գիրք",
    translit: "girk’",
    pos: "名词 · noun",
    level: "A1",
    en: "book",
    ru: "книга",
    zh: "书",
    example: {
      hy: "Ես ամեն երեկո գիրք եմ կարդում։",
      translit: "Yes amen yereko girk’ em kardum.",
      en: "I read a book every evening.",
      ru: "Каждый вечер я читаю книгу.",
      zh: "我每天晚上读一本书。",
    },
  },
  {
    id: "arev",
    hy: "արև",
    translit: "arev",
    pos: "名词 · noun",
    level: "A1",
    en: "sun",
    ru: "солнце",
    zh: "太阳",
    example: {
      hy: "Այսօր արևը պայծառ է։",
      translit: "Aysor arevə paytsarr e.",
      en: "The sun is bright today.",
      ru: "Сегодня яркое солнце.",
      zh: "今天阳光明媚。",
    },
  },
  {
    id: "ynker",
    hy: "ընկեր",
    translit: "ənker",
    pos: "名词 · noun",
    level: "A1",
    en: "friend",
    ru: "друг",
    zh: "朋友",
    example: {
      hy: "Իմ լավագույն ընկերը Երևանում է ապրում։",
      translit: "Im lavaguyn ənkerə Yerevanum ē aprum.",
      en: "My best friend lives in Yerevan.",
      ru: "Мой лучший друг живёт в Ереване.",
      zh: "我最好的朋友住在埃里温。",
    },
  },
];

export function getWordOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return featuredWords[day % featuredWords.length];
}
