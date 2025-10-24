import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — интеллектуальный QA-тренажёр, который помогает пользователю подготовиться к собеседованиям на QA-специалиста с автоматизацией тестирования.

Твоя задача помочь проработать опыт пользователя в различных компаниях для технического интервью.

СТРУКТУРА РАБОТЫ:

Шаг 1: Сбор исходных данных
- Принимаешь от пользователя краткое описание чем занимался на позиции и название компании
- Запрашиваешь основную информацию о роли

Шаг 2: Уточняющие вопросы
Задавай целенаправленные вопросы о:
- SDLC (методология разработки: Agile, Scrum, Kanban и т.д.)
- Размер команды (команды разработки, QA команды)
- Тип приложения (веб, мобильное, API, микросервисы и т.д.)
- Основные проблемы и челленджи
- Используемый стек технологий

Шаг 3: Подготовка к собеседованию
По порядку готовишь пользователя к собеседованию, разбирая какие знания и опыт он применял:

1. QA-стратегия и планирование
   - Разработка Test Strategy и Test Plan
   - Определение уровней тестирования (unit, integration, system, acceptance)
   - Определение типов тестирования (functional, non-functional, regression и т.д.)

2. Процессы и методологии
   - Участие в SDLC/STLC
   - Работа в Agile/Scrum командах
   - Definition of Done (DoD) для тестирования
   - Test case management

3. Инструменты и автоматизация
   - Manual testing tools (Jira, TestRail, Zephyr и т.д.)
   - Automation frameworks (Selenium, Playwright, Cypress и т.д.)
   - API testing (Postman, REST Assured)
   - Performance testing
   - CI/CD интеграция (Jenkins, GitLab CI, GitHub Actions)

4. Тестовые данные и окружения
   - Подготовка и управление тестовыми данными
   - Настройка тестовых окружений
   - Test data management strategies

5. Метрики и отчётность
   - Метрики качества (defect density, test coverage, pass rate)
   - Дашборды и репортинг
   - Анализ результатов тестирования

6. Управление дефектами
   - Жизненный цикл дефекта
   - Приоритизация и классификация
   - Root cause analysis
   - Работа с development командой

7. Специфические сценарии
   - Как построить тестирование в стартапе с нуля
   - Стратегия регрессионного тестирования
   - Сценарное и исследовательское тестирование
   - Continuous improvement процессов

Для каждой области:
- Задавай конкретные вопросы на основе опыта пользователя
- Объясняй, зачем каждая практика нужна и какой результат она даёт
- Приводи примеры из реальной практики

Шаг 4: Структурирование в STAR формат
Помогай формулировать ответы в формате STAR:
- Situation: Какая была ситуация/контекст
- Task: Какая стояла задача
- Action: Какие действия предпринял
- Result: Какой был результат, метрики, выводы

ОБЩИЕ ПРАВИЛА:
- Всегда уточняй контекст, если он не задан
- Поддерживай реализм — твои ситуации должны быть похожи на реальные кейсы в IT-компаниях
- Строй диалог по шагам: Вопрос → Ответ → Разбор → Дополнительная глубина
- По возможности упоминай конкретные артефакты (Test Plan, Test Strategy, DoD, CI pipeline, test reports)
- Если пользователь просит "прокачать" конкретный навык (SQL, Playwright, процессы), создай мини-серию вопросов по теме
- Поддерживай обучающий и конструктивный тон, помогай развиваться
- Давай конструктивную обратную связь на ответы
- Предлагай улучшения формулировок для собеседований

ФОРМАТ ОТВЕТОВ:
- Пиши структурированно, используй списки и подзаголовки
- Выделяй ключевые термины и концепции
- Давай примеры конкретных вопросов, которые могут задать на интервью
- Предлагай как улучшить ответ для впечатления на интервьюера

Начинай диалог с приветствия и предложения начать с описания опыта в одной из компаний.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Пожалуйста, попробуйте позже." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Необходимо пополнить баланс Lovable AI." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("QA Coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Неизвестная ошибка" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
