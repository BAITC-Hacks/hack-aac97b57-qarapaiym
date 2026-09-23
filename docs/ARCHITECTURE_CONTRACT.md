# Architecture contract — official case

Источник требований: `docs/OFFICIAL_CASE.md`. TypeScript/React/Next.js; данные в JSON; OpenAI только для объяснений. Точные типы: `src/types/city.ts`.

- Category: transport, greening, social, safety, services.
- Metric: T1,T2,E1,E2,S1,S2,B1,B2,C1,C2.
- District: id, name, population (доля, сумма1), metrics.
- Initiative: id M1–M14, category, name, cost, scope district/city, lag, effects (полные).
- Selection: массив `{initiativeId,districtId?}`, ровно5 уникальных мер, максимум2 одной категории.
- `validateSelection(dataset,selection,requireComplete=true)` проверяет количество, повторы, районы, бюджет и конфликты. UI использует false только для построения неполного плана; окончательный расчёт и API — true.
- `simulateScenario` валидирует данные/решения, канонически сортирует меры, применяет лаги, фиксированные синергии, clamp, официальную формулу. Порядок ввода не влияет на результат.
- Result: valid, validationErrors, budget, selection, selectedInitiatives, baseline, projected, delta, contributions, synergies. При ошибке projected/delta null, contributions/synergies пусты. Baseline — справочное исходное состояние.
- Snapshot: overall, byCategory, districts (10 metrics + score), weightedAverage, worstDistrictScore, criticalCount. Категорийные средние вспомогательные. Score и прирост округляются независимо из неокруглённых расчётов.
- `POST /api/analyze` принимает Result, повторно рассчитывает его по серверному набору и требует полное совпадение. Невалидный/подменённый результат получает400 до запроса провайдеру.
- AI возвращает summary, strengths, risks, tradeoffs, recommendations. Сервер проверяет JSON/evidence; свободный текст не имеет гарантии полной фактической корректности. Провайдер не меняет расчёты.
- UI при изменении/сбросе очищает результат и AI, отменяет устаревший запрос. Сохранённый A — отдельный снимок только в памяти страницы.
