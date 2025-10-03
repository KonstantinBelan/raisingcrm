import { Bot, Context, session, SessionFlavor } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { HttpError, GrammyError } from 'grammy';

const prisma = new PrismaClient();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

type MyContext = Context & SessionFlavor<Record<string, unknown>>;

export const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// Initialize bot info to avoid initialization error
let botInitialized = false;

export async function initBot() {
  if (!botInitialized) {
    try {
      await bot.init();
      botInitialized = true;
      console.log('Telegram bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize bot:', error);
    }
  }
}

// Session middleware for storing user state
bot.use(session({
  initial: () => ({}),
}));

// OpenRouter API integration for AI message analysis
async function analyzeMessageWithAI(text: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `Ты помощник для анализа сообщений и извлечения информации о задачах. 
            Проанализируй сообщение и верни ТОЛЬКО валидный JSON.
            
            Если в сообщении ОДНА задача - верни один JSON объект.
            Если в сообщении НЕСКОЛЬКО задач - верни несколько JSON объектов подряд (не в массиве).
            
            Каждый JSON объект должен содержать поля:
            - title: краткое название задачи (максимум 100 символов)
            - description: подробное описание
            - priority: LOW/MEDIUM/HIGH
            - dueDate: дата в формате YYYY-MM-DD (если найдена)
            - projectName: название проекта (если упоминается)
            - clientName: имя клиента (если упоминается)
            - category: тип задачи (development, design, meeting, bug, feature, etc.)
            - estimatedHours: примерная оценка времени в часах (если можно определить)
            
            ВАЖНО: Верни ТОЛЬКО JSON объекты, без markdown блоков, без комментариев, без дополнительного текста.
            Начни ответ с { и закончи на }.
            
            Примеры:
            Одна задача: {"title": "...", "priority": "HIGH", ...}
            Две задачи: {"title": "...", ...} {"title": "...", ...}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      try {
        // Извлекаем JSON из ответа (может быть в markdown блоке или с текстом)
        let jsonStr = content.trim();
        
        // Удаляем markdown код блоки если есть
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```\s*/g, '');
        }
        
        // Находим все JSON объекты в тексте (AI может вернуть несколько задач)
        const jsonObjects = [];
        let currentIndex = 0;
        
        while (currentIndex < jsonStr.length) {
          const firstBrace = jsonStr.indexOf('{', currentIndex);
          if (firstBrace === -1) break;
          
          let braceCount = 0;
          let endIndex = firstBrace;
          
          for (let i = firstBrace; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            if (jsonStr[i] === '}') braceCount--;
            
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
          
          const jsonObject = jsonStr.substring(firstBrace, endIndex);
          try {
            const parsed = JSON.parse(jsonObject);
            jsonObjects.push(parsed);
          } catch {
            // Пропускаем невалидный JSON
          }
          
          currentIndex = endIndex;
        }
        
        // Возвращаем массив задач или одну задачу
        return jsonObjects.length > 1 ? jsonObjects : jsonObjects[0] || null;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        console.error('Parse error:', parseError);
        return null;
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error);
  }
  
  return null;
}

