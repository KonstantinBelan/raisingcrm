import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

  private formatDateTime(date: string | Date): string {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ru });
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
    
    // Title
    doc.setFontSize(16);
    doc.text(options.title, 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(`Дата создания: ${this.formatDateTime(new Date())}`, 20, 30);
    }

    // Table data
    const tableData = projects.map(project => [
      project.title,
      project.client?.name || 'Без клиента',
      project.status,
      project.budget ? this.formatCurrency(project.budget) : 'Не указан',
      project.deadline ? this.formatDate(project.deadline) : 'Не указан',
      project._count?.tasks || 0,
    ]);

    doc.autoTable({
      head: [['Название', 'Клиент', 'Статус', 'Бюджет', 'Дедлайн', 'Задач']],
      body: tableData,
      startY: options.includeDate ? 40 : 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${options.filename}.pdf`);
  }

  exportTasksToPDF(tasks: any[], options: ExportOptions): void {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(options.title, 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(`Дата создания: ${this.formatDateTime(new Date())}`, 20, 30);
    }

    const tableData = tasks.map(task => [
      task.title,
      task.project?.title || 'Без проекта',
      task.status,
      task.priority,
      task.dueDate ? this.formatDate(task.dueDate) : 'Не указан',
      task.estimatedHours || 'Не указано',
    ]);

    doc.autoTable({
      head: [['Название', 'Проект', 'Статус', 'Приоритет', 'Дедлайн', 'Часов']],
      body: tableData,
      startY: options.includeDate ? 40 : 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${options.filename}.pdf`);
  }

  exportPaymentsToPDF(payments: any[], options: ExportOptions): void {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(options.title, 20, 20);
    
    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(`Дата создания: ${this.formatDateTime(new Date())}`, 20, 30);
    }

    const tableData = payments.map(payment => [
      payment.description,
      payment.project?.title || 'Без проекта',
      this.formatCurrency(payment.amount),
      payment.currency,
      payment.status,
      payment.dueDate ? this.formatDate(payment.dueDate) : 'Не указан',
    ]);

    doc.autoTable({
      head: [['Описание', 'Проект', 'Сумма', 'Валюта', 'Статус', 'Дата']],
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
    let currentY = 20;

    // Title
    doc.setFontSize(16);
    doc.text(options.title, 20, currentY);
    currentY += 10;

    if (options.includeDate) {
      doc.setFontSize(10);
      doc.text(`Дата создания: ${this.formatDateTime(new Date())}`, 20, currentY);
      currentY += 15;
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      doc.setFontSize(12);
      doc.text('Проекты', 20, currentY);
      currentY += 5;

      const projectData = data.projects.map(project => [
        project.title,
        project.client?.name || 'Без клиента',
        project.status,
        project.budget ? this.formatCurrency(project.budget) : 'Не указан',
      ]);

      doc.autoTable({
        head: [['Название', 'Клиент', 'Статус', 'Бюджет']],
        body: projectData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tasks
    if (data.tasks && data.tasks.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text('Задачи', 20, currentY);
      currentY += 5;

      const taskData = data.tasks.slice(0, 10).map(task => [
        task.title,
        task.project?.title || 'Без проекта',
        task.status,
        task.priority,
      ]);

      doc.autoTable({
        head: [['Название', 'Проект', 'Статус', 'Приоритет']],
        body: taskData,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [34, 197, 94] },
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
