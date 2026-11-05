// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { db } from './db'
import { localDate } from './domain'

afterEach(async () => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  await db.delete()
  await db.open()
})

describe('finance workflow', () => {
  it('creates expense and income, reflects real totals, edits and deletes records', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)

    await screen.findByText('Merhaba 👋')

    // Record an expense using quick entry.
    fireEvent.click(screen.getByRole('button', { name: 'Hızlı kayıt ekle' }))
    const expenseDialog = screen.getByRole('dialog')
    fireEvent.change(within(expenseDialog).getByLabelText(/Tutar/), { target: { value: '125.50' } })
    fireEvent.change(within(expenseDialog).getByLabelText(/Açıklama/), { target: { value: 'Test market alışverişi' } })
    fireEvent.click(within(expenseDialog).getByRole('button', { name: /Kaydet/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Add income through the same quick-entry sheet.
    fireEvent.click(screen.getByRole('button', { name: 'Hızlı kayıt ekle' }))
    const incomeDialog = screen.getByRole('dialog')
    fireEvent.click(within(incomeDialog).getByRole('button', { name: 'Gelir' }))
    fireEvent.change(within(incomeDialog).getByLabelText(/Tutar/), { target: { value: '2500' } })
    fireEvent.change(within(incomeDialog).getByLabelText(/Açıklama/), { target: { value: 'Test gelir' } })
    fireEvent.click(within(incomeDialog).getByRole('button', { name: /Kaydet/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Finance totals and transaction history are derived from IndexedDB records.
    fireEvent.click(screen.getAllByRole('button', { name: 'Finans' })[0])
    expect(await screen.findByText('Test market alışverişi')).toBeInTheDocument()
    expect(screen.getByText('Test gelir')).toBeInTheDocument()
    expect(screen.getAllByText('₺125,50').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₺2.500,00').length).toBeGreaterThan(0)

    // Edit the expense and confirm that the changed value is shown.
    fireEvent.click(screen.getByRole('button', { name: /Test market alışverişi/ }))
    const editDialog = screen.getByRole('dialog')
    const amount = within(editDialog).getByLabelText(/Tutar/)
    fireEvent.change(amount, { target: { value: '200' } })
    fireEvent.click(within(editDialog).getByRole('button', { name: /Değişiklikleri kaydet/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect((await screen.findAllByText('₺200,00')).length).toBeGreaterThan(0)

    // Delete the edited record and ensure it no longer appears in finance history.
    const expenseRow = screen.getByText('Test market alışverişi').closest('.record-row')
    expect(expenseRow).not.toBeNull()
    fireEvent.click(within(expenseRow as HTMLElement).getByRole('button', { name: 'Kaydı sil' }))
    await waitFor(() => expect(screen.queryByText('Test market alışverişi')).not.toBeInTheDocument())
    expect(await db.transactions.count()).toBe(1)
  })

  it('shows income, expenses, net balance and income categories in statistics', async () => {
    const today = localDate()
    const timestamp = new Date().toISOString()
    await db.categories.add({ id:'salary', name:'Maaş', kind:'income', color:'#51a989', localDate:today, createdAt:timestamp, updatedAt:timestamp })
    await db.categories.add({ id:'food', name:'Yemek', kind:'expense', color:'#ec9a55', localDate:today, createdAt:timestamp, updatedAt:timestamp })
    await db.transactions.bulkAdd([
      { id:'income-stat', kind:'income', amountMinor:350000, categoryId:'salary', description:'Aylık maaş', occurredAt:`${today}T09:00`, localDate:today, createdAt:timestamp, updatedAt:timestamp },
      { id:'expense-stat', kind:'expense', amountMinor:87500, categoryId:'food', description:'Market', occurredAt:`${today}T10:00`, localDate:today, createdAt:timestamp, updatedAt:timestamp },
    ])
    render(<App />)
    await screen.findByText('Merhaba 👋')
    fireEvent.click(screen.getByRole('button', { name:'Daha' }))
    fireEvent.click(screen.getAllByRole('button', { name:'İstatistikler' }).at(-1)!)

    expect(await screen.findByText('Gelir kategorileri')).toBeInTheDocument()
    expect(screen.getByText('Maaş')).toBeInTheDocument()
    expect(screen.getByText('Yemek')).toBeInTheDocument()
    expect(screen.getAllByText('₺3.500,00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₺875,00').length).toBeGreaterThan(0)
    expect(screen.getByText('₺2.625,00')).toBeInTheDocument()
  })

  it('lets me mark a task complete and undo completion from the Tasks screen', async () => {
    const today = localDate()
    const timestamp = new Date().toISOString()
    await db.tasks.add({ id:'task-completion', kind:'task', title:'Send the report', dueDate:today, priority:'high', completed:false, localDate:today, createdAt:timestamp, updatedAt:timestamp })
    render(<App />)
    await screen.findByText('Merhaba 👋')
    fireEvent.click(screen.getAllByRole('button', { name:'Görevler' })[0])

    const completeButton = await screen.findByRole('button', { name:'Görevi tamamla' })
    fireEvent.click(completeButton)
    await waitFor(async () => expect((await db.tasks.get('task-completion'))?.completed).toBe(true))
    await waitFor(() => expect(screen.getByRole('button', { name:'Tamamlandı işaretini kaldır' })).toHaveAttribute('aria-pressed', 'true'))

    fireEvent.click(screen.getByRole('button', { name:'Tamamlandı işaretini kaldır' }))
    await waitFor(async () => expect((await db.tasks.get('task-completion'))?.completed).toBe(false))
    await waitFor(() => expect(screen.getByRole('button', { name:'Görevi tamamla' })).toHaveAttribute('aria-pressed', 'false'))
  })
})