// Helper function to parse hashtags from message
function parseHashtags(text: string) {
  const hashtags = text.match(/#\w+/g) || [];
  return hashtags.map(tag => tag.substring(1).toLowerCase());
}

// Enhanced task parsing with AI assistance
async function parseTaskFromMessage(text: string, hashtags: string[]) {
  // Try AI analysis first
  const aiAnalysis = await analyzeMessageWithAI(text);
  
  // If AI returned multiple tasks
  if (Array.isArray(aiAnalysis)) {
    return aiAnalysis.map(task => ({
      title: task.title,
      description: task.description,
      priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      projectName: task.projectName,
      clientName: task.clientName,
      category: task.category,
      estimatedHours: task.estimatedHours,
    }));
  }
  
  // Single task object to return
  const taskData: {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: Date;
    projectName?: string;
    clientName?: string;
    category?: string;
    estimatedHours?: number;
  } = {};

  // If AI returned single task
  if (aiAnalysis) {
    taskData.title = aiAnalysis.title;
    taskData.description = aiAnalysis.description;
    taskData.priority = aiAnalysis.priority;
    taskData.projectName = aiAnalysis.projectName;
    taskData.clientName = aiAnalysis.clientName;
    taskData.category = aiAnalysis.category;
    taskData.estimatedHours = aiAnalysis.estimatedHours;
    
    if (aiAnalysis.dueDate) {
      taskData.dueDate = new Date(aiAnalysis.dueDate);
    }
  } else {
    // Fallback to manual parsing
    const lines = text.split('\n').filter(line => !line.startsWith('#'));
    if (lines.length > 0) {
      taskData.title = lines[0].trim();
      if (lines.length > 1) {
        taskData.description = lines.slice(1).join('\n').trim();
      }
    }

    // Parse priority from hashtags
    if (hashtags.includes('высокий') || hashtags.includes('urgent') || hashtags.includes('срочно')) {
      taskData.priority = 'HIGH';
    } else if (hashtags.includes('средний') || hashtags.includes('medium')) {
      taskData.priority = 'MEDIUM';
    } else {
      taskData.priority = 'LOW';
    }

    // Parse due date from text
    const dateRegex = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
      taskData.dueDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    }

    // Extract client name from hashtags
    const clientTag = hashtags.find(tag => tag.startsWith('клиент'));
    if (clientTag) {
      taskData.clientName = clientTag.replace('клиент', '').trim();
    }

    // Extract project name from hashtags
    const projectTag = hashtags.find(tag => tag.startsWith('проект'));
    if (projectTag) {
      taskData.projectName = projectTag.replace('проект', '').trim();
    }
  }

  return taskData;
}

// Helper function to find or create project and client
async function findOrCreateProjectAndClient(userId: string, taskData: {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  projectName?: string;
  clientName?: string;
  category?: string;
  estimatedHours?: number;
}) {
  let projectId = null;
  let clientId = null;

  // Find or create client
  if (taskData.clientName) {
    let client = await prisma.client.findFirst({
      where: {
        userId,
        name: taskData.clientName as string
      }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: taskData.clientName as string,
          userId,
        }
      });
    }
    clientId = client.id;
  }

  // Find or create project
  if (taskData.projectName) {
    let project = await prisma.project.findFirst({
      where: {
        userId,
        title: taskData.projectName as string
      }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          title: taskData.projectName as string,
          description: `Проект создан автоматически из Telegram`,
          status: 'ACTIVE',
          userId,
          clientId,
        }
      });
    }
    projectId = project.id;
  } else if (clientId) {
    // Try to find active project for the client
    const project = await prisma.project.findFirst({
      where: {
        userId,
        clientId,
        status: 'ACTIVE'
      }
    });
    if (project) {
      projectId = project.id;
    }
  }

  return { projectId, clientId };
}

// Helper function to create task from Telegram message
async function createTaskFromTelegram(
  chatId: number,
  messageId: number,
  userId: string,
  taskData: {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: Date;
    projectName?: string;
    clientName?: string;
    category?: string;
    estimatedHours?: number;
  }
) {
  try {
    // Find or create project and client
    const { projectId } = await findOrCreateProjectAndClient(userId, taskData);

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: taskData.title || 'Задача из Telegram',
        description: taskData.description,
        priority: taskData.priority || 'MEDIUM',
        status: 'TODO',
        dueDate: taskData.dueDate,
        projectId,
        userId,
        source: 'TELEGRAM',
        telegramChatId: chatId.toString(),
        telegramMessageId: messageId.toString(),
      },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    return task;
  } catch (error) {
    console.error('Error creating task from Telegram:', error);
    throw error;
  }
}

// Start command
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🚀 Добро пожаловать в Raising CRM Bot!

Этот бот поможет вам автоматически создавать задачи из сообщений в чатах с помощью ИИ.

📝 Как использовать:
• Отправьте сообщение с описанием задачи
• Бот автоматически проанализирует текст с помощью ИИ
• Создаст задачу с правильными параметрами
• Привяжет к существующим проектам и клиентам

🤖 ИИ анализирует:
• Заголовок и описание задачи
• Приоритет и категорию
• Упоминания клиентов и проектов
• Даты и сроки выполнения
• Оценку времени

🏷️ Дополнительные хештеги:
• #срочно, #высокий - высокий приоритет
• #средний - средний приоритет  
• #клиент[имя] - привязка к клиенту
• #проект[название] - привязка к проекту

