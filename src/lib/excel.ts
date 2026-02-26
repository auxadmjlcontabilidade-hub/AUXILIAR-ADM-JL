import * as XLSX from 'xlsx';
import { Transaction } from './gemini';

export function generateExcel(transactions: Transaction[]) {
  const data = transactions.map(t => ({
    'data': t.data,
    'debito': '',
    'credito': '',
    'valor': t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }),
    'cod.historico': '',
    'historico': t.historico.toUpperCase()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Extrato");

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `extrato_convertido_${new Date().getTime()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
