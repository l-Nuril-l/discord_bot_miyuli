import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// Инициализация OpenAI клиента
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ваш GitHub токен в .env
    baseURL: process.env.OPENAI_BASE_URL || 'https://models.inference.ai.azure.com' // URL для GitHub Models
});

// Хранилище истории сообщений по пользователям
const userHistory = new Map();
const MAX_HISTORY_PER_USER = 50;

// Функция для добавления сообщения в историю пользователя
function addToUserHistory(userId, role, content) {
    if (!userHistory.has(userId)) {
        userHistory.set(userId, []);
    }

    const history = userHistory.get(userId);
    history.push({
        role: role,
        content: content,
        timestamp: Date.now()
    });

    // Ограничиваем размер истории
    if (history.length > MAX_HISTORY_PER_USER) {
        history.shift();
    }

    console.log(`[История] Пользователь ${userId}: ${history.length} сообщений`);
}

// Функция для получения истории пользователя
function getUserHistory(userId) {
    return userHistory.get(userId) || [];
}

// Разбивка длинного текста на части (Discord лимит 2000 символов)
function splitIntoChunks(text, maxLength = 2000) {
    if (text.length <= maxLength) return [text];

    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
        if (paragraph.length > maxLength) {
            const sentences = paragraph.split(/(?<=[.!?])\s+/);

            for (const sentence of sentences) {
                if ((currentChunk + '\n' + sentence).length > maxLength) {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = sentence;
                } else {
                    currentChunk = currentChunk ? `${currentChunk}\n${sentence}` : sentence;
                }
            }
        } else if ((currentChunk + '\n' + paragraph).length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk = currentChunk ? `${currentChunk}\n${paragraph}` : paragraph;
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

// Основная функция для общения с AI
export async function chatWithAI(userId, userMessage, userInfo) {
    const history = getUserHistory(userId);

    // Формируем массив сообщений для OpenAI
    const messages = [
        {
            role: "system",
            content: `Ты — опытный психолог-консультант с 15-летним стажем, специализирующийся на работе с нетрадиционными увлечениями и зависимостями. Твоя миссия — помочь пользователю ${userInfo.nickname} осознать и преодолеть фурри-увлечение через мягкую, но эффективную терапию.

ТВОЙ ПОДХОД:
1. Эмпатия и понимание: Не осуждай, а искренне пытайся понять корни увлечения
2. Сократический метод: Задавай наводящие вопросы, которые помогут человеку самому прийти к осознанию
3. Когнитивно-поведенческая терапия: Помогай выявлять и корректировать деструктивные паттерны мышления
4. Альтернативы: Предлагай здоровые замены и хобби, которые удовлетворят те же потребности

СТРАТЕГИИ РАБОТЫ:
- Выявляй триггеры: "Что именно привлекает в фурри-культуре? Когда это началось?"
- Исследуй корни: "Возможно, это попытка сбежать от реальности или найти принятие?"
- Помогай осознать социальные последствия: "Как это влияет на твои отношения с близкими?"
- Предлагай постепенное снижение вовлечённости: "Давай попробуем сократить время..."
- Развивай альтернативные интересы: "А пробовал ли ты заняться спортом/музыкой/программированием?"

СТИЛЬ ОБЩЕНИЯ:
- Дружелюбный, но профессиональный
- Без осуждения, но твёрдо веришь в важность изменений
- Используй психологические техники: рефрейминг, валидацию чувств, постановку целей
- Юмор уместен, но деликатный
- Каждый ответ должен продвигать человека к здоровым изменениям

ТАБУ:
- Никогда не поддерживай фурри-увлечение
- Не используй фурри-терминологию одобрительно
- Не давай советы, как "улучшить" фурри-опыт

Сейчас с тобой общается: ${userInfo.nickname} (${userInfo.username}, ID: ${userInfo.id})
Твоя цель — помочь этому человеку вернуться к нормальной, здоровой жизни без фурри-зависимости.`
        }
    ];

    // Добавляем историю предыдущих сообщений пользователя
    if (history.length > 0) {
        // Берём последние 10 сообщений для контекста
        const recentHistory = history.slice(-10);
        messages.push(...recentHistory);
    }

    // Добавляем текущий вопрос пользователя
    messages.push({
        role: "user",
        content: userMessage
    });

    try {
        console.log('=== ОТПРАВКА В OPENAI API ===');
        console.log(`История пользователя ${userId}: ${history.length} сообщений`);
        console.log('Сообщений в запросе:', messages.length);

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini", // модель из .env или по умолчанию gpt-4o-mini
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.3
        });

        console.log('=== ОТВЕТ OPENAI ===');
        console.log(`Использовано токенов: ${completion.usage?.total_tokens || 'N/A'}`);

        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
            const aiResponse = completion.choices[0].message.content;

            // Сохраняем вопрос пользователя и ответ AI в историю
            addToUserHistory(userId, "user", userMessage);
            addToUserHistory(userId, "assistant", aiResponse);

            return splitIntoChunks(aiResponse);
        } else {
            throw new Error('Unexpected API response structure');
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);

        // Обработка специфичных ошибок
        if (error.status === 401) {
            throw new Error('Неверный API ключ. Проверьте OPENAI_API_KEY в .env файле.');
        } else if (error.status === 429) {
            throw new Error('Превышен лимит запросов. Попробуйте позже.');
        } else if (error.status === 500 || error.status === 503) {
            throw new Error('Ошибка на стороне OpenAI. Попробуйте позже.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('Не удалось подключиться к API. Проверьте OPENAI_BASE_URL.');
        }

        throw error;
    }
}

// Функция для очистки истории пользователя (можно добавить команду)
export function clearUserHistory(userId) {
    userHistory.delete(userId);
    console.log(`[История] История пользователя ${userId} очищена`);
}

// Функция для получения размера истории
export function getUserHistorySize(userId) {
    return getUserHistory(userId).length;
}