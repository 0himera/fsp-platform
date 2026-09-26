import { SlideItem } from "./types";

export const slidesPart3: SlideItem[] = [
  {
    id: "tech-architecture",
    badge: "Архитектура & Безопасность",
    title: "Технический стек и надежность",
    subtitle: "Модульная микросервисная архитектура высокой доступности",
    highlights: ["Go Backend", "Docker Worker", "Codeforces API", "PostgreSQL"],
    points: [
      { title: "Backend (Go 1.24)", desc: "Высокая скорость, строгая типизация, чистая архитектура и миграции." },
      { title: "Sandbox Worker", desc: "Безопасное изолированное исполнение кода в контейнерах с лимитами." },
      { title: "Codeforces Sync", desc: "Синхронизация раундов, задач и проверка официальных хэндлов атлетов." },
      { title: "Frontend (React 19)", desc: "Быстрый интерфейс, CSS модули, строгий TypeScript и доступность." },
    ],
    actions: [
      { label: "Открыть профиль", href: "/profile" },
      { label: "Рейтинг участников", href: "/rankings" },
    ],
  },
  {
    id: "potential-qa",
    badge: "Финал · 3 мин Вопросы экспертов",
    title: "Потенциал продукта и Q&A",
    subtitle: "Готовность к боевой эксплуатации Федерацией спортивного программирования",
    highlights: ["Внедрение в ФСП", "Масштабирование", "Интеграции", "Вопросы"],
    points: [
      { title: "Внедрение в регионы", desc: "Система готова к интеграции во все региональные отделения ФСП РФ." },
      { title: "Экономия времени", desc: "Судейская коллегия экономит до 80% времени на протоколах и проверках." },
      { title: "Развитие экосистемы", desc: "Поддержка командных контестов (ICPC), хакатонов и олимпиад." },
    ],
    actions: [
      { label: "Карточка контеста", href: "/competitions/20" },
      { label: "Арена решения", href: "/competitions/20/contest" },
    ],
  },
];
