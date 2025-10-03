'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  CheckSquare,
  Users,
  CreditCard,
  FolderOpen,
  Bell,
  Loader2
} from 'lucide-react';
import { dataExporter } from '@/lib/export';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ExportManagerProps {
  className?: string;
}

type ExportType = 'projects' | 'tasks' | 'clients' | 'payments' | 'reminders' | 'all';
type ExportFormat = 'pdf' | 'excel';

const exportOptions = [
  {
    type: 'projects' as ExportType,
    label: 'Проекты',
    icon: FolderOpen,
    description: 'Список всех проектов с клиентами и статусами',
  },
  {
    type: 'tasks' as ExportType,
    label: 'Задачи',
    icon: CheckSquare,
    description: 'Все задачи с приоритетами и дедлайнами',
  },
  {
    type: 'clients' as ExportType,
    label: 'Клиенты',
    icon: Users,
    description: 'Контактная информация клиентов',
  },
  {
    type: 'payments' as ExportType,
    label: 'Платежи',
    icon: CreditCard,
    description: 'История платежей и счетов',
  },
  {
    type: 'reminders' as ExportType,
    label: 'Напоминания',
    icon: Bell,
    description: 'Запланированные напоминания',
  },
  {
    type: 'all' as ExportType,
    label: 'Все данные',
    icon: Download,
    description: 'Полный экспорт всех данных',
  },
];

export function ExportManager({ className }: ExportManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(['projects']);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [filename, setFilename] = useState('');
  const [includeDate, setIncludeDate] = useState(true);

  const getDefaultFilename = () => {
    const date = format(new Date(), 'yyyy-MM-dd', { locale: ru });
    if (selectedTypes.length === 1) {
      const type = selectedTypes[0];
      const typeNames = {
        projects: 'проекты',
        tasks: 'задачи',
        clients: 'клиенты',
        payments: 'платежи',
        reminders: 'напоминания',
        all: 'все-данные',
      };
      return `${typeNames[type]}-${date}`;
    }
    return `crm-данные-${date}`;
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) return;

    setLoading(true);
    try {
      const finalFilename = filename || getDefaultFilename();
      const exportOptions = {
        title: 'Экспорт данных CRM',
        filename: finalFilename,
        includeDate,
      };

      // Fetch data for selected types
      const data: any = {};
      
      for (const type of selectedTypes) {
        if (type === 'all') {
          // Fetch all data types
          const [projects, tasks, clients, payments, reminders] = await Promise.all([
            fetch('/api/projects').then(r => r.json()),
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/clients').then(r => r.json()),
            fetch('/api/payments').then(r => r.json()),
            fetch('/api/reminders').then(r => r.json()),
          ]);

          data.projects = projects.projects || [];
          data.tasks = tasks.tasks || [];
          data.clients = clients.clients || [];
          data.payments = payments.payments || [];
          data.reminders = reminders.reminders || [];
          break;
        } else {
          const response = await fetch(`/api/${type}`);
          const result = await response.json();
          data[type] = result[type] || [];
        }
      }

      // Export based on format and selected types
      if (selectedTypes.includes('all')) {
        if (exportFormat === 'pdf') {
          dataExporter.exportAllDataToPDF(data, exportOptions);
        } else {
          dataExporter.exportAllDataToExcel(data, exportOptions);
        }
      } else if (selectedTypes.length === 1) {
        const type = selectedTypes[0];
        const typeData = data[type];

        if (exportFormat === 'pdf') {
          switch (type) {
            case 'projects':
              dataExporter.exportProjectsToPDF(typeData, exportOptions);
              break;
            case 'tasks':
              dataExporter.exportTasksToPDF(typeData, exportOptions);
              break;
            case 'payments':
              dataExporter.exportPaymentsToPDF(typeData, exportOptions);
              break;
            default:
              // For other types, use Excel format
              dataExporter.exportAllDataToExcel({ [type]: typeData }, exportOptions);
          }
        } else {
          switch (type) {
            case 'projects':
              dataExporter.exportProjectsToExcel(typeData, exportOptions);
              break;
            case 'tasks':
              dataExporter.exportTasksToExcel(typeData, exportOptions);
              break;
            case 'clients':
              dataExporter.exportClientsToExcel(typeData, exportOptions);
              break;
            case 'payments':
              dataExporter.exportPaymentsToExcel(typeData, exportOptions);
              break;
            case 'reminders':
              dataExporter.exportRemindersToExcel(typeData, exportOptions);
              break;
          }
        }
      } else {
        // Multiple types selected - use combined export
        if (exportFormat === 'pdf') {
          dataExporter.exportAllDataToPDF(data, exportOptions);
        } else {
          dataExporter.exportAllDataToExcel(data, exportOptions);
        }
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: ExportType, checked: boolean) => {
    if (type === 'all') {
      setSelectedTypes(checked ? ['all'] : []);
    } else {
      setSelectedTypes(prev => {
        const filtered = prev.filter(t => t !== 'all');
        if (checked) {
          return [...filtered, type];
        } else {
          return filtered.filter(t => t !== type);
        }
      });
    }
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Экспорт данных
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Экспорт данных</DialogTitle>
            <DialogDescription>
              Выберите данные для экспорта и формат файла
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Export Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Что экспортировать:</Label>
              <div className="grid grid-cols-2 gap-3">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedTypes.includes(option.type);
                  const isDisabled = selectedTypes.includes('all') && option.type !== 'all';
                  
                  return (
                    <div
                      key={option.type}
                      className={`
                        flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isDisabled && handleTypeToggle(option.type, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Формат файла:</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${exportFormat === 'excel' ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => setExportFormat('excel')}
                >
                  <Checkbox checked={exportFormat === 'excel'} />
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">Excel (.xlsx)</div>
                      <div className="text-xs text-muted-foreground">Таблицы с данными</div>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${exportFormat === 'pdf' ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => setExportFormat('pdf')}
                >
                  <Checkbox checked={exportFormat === 'pdf'} />
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-sm">PDF (.pdf)</div>
                      <div className="text-xs text-muted-foreground">Документ для печати</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename">Имя файла (опционально):</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={getDefaultFilename()}
              />
              <p className="text-xs text-muted-foreground">
                Если не указано, будет использовано имя по умолчанию с текущей датой
              </p>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDate"
                checked={includeDate}
                onCheckedChange={(checked) => setIncludeDate(checked === true)}
              />
              <Label htmlFor="includeDate" className="text-sm">
                Включить дату создания в файл
              </Label>
            </div>

            {/* Summary */}
            {selectedTypes.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Будет экспортировано:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedTypes.map(type => {
                    const option = exportOptions.find(o => o.type === type);
                    return (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {option?.label}
                      </Badge>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Формат: {exportFormat === 'excel' ? 'Excel' : 'PDF'} • 
                  Файл: {filename || getDefaultFilename()}.{exportFormat === 'excel' ? 'xlsx' : 'pdf'}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={selectedTypes.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Экспортировать
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
