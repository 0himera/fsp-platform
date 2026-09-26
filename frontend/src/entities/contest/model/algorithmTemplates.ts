import { TaskTemplate } from "./types";

export const algorithmTemplates: TaskTemplate[] = [
  {
    id: "algo-sum",
    title: "Сумма двух чисел (A + B)",
    category: "Базовые алгоритмы",
    statement: "Даны два целых числа A и B через пробел.\nВыведите их сумму в стандартный вывод.",
    maxPoints: 100,
    starterCode: `import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    print(int(tokens[0]) + int(tokens[1]))\n`,
    expectedLabels: {
      "2 3\n": "5",
      "10 20\n": "30",
      "-5 7\n": "2",
      "0 0\n": "0",
      "1000000 2000000\n": "3000000",
    },
  },
  {
    id: "algo-palindrome",
    title: "Проверка на палиндром",
    category: "Строки",
    statement: "Дана строка. Проверьте, является ли она палиндромом без учета регистра и пробелов.\nВыведите True или False.",
    maxPoints: 100,
    starterCode: `import sys\ns = sys.stdin.read().strip()\nclean = "".join(ch.lower() for ch in s if ch.isalnum())\nprint("True" if clean == clean[::-1] else "False")\n`,
    expectedLabels: {
      "A man a plan a canal Panama\n": "True",
      "race a car\n": "False",
      "radar\n": "True",
      "hello\n": "False",
      "No lemon no melon\n": "True",
    },
  },
  {
    id: "algo-max",
    title: "Максимальный элемент массива",
    category: "Массивы",
    statement: "В первой строке задано число N. Во второй строке — N целых чисел.\nНайдите и выведите максимальное число.",
    maxPoints: 100,
    starterCode: `import sys\ntokens = sys.stdin.read().split()\nif len(tokens) > 1:\n    print(max(int(x) for x in tokens[1:]))\n`,
    expectedLabels: {
      "5\n1 9 3 7 2\n": "9",
      "3\n-10 -20 -5\n": "-5",
      "1\n42\n": "42",
      "4\n100 100 50 100\n": "100",
    },
  },
];
