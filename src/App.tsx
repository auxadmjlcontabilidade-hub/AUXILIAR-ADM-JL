import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { extractTextFromPdf } from './lib/pdf';
import { parseBankStatement, Transaction } from './lib/gemini';
import { generateExcel } from './lib/excel';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'parsing' | 'done' | 'error'>('idle');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setTransactions([]);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  } as any);

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMessage('');
    try {
      setStatus('extracting');
      const text = await extractTextFromPdf(file);
      
      setStatus('parsing');
      const data = await parseBankStatement(text);
      
      if (data.length === 0) {
        throw new Error("Não foi possível encontrar transações no arquivo. Verifique se o PDF é um extrato bancário válido.");
      }

      setTransactions(data);
      setStatus('done');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "Ocorreu um erro ao processar o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (transactions.length > 0) {
      generateExcel(transactions);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-rose-100 selection:text-rose-900">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-black/5 mb-6"
          >
            <FileSpreadsheet className="w-8 h-8 text-rose-900" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-light tracking-tight mb-3 uppercase"
          >
            Conversor de Extrato
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#9e9e9e] text-lg uppercase"
          >
            Transforme PDFs bancários em Excel para contabilidade em segundos.
          </motion.p>
        </header>

        <main className="space-y-6">
          {/* Upload Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[24px] shadow-sm border border-black/5 p-8"
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center",
                isDragActive ? "border-rose-900 bg-rose-50/50" : "border-[#e5e5e5] hover:border-rose-800 hover:bg-[#fafafa]",
                file ? "border-rose-200 bg-rose-50/20" : ""
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                  file ? "bg-rose-100 text-rose-900" : "bg-[#f5f5f5] text-[#9e9e9e]"
                )}>
                  {file ? <CheckCircle2 className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                </div>
                {file ? (
                  <div>
                    <p className="text-lg font-medium text-[#1a1a1a] mb-1 uppercase">{file.name}</p>
                    <p className="text-sm text-[#9e9e9e] uppercase">{(file.size / 1024).toFixed(1)} KB • PRONTO PARA PROCESSAR</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-[#1a1a1a] mb-1 uppercase">
                      Arraste seu PDF aqui
                    </p>
                    <p className="text-sm text-[#9e9e9e] uppercase">
                      Ou clique para selecionar o arquivo
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleProcess}
                disabled={!file || loading}
                className={cn(
                  "px-8 py-4 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-sm uppercase",
                  !file || loading 
                    ? "bg-[#f5f5f5] text-[#9e9e9e] cursor-not-allowed" 
                    : "bg-[#1a1a1a] text-white hover:bg-rose-900 active:scale-95"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {status === 'extracting' ? 'LENDO PDF...' : 'ANALISANDO TRANSAÇÕES...'}
                  </>
                ) : (
                  'PROCESSAR EXTRATO'
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4"
              >
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 uppercase">Erro no processamento</h3>
                  <p className="text-red-700 text-sm mt-1 uppercase">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            {transactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] shadow-sm border border-black/5 overflow-hidden"
              >
                <div className="p-6 border-bottom border-black/5 flex items-center justify-between bg-[#fafafa]">
                  <div>
                    <h3 className="font-medium text-lg uppercase">Transações Identificadas</h3>
                    <p className="text-sm text-[#9e9e9e] uppercase">{transactions.length} itens encontrados</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-900 text-white rounded-full hover:bg-rose-950 transition-colors shadow-sm text-sm font-medium uppercase"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Excel
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f5f5f5]">
                        <th className="px-6 py-4 text-xs font-semibold text-[#9e9e9e] uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9e9e9e] uppercase tracking-wider">Histórico</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#9e9e9e] uppercase tracking-wider text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-[#fafafa] transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-[#4a4a4a]">{t.data}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a] uppercase">{t.historico}</td>
                          <td className={cn(
                            "px-6 py-4 text-sm font-mono text-right",
                            t.valor < 0 ? "text-red-500" : "text-rose-900"
                          )}>
                            {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-20 text-center text-[#9e9e9e] text-sm uppercase">
          <p>© {new Date().getFullYear()} CONVERSOR DE EXTRATO BANCÁRIO • PROCESSAMENTO SEGURO VIA GEMINI AI</p>
        </footer>
      </div>
    </div>
  );
}