Для получения помощи используйте /help
  `;
  
  await ctx.reply(welcomeMessage);
});

// Help command
bot.command('help', async (ctx) => {
  const helpMessage = `
📖 Справка по Raising CRM Bot

🔧 Команды:
/start - Начать работу с ботом
/help - Показать эту справку
/status - Проверить статус подключения
/stats - Статистика созданных задач

📝 Создание задач:
Просто отправьте сообщение с описанием задачи. ИИ автоматически:
• Извлечет заголовок и описание
• Определит приоритет и категорию
• Найдет упоминания клиентов/проектов
• Распознает даты и сроки
• Оценит время выполнения

🤖 Примеры сообщений:
"Исправить баг в форме обратной связи на сайте для клиента Петров до 25 декабря"

"Подготовить презентацию для встречи с новым клиентом на следующей неделе"

"Срочно: доработать дизайн главной страницы, нужно сделать до пятницы"

🏷️ Хештеги (опционально):
#срочно #высокий #urgent - высокий приоритет
#средний #medium - средний приоритет
#клиентИванов - для клиента "Иванов"
#проектСайт - для проекта "Сайт"
  `;
  
  await ctx.reply(helpMessage);
});

// Status command
bot.command('status', async (ctx) => {
  const aiStatus = process.env.OPENROUTER_API_KEY ? '🤖 ИИ анализ включен' : '⚠️ ИИ анализ отключен';
  await ctx.reply(`✅ Бот работает и готов к созданию задач!\n${aiStatus}`);
});

// Stats command
bot.command('stats', async (ctx) => {
  try {
    const chatId = ctx.chat.id.toString();
    
    // Count tasks created from this chat
    const taskCount = await prisma.task.count({
      where: {
        telegramChatId: chatId,
        source: 'TELEGRAM'
      }
    });

    const recentTasks = await prisma.task.findMany({
      where: {
        telegramChatId: chatId,
        source: 'TELEGRAM'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        title: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });

    let statsMessage = `📊 Статистика для этого чата:\n\n`;
    statsMessage += `📋 Всего задач создано: ${taskCount}\n\n`;
    
    if (recentTasks.length > 0) {
      statsMessage += `🕒 Последние задачи:\n`;
      recentTasks.forEach((task: { priority: string; status: string; title: string }, index: number) => {
        const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
        const statusEmoji = task.status === 'DONE' ? '✅' : task.status === 'IN_PROGRESS' ? '🔄' : '📋';
        statsMessage += `${index + 1}. ${statusEmoji} ${priorityEmoji} ${task.title}\n`;
      });
    }

    await ctx.reply(statsMessage);
  } catch (error) {
    console.error('Error getting stats:', error);
    await ctx.reply('❌ Ошибка при получении статистики');
  }
});

// Helper function to get or create user from Telegram
async function getOrCreateUser(telegramId: number, username?: string, firstName?: string) {
  const telegramIdStr = telegramId.toString();
  
  let user = await prisma.user.findUnique({
    where: { telegramId: telegramIdStr }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: telegramIdStr,
        username: username || undefined,
        firstName: firstName || 'Telegram User',
      }
    });
  } else if (username || firstName) {
    // Update user info if it changed
    user = await prisma.user.update({
      where: { telegramId: telegramIdStr },
      data: {
        username: username || user.username,
        firstName: firstName || user.firstName,
      }
    });
  }
  
  return user;
}

// Handle forwarded messages
bot.on('message:forward_origin', async (ctx) => {
  try {
    const text = ctx.message.text || ctx.message.caption;
    if (!text) return;

    const chatId = ctx.chat.id;
    const messageId = ctx.message.message_id;
    
    // Get or create user from Telegram
    const user = await getOrCreateUser(
      ctx.from!.id,
      ctx.from!.username,
      ctx.from!.first_name
    );
    const userId = user.id;
    
    // Parse hashtags
    const hashtags = parseHashtags(text);
    
    // Parse task data from forwarded message
    const taskData = await parseTaskFromMessage(text, hashtags);
    
    // Add context that this is a forwarded message
    taskData.description = `[Пересланное сообщение]\n\n${taskData.description || text}`;
    
    // Create task
    const task = await createTaskFromTelegram(chatId, messageId, userId, taskData);
    
    // Send confirmation
    const confirmationMessage = `
📨 Задача создана из пересланного сообщения!

