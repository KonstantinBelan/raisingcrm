import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ExportData {
  projects?: any[];
  tasks?: any[];
  clients?: any[];
  payments?: any[];
  reminders?: any[];
}

interface ExportOptions {
  title: string;
  filename: string;
  includeDate?: boolean;
}

export class DataExporter {
  private formatDate(date: string | Date): string {
    return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
  }

  private formatDateTime(date: Date): string {
    return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
  }

  private transliterate(text: string): string {
    // Транслитерация русских символов в латинские для совместимости с PDF
    const transliterationMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.replace(/[а-яёА-ЯЁ]/g, (match) => transliterationMap[match] || match);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  }

  // PDF Export Methods
  exportProjectsToPDF(projects: any[], options: ExportOptions): void {
    const doc = new jsPDF();
    
    // Configure font for Cyrillic support
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(16);
    // Convert Cyrillic to Latin transliteration for PDF compatibility
    const title = this.transliterate(options.title);
    doc.text(title, 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      const dateText = this.transliterate(`Data sozdaniya: ${this.formatDateTime(new Date())}`);
      doc.text(dateText, 20, 30);
    }

    // Table data with transliteration
    const tableData = projects.map(project => [
      this.transliterate(project.title),
      this.transliterate(project.client?.name || 'Bez klienta'),
      this.transliterate(project.status),
      project.budget ? this.formatCurrency(project.budget) : this.transliterate('Ne ukazan'),
      project.deadline ? this.formatDate(project.deadline) : this.transliterate('Ne ukazan'),
      project._count?.tasks || 0,
    ]);

    autoTable(doc, {
      head: [['Nazvanie', 'Klient', 'Status', 'Byudzhet', 'Dedlayn', 'Zadach']],
      body: tableData,
      startY: options.includeDate ? 40 : 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${options.filename}.pdf`);
  }

  exportTasksToPDF(tasks: any[], options: ExportOptions): void {
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    doc.setFontSize(16);
    doc.text(this.transliterate(options.title), 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(this.transliterate(`Data sozdaniya: ${this.formatDateTime(new Date())}`), 20, 30);
    }

    const tableData = tasks.map(task => [
      this.transliterate(task.title),
      this.transliterate(task.project?.title || 'Bez proekta'),
      this.transliterate(task.status),
      this.transliterate(task.priority),
      task.dueDate ? this.formatDate(task.dueDate) : this.transliterate('Ne ukazan'),
      task.estimatedHours || this.transliterate('Ne ukazano'),
    ]);

    autoTable(doc, {
      head: [['Nazvanie', 'Proekt', 'Status', 'Prioritet', 'Dedlayn', 'Chasov']],
      body: tableData,
      startY: options.includeDate ? 40 : 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${options.filename}.pdf`);
  }

  exportPaymentsToPDF(payments: any[], options: ExportOptions): void {
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    doc.setFontSize(16);
    doc.text(this.transliterate(options.title), 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(this.transliterate(`Data sozdaniya: ${this.formatDateTime(new Date())}`), 20, 30);
    }

    const tableData = payments.map(payment => [
      this.transliterate(payment.description),
      this.transliterate(payment.project?.title || 'Bez proekta'),
      this.formatCurrency(payment.amount),
      payment.currency,
      this.transliterate(payment.status),
      payment.dueDate ? this.formatDate(payment.dueDate) : this.transliterate('Ne ukazan'),
    ]);

    autoTable(doc, {
      head: [['Opisanie', 'Proekt', 'Summa', 'Valyuta', 'Status', 'Data']],
      body: tableData,
      startY: options.includeDate ? 40 : 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${options.filename}.pdf`);
  }

  // Excel Export Methods
  exportProjectsToExcel(projects: any[], options: ExportOptions): void {
    const data = projects.map(project => ({
      'Название': project.title,
      'Описание': project.description || '',
      'Клиент': project.client?.name || 'Без клиента',
      'Статус': project.status,
      'Бюджет': project.budget || 0,
      'Валюта': project.currency || 'RUB',
      'Дедлайн': project.deadline ? this.formatDate(project.deadline) : '',
      'Количество задач': project._count?.tasks || 0,
      'Количество платежей': project._count?.payments || 0,
      'Дата создания': this.formatDateTime(project.createdAt),
      'Последнее обновление': this.formatDateTime(project.updatedAt),
    }));

    this.createExcelFile(data, options);
  }

  exportTasksToExcel(tasks: any[], options: ExportOptions): void {
    const data = tasks.map(task => ({
      'Название': task.title,
      'Описание': task.description || '',
      'Проект': task.project?.title || 'Без проекта',
      'Статус': task.status,
      'Приоритет': task.priority,
      'Дедлайн': task.dueDate ? this.formatDate(task.dueDate) : '',
      'Планируемые часы': task.estimatedHours || 0,
      'Фактические часы': task.actualHours || 0,
      'Дата создания': this.formatDateTime(task.createdAt),
      'Последнее обновление': this.formatDateTime(task.updatedAt),
    }));

    this.createExcelFile(data, options);
  }

  exportPaymentsToExcel(payments: any[], options: ExportOptions): void {
    const data = payments.map(payment => ({
      'Описание': payment.description,
      'Проект': payment.project?.title || 'Без проекта',
      'Сумма': payment.amount,
      'Валюта': payment.currency,
      'Статус': payment.status,
      'Тип': payment.type,
      'Дата платежа': payment.dueDate ? this.formatDate(payment.dueDate) : '',
      'Дата создания': this.formatDateTime(payment.createdAt),
      'Последнее обновление': this.formatDateTime(payment.updatedAt),
    }));

    this.createExcelFile(data, options);
  }

  exportClientsToExcel(clients: any[], options: ExportOptions): void {
    const data = clients.map(client => ({
      'Название': client.name,
      'Email': client.email || '',
      'Телефон': client.phone || '',
      'Компания': client.company || '',
      'Адрес': client.address || '',
      'Количество проектов': client._count?.projects || 0,
      'Дата создания': this.formatDateTime(client.createdAt),
      'Последнее обновление': this.formatDateTime(client.updatedAt),
    }));

    this.createExcelFile(data, options);
  }

  exportRemindersToExcel(reminders: any[], options: ExportOptions): void {
    const data = reminders.map(reminder => ({
      'Заголовок': reminder.title,
      'Сообщение': reminder.message,
      'Проект': reminder.project?.title || 'Без проекта',
      'Задача': reminder.task?.title || 'Без задачи',
      'Запланировано на': this.formatDateTime(reminder.scheduledAt),
      'Отправлено': reminder.sent ? 'Да' : 'Нет',
      'Дата создания': this.formatDateTime(reminder.createdAt),
    }));

    this.createExcelFile(data, options);
  }

  // Combined export methods
  exportAllDataToPDF(data: ExportData, options: ExportOptions): void {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    let currentY = 20;

    // Title
    doc.setFontSize(16);
    doc.text(this.transliterate(options.title), 20, currentY);
    currentY += 10;

    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(this.transliterate(`Data sozdaniya: ${this.formatDateTime(new Date())}`), 20, currentY);
      currentY += 15;
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      doc.setFontSize(12);
      doc.text(this.transliterate('Proekty'), 20, currentY);
      currentY += 5;

      const projectData = data.projects.map(project => [
        this.transliterate(project.title),
        this.transliterate(project.client?.name || 'Bez klienta'),
        this.transliterate(project.status),
        project.budget ? this.formatCurrency(project.budget) : this.transliterate('Ne ukazan'),
      ]);

      autoTable(doc, {
        head: [[this.transliterate('Nazvanie'), this.transliterate('Klient'), this.transliterate('Status'), this.transliterate('Byudzhet')]],
        body: projectData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tasks
    if (data.tasks && data.tasks.length > 0) {
      doc.setFontSize(12);
      doc.text(this.transliterate('Zadachi'), 20, currentY);
      currentY += 5;

      const taskData = data.tasks.slice(0, 10).map(task => [
        this.transliterate(task.title),
        this.transliterate(task.project?.title || 'Bez proekta'),
        this.transliterate(task.status),
        this.transliterate(task.priority),
      ]);

      autoTable(doc, {
        head: [[this.transliterate('Nazvanie'), this.transliterate('Proekt'), this.transliterate('Status'), this.transliterate('Prioritet')]],
        body: taskData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Clients
    if (data.clients && data.clients.length > 0) {
      doc.setFontSize(12);
      doc.text(this.transliterate('Klienty'), 20, currentY);
      currentY += 5;

      const clientData = data.clients.map(client => [
        this.transliterate(client.name),
        this.transliterate(client.email || 'Ne ukazan'),
        this.transliterate(client.phone || 'Ne ukazan'),
        this.transliterate(client.company || 'Ne ukazana'),
      ]);

      autoTable(doc, {
        head: [[this.transliterate('Imya'), this.transliterate('Email'), this.transliterate('Telefon'), this.transliterate('Kompaniya')]],
        body: clientData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [168, 85, 247] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Payments
    if (data.payments && data.payments.length > 0) {
      doc.setFontSize(12);
      doc.text(this.transliterate('Platezhi'), 20, currentY);
      currentY += 5;

      const paymentData = data.payments.slice(0, 10).map(payment => [
        this.transliterate(payment.description),
        this.transliterate(payment.project?.title || 'Bez proekta'),
        this.formatCurrency(payment.amount),
        this.transliterate(payment.status),
      ]);

      autoTable(doc, {
        head: [[this.transliterate('Opisanie'), this.transliterate('Proekt'), this.transliterate('Summa'), this.transliterate('Status')]],
        body: paymentData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [245, 158, 11] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Reminders
    if (data.reminders && data.reminders.length > 0) {
      doc.setFontSize(12);
      doc.text(this.transliterate('Napominaniya'), 20, currentY);
      currentY += 5;

      const reminderData = data.reminders.slice(0, 10).map(reminder => [
        this.transliterate(reminder.title),
        this.transliterate(reminder.message || 'Net soobscheniya'),
        this.formatDateTime(reminder.scheduledAt),
        reminder.sent ? this.transliterate('Da') : this.transliterate('Net'),
      ]);

      autoTable(doc, {
        head: [[this.transliterate('Zagolovok'), this.transliterate('Soobschenie'), this.transliterate('Zaplanirovan na'), this.transliterate('Otpravlen')]],
        body: reminderData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    doc.save(`${options.filename}.pdf`);
  }

  exportAllDataToExcel(data: ExportData, options: ExportOptions): void {
    const workbook = XLSX.utils.book_new();

    // Projects sheet
    if (data.projects && data.projects.length > 0) {
      const projectsData = data.projects.map(project => ({
        'Название': project.title,
        'Клиент': project.client?.name || 'Без клиента',
        'Статус': project.status,
        'Бюджет': project.budget || 0,
        'Дедлайн': project.deadline ? this.formatDate(project.deadline) : '',
        'Задач': project._count?.tasks || 0,
      }));
      
      const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Проекты');
    }

    // Tasks sheet
    if (data.tasks && data.tasks.length > 0) {
      const tasksData = data.tasks.map(task => ({
        'Название': task.title,
        'Проект': task.project?.title || 'Без проекта',
        'Статус': task.status,
        'Приоритет': task.priority,
        'Дедлайн': task.dueDate ? this.formatDate(task.dueDate) : '',
      }));
      
      const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Задачи');
    }

    // Clients sheet
    if (data.clients && data.clients.length > 0) {
      const clientsData = data.clients.map(client => ({
        'Название': client.name,
        'Email': client.email || '',
        'Телефон': client.phone || '',
        'Проектов': client._count?.projects || 0,
      }));
      
      const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Клиенты');
    }

    // Payments sheet
    if (data.payments && data.payments.length > 0) {
      const paymentsData = data.payments.map(payment => ({
        'Описание': payment.description,
        'Проект': payment.project?.title || 'Без проекта',
        'Сумма': payment.amount,
        'Статус': payment.status,
        'Дата': payment.dueDate ? this.formatDate(payment.dueDate) : '',
      }));
      
      const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Платежи');
    }

    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  }

  private createExcelFile(data: any[], options: ExportOptions): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные');
    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  }
}

// Export singleton instance
export const dataExporter = new DataExporter();
