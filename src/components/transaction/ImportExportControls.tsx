'use client'

import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTransactions, useImportTransactions, type ImportSummary } from '@/hooks/useTransactions'
import { useCategories, usePaymentSources, useIncomeSources } from '@/hooks/useCategories'
import { downloadTransactionsExcel, parseTransactionsExcelFile, type ImportRowError } from '@/lib/transactionsExcel'

interface ImportResult {
  summary: ImportSummary | null
  errors: ImportRowError[]
}

export function ImportExportControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: allTransactions = [] } = useTransactions({})
  const { data: categories = [] } = useCategories()
  const { data: paymentSources = [] } = usePaymentSources()
  const { data: incomeSources = [] } = useIncomeSources()
  const importTx = useImportTransactions()

  function handleExport() {
    downloadTransactionsExcel(allTransactions)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsProcessing(true)
    try {
      let parsed
      try {
        parsed = await parseTransactionsExcelFile(file, { categories, paymentSources, incomeSources })
      } catch {
        setResult({ summary: null, errors: [{ row: 0, message: 'Não foi possível ler o arquivo. Verifique se é um .xlsx válido.' }] })
        return
      }

      const { rows, errors } = parsed
      let summary: ImportSummary | null = null
      if (rows.length > 0) {
        try {
          summary = await importTx.mutateAsync(rows)
        } catch {
          setResult({ summary: null, errors: [{ row: 0, message: 'Não foi possível salvar os lançamentos no banco de dados. Tente novamente.' }] })
          return
        }
      }
      setResult({ summary, errors })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download size={14} />
          Exportar
        </Button>
        <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isProcessing} className="gap-1.5">
          <Upload size={14} />
          {isProcessing ? 'Importando…' : 'Importar'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      <Dialog open={!!result} onOpenChange={v => { if (!v) setResult(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da importação</DialogTitle>
          </DialogHeader>

          {result && (
            <div className="flex flex-col gap-3 text-sm">
              {result.summary && (
                <p>
                  <strong>{result.summary.created}</strong> criado(s), <strong>{result.summary.updated}</strong> atualizado(s)
                  {result.errors.length > 0 && <>, <strong>{result.errors.length}</strong> com erro</>}.
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  {result.errors.map((err, i) => (
                    <div key={i} className="px-3 py-2 text-xs border-b border-border/50 last:border-0">
                      <span className="font-medium">
                        {err.row > 0 ? `Linha ${err.row}` : 'Arquivo'}
                      </span>
                      {' — '}
                      <span className="text-muted-foreground">{err.message}</span>
                    </div>
                  ))}
                </div>
              )}
              {!result.summary && result.errors.length === 0 && (
                <p className="text-muted-foreground">Nenhum lançamento encontrado na planilha.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResult(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
