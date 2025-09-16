import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { telegramId: '123456789' },
    update: {},
    create: {
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      isPremium: false,
    },
  });

  console.log('✅ Created test user:', testUser.firstName);

  // Create test clients
  const client1 = await prisma.client.create({
    data: {
      name: 'ООО "Технологии"',
      email: 'contact@tech-company.ru',
      phone: '+7 (495) 123-45-67',
      company: 'ООО "Технологии"',
      notes: 'Крупная IT-компания, работаем уже 2 года',
      userId: testUser.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Иван Петров',
      email: 'ivan.petrov@example.com',
      phone: '+7 (903) 123-45-67',
      company: 'ИП Петров И.В.',
      notes: 'Индивидуальный предприниматель, интернет-магазин',
      userId: testUser.id,
    },
  });

  console.log('✅ Created test clients');

  // Create test projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Интернет-магазин электроники',
      description: 'Разработка современного интернет-магазина с каталогом товаров, корзиной и системой оплаты',
      status: 'ACTIVE',
      budget: 150000,
      currency: 'RUB',
      deadline: new Date('2024-12-31'),
      priority: 'HIGH',
      userId: testUser.id,
      clientId: client1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Мобильное приложение для доставки',
      description: 'iOS и Android приложение для службы доставки еды',
      status: 'ACTIVE',
      budget: 200000,
      currency: 'RUB',
      deadline: new Date('2025-02-15'),
      priority: 'MEDIUM',
      userId: testUser.id,
      clientId: client2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Корпоративный сайт',
      description: 'Создание корпоративного сайта с админ-панелью',
      status: 'COMPLETED',
      budget: 80000,
      currency: 'RUB',
      deadline: new Date('2024-10-01'),
      priority: 'LOW',
      userId: testUser.id,
      clientId: client1.id,
    },
  });

  console.log('✅ Created test projects');

  // Create test tasks
  const tasks = [
    {
      title: 'Дизайн главной страницы',
      description: 'Создать макет главной страницы интернет-магазина',
      status: 'DONE',
      priority: 'HIGH',
      estimatedHours: 8,
      actualHours: 6,
      deadline: new Date('2024-11-15'),
      projectId: project1.id,
    },
    {
      title: 'Разработка каталога товаров',
      description: 'Реализовать функционал каталога с фильтрацией и поиском',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 16,
      actualHours: 8,
      deadline: new Date('2024-11-30'),
      projectId: project1.id,
    },
    {
      title: 'Интеграция платежной системы',
      description: 'Подключить Stripe/YooKassa для приема платежей',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedHours: 12,
      deadline: new Date('2024-12-15'),
      projectId: project1.id,
    },
    {
      title: 'UI/UX дизайн приложения',
      description: 'Создать дизайн-систему и макеты всех экранов',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 24,
      actualHours: 12,
      deadline: new Date('2024-12-01'),
      projectId: project2.id,
    },
    {
      title: 'Разработка API',
      description: 'Backend API для мобильного приложения',
      status: 'TODO',
      priority: 'HIGH',
      estimatedHours: 32,
      deadline: new Date('2025-01-15'),
      projectId: project2.id,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        userId: testUser.id,
      },
    });
  }

  console.log('✅ Created test tasks');

  // Create test payments
  const payments = [
    {
      amount: 50000,
      currency: 'RUB',
      status: 'PAID',
      description: 'Предоплата 50% за интернет-магазин',
      dueDate: new Date('2024-11-01'),
      paidDate: new Date('2024-10-28'),
      projectId: project1.id,
    },
    {
      amount: 100000,
      currency: 'RUB',
      status: 'PENDING',
      description: 'Финальный платеж за интернет-магазин',
      dueDate: new Date('2024-12-31'),
      projectId: project1.id,
    },
    {
      amount: 80000,
      currency: 'RUB',
      status: 'PAID',
      description: 'Полная оплата за корпоративный сайт',
      dueDate: new Date('2024-10-01'),
      paidDate: new Date('2024-09-30'),
      projectId: project3.id,
    },
    {
      amount: 60000,
      currency: 'RUB',
      status: 'OVERDUE',
      description: 'Предоплата за мобильное приложение',
      dueDate: new Date('2024-11-01'),
      projectId: project2.id,
    },
  ];

  for (const paymentData of payments) {
    await prisma.payment.create({
      data: {
        ...paymentData,
        userId: testUser.id,
      },
    });
  }

  console.log('✅ Created test payments');

  // Create test reminders
  const reminders = [
    {
      title: 'Дедлайн по макетам',
      message: 'Завтра дедлайн по сдаче макетов для интернет-магазина',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      sent: false,
      projectId: project1.id,
    },
    {
      title: 'Просроченный платеж',
      message: 'Клиент задерживает предоплату за мобильное приложение',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2 hours
      sent: false,
      projectId: project2.id,
    },
  ];

  for (const reminderData of reminders) {
    await prisma.reminder.create({
      data: {
        ...reminderData,
        userId: testUser.id,
      },
    });
  }

  console.log('✅ Created test reminders');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