📋 ${task.title}
🔹 Приоритет: ${task.priority === 'HIGH' ? '🔴 Высокий' : task.priority === 'MEDIUM' ? '🟡 Средний' : '🟢 Низкий'}
${task.dueDate ? `📅 Срок: ${task.dueDate.toLocaleDateString('ru-RU')}` : ''}
${task.project ? `🎯 Проект: ${task.project.title}` : ''}
${task.project?.client ? `👤 Клиент: ${task.project.client.name}` : ''}

ID задачи: ${task.id}
    `;
    
    await ctx.reply(confirmationMessage, {
      reply_to_message_id: messageId
    });
    
  } catch (error) {
    console.error('Error processing forwarded message:', error);
    await ctx.reply('❌ Произошла ошибка при обработке пересланного сообщения.');
  }
});

// Handle all text messages
bot.on('message:text', async (ctx) => {
  try {
    const text = ctx.message.text;
    const chatId = ctx.chat.id;
    const messageId = ctx.message.message_id;
    
    // Skip if message is a command
    if (text.startsWith('/')) {
      return;
    }
    
    // Parse hashtags
    const hashtags = parseHashtags(text);
    
    // Process messages with hashtags or if AI is enabled
    const hasHashtags = hashtags.length > 0;
    const hasAI = !!process.env.OPENROUTER_API_KEY;
    
    if (!hasHashtags && !hasAI) {
      return;
    }
    
    // Get or create user from Telegram
    const user = await getOrCreateUser(
      ctx.from!.id,
      ctx.from!.username,
      ctx.from!.first_name
    );
    const userId = user.id;
    
    // Parse task data from message
    const taskData = await parseTaskFromMessage(text, hashtags);
    
    // Handle multiple tasks
    if (Array.isArray(taskData)) {
      const tasks = [];
      for (const singleTaskData of taskData) {
        if (singleTaskData.title && singleTaskData.title.length >= 5) {
          const task = await createTaskFromTelegram(chatId, messageId, userId, singleTaskData);
          tasks.push(task);
        }
      }
      
      if (tasks.length === 0) {
        return;
      }
      
      // Send confirmation for multiple tasks
      const aiIndicator = hasAI ? '🤖 ' : '';
      let confirmationMessage = `${aiIndicator}✅ Создано задач: ${tasks.length}\n\n`;
      
      tasks.forEach((task, index) => {
        const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
        confirmationMessage += `${index + 1}. ${priorityEmoji} ${task.title}\n`;
        if (task.dueDate) {
          confirmationMessage += `   📅 ${task.dueDate.toLocaleDateString('ru-RU')}\n`;
        }
        if (task.project) {
          confirmationMessage += `   🎯 ${task.project.title}\n`;
        }
        confirmationMessage += '\n';
      });
      
      await ctx.reply(confirmationMessage, {
        reply_to_message_id: messageId
      });
      
      return;
    }
    
    // Handle single task
    // Skip if no meaningful task data extracted
    if (!taskData.title || taskData.title.length < 5) {
      return;
    }
    
    // Create task
    const task = await createTaskFromTelegram(chatId, messageId, userId, taskData);
    
    // Send confirmation
    const aiIndicator = hasAI ? '🤖 ' : '';
    const confirmationMessage = `
${aiIndicator}✅ Задача создана!

📋 ${task.title}
🔹 Приоритет: ${task.priority === 'HIGH' ? '🔴 Высокий' : task.priority === 'MEDIUM' ? '🟡 Средний' : '🟢 Низкий'}
${task.dueDate ? `📅 Срок: ${task.dueDate.toLocaleDateString('ru-RU')}` : ''}
${task.project ? `🎯 Проект: ${task.project.title}` : ''}
${task.project?.client ? `👤 Клиент: ${task.project.client.name}` : ''}
${taskData.category ? `🏷️ Категория: ${taskData.category}` : ''}
${taskData.estimatedHours ? `⏱️ Оценка: ${taskData.estimatedHours}ч` : ''}

ID задачи: ${task.id}
    `;
    
    await ctx.reply(confirmationMessage, {
      reply_to_message_id: messageId
    });
    
  } catch (error) {
    console.error('Error processing message:', error);
    await ctx.reply('❌ Произошла ошибка при создании задачи. Попробуйте еще раз.');
  }
});

// Error handler
bot.catch((err) => {
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});
