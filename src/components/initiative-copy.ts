import type { Initiative } from "@/types/city";

// Presentation translations only; costs, impacts and IDs remain in the dataset.
const copy: Record<string, { name: string; description: string }> = {
  "transport-bus": { name: "Выделенные полосы для автобусов", description: "Ускоряют поездки на автобусе. Строительство временно сокращает зелёные зоны." },
  "transport-junctions": { name: "Безопасные перекрёстки", description: "Улучшение переходов и перекрёстков. Выигрыш во времени поездки меньше." },
  "transport-rail": { name: "Развитие скоростного транспорта", description: "Сильнее улучшает доступность. Строительство мешает работе городских служб." },
  "greening-trees": { name: "Деревья вдоль улиц", description: "Больше тени в районах. Уход за деревьями увеличивает нагрузку на городские службы." },
  "greening-parks": { name: "Связная сеть парков", description: "Больше зелёных коридоров и мест отдыха. Земляные работы замедляют транспорт." },
  "greening-pockets": { name: "Скверы у дома", description: "Небольшие зелёные пространства рядом с жильём. Ограниченный эффект для всего города." },
  "social-clinics": { name: "Районные поликлиники", description: "Улучшают доступ к медицинской помощи и устойчивость районов." },
  "social-schools": { name: "Школы и общественные центры", description: "Расширяют доступ к социальной инфраструктуре. Новые объекты увеличивают движение рядом." },
  "social-outreach": { name: "Мобильная помощь жителям", description: "Недорогие адресные услуги. Ограниченные возможности в долгосрочной перспективе." },
  "safety-lighting": { name: "Освещение и безопасные маршруты", description: "Более светлые пешеходные маршруты и безопасные общественные пространства." },
  "safety-response": { name: "Станции экстренного реагирования", description: "Ускоряют помощь в экстренных ситуациях. Увеличивают нагрузку на городские службы." },
  "safety-community": { name: "Районные команды безопасности", description: "Профилактика и работа с жителями. Умеренный прирост безопасности." },
  "services-water": { name: "Обновление водопровода и сетей", description: "Повышает надёжность коммунальных услуг. Дорожные работы временно замедляют транспорт." },
  "services-digital": { name: "Цифровое окно городских услуг", description: "Ускоряет типовые обращения. Жителям без цифрового доступа нужна помощь." },
  "services-waste": { name: "Уборка улиц и переработка", description: "Надёжный вывоз отходов улучшает чистоту и состояние зелёных зон." },
};

export function initiativeCopy(initiative: Initiative) {
  return copy[initiative.id] ?? { name: initiative.name, description: initiative.description ?? "" };
}
