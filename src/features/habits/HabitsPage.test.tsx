// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import HabitsPage from './HabitsPage'
import { db } from '../../db'

afterEach(async()=>{cleanup();vi.restoreAllMocks();await db.delete();await db.open()})

describe('habits experience',()=>{
  it('creates, tracks, edits, archives, restores and deletes a habit',async()=>{
    const onRefresh=vi.fn(async()=>{}),onNotice=vi.fn()
    vi.spyOn(window,'confirm').mockReturnValue(true)
    render(<HabitsPage onRefresh={onRefresh} onNotice={onNotice}/> )

    fireEvent.click(screen.getByRole('button',{name:'Alışkanlık ekle'}))
    const createDialog=screen.getByLabelText('Ad').closest('form') as HTMLFormElement
    fireEvent.change(within(createDialog).getByLabelText('Ad'),{target:{value:'Kitap oku'}})
    fireEvent.change(within(createDialog).getByLabelText('Açıklama (isteğe bağlı)'),{target:{value:'Her gün birkaç sayfa'}})
    fireEvent.click(within(createDialog).getByRole('button',{name:'Oluştur'}))
    await screen.findByText('Kitap oku')
    expect(await db.habits.count()).toBe(1)

    // Mark today complete directly in the recent-day grid, then inspect its details.
    const today=new Date(),todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    fireEvent.click(screen.getByRole('button',{name:`Kitap oku, ${todayKey}: Aksadı`}))
    await waitFor(async()=>expect(await db.completions.where({habitId:(await db.habits.toArray())[0].id,localDate:todayKey}).count()).toBe(1))
    await screen.findByRole('button',{name:`Kitap oku, ${todayKey}: Tamamlandı`})
    fireEvent.click(screen.getByRole('button',{name:'Kitap oku'}))
    expect(await screen.findByText('ALIŞKANLIK DETAYI')).toBeInTheDocument()
    expect(screen.getAllByText('100%')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button',{name:'Alışkanlıklara dön'}))

    // Edit the habit and verify the update persists.
    fireEvent.click(screen.getByRole('button',{name:'Kitap oku işlemleri'}))
    fireEvent.click(screen.getByRole('button',{name:'Düzenle'}))
    const editDialog=screen.getByLabelText('Ad').closest('form') as HTMLFormElement
    fireEvent.change(within(editDialog).getByLabelText('Ad'),{target:{value:'Kitap oku 10 dakika'}})
    fireEvent.click(within(editDialog).getByRole('button',{name:'Kaydet'}))
    expect(await screen.findByText('Kitap oku 10 dakika')).toBeInTheDocument()
    expect((await db.habits.toArray())[0].title).toBe('Kitap oku 10 dakika')

    // Archive and restore without deleting completion history.
    fireEvent.click(screen.getByRole('button',{name:'Kitap oku 10 dakika işlemleri'}))
    fireEvent.click(screen.getByRole('button',{name:'Arşivle'}))
    await waitFor(async()=>expect((await db.habits.toArray())[0].archived).toBe(true))
    fireEvent.click(await screen.findByRole('button',{name:'Arşiv 1'}))
    fireEvent.click(screen.getByRole('button',{name:'Kitap oku 10 dakika işlemleri'}))
    fireEvent.click(screen.getByRole('button',{name:'Arşivden çıkar'}))
    await waitFor(async()=>expect((await db.habits.toArray())[0].archived).toBe(false))
    await screen.findByRole('button',{name:'Aktif 1'})
    expect(await db.completions.count()).toBe(1)

    // Deletion explicitly confirms and removes the habit's history as requested.
    fireEvent.click(screen.getByRole('button',{name:'Aktif 1'}))
    fireEvent.click(screen.getByRole('button',{name:'Kitap oku 10 dakika işlemleri'}))
    fireEvent.click(screen.getByRole('button',{name:'Sil'}))
    await waitFor(async()=>expect(await db.habits.count()).toBe(0))
    expect(await db.completions.count()).toBe(0)
  })

  it('creates a flexible weekly frequency target',async()=>{
    render(<HabitsPage onRefresh={async()=>{}} onNotice={()=>{}}/>)
    fireEvent.click(screen.getByRole('button',{name:'Alışkanlık ekle'}))
    const dialog=screen.getByLabelText('Ad').closest('form') as HTMLFormElement
    fireEvent.change(within(dialog).getByLabelText('Ad'),{target:{value:'Haftada üç kez spor'}})
    fireEvent.change(within(dialog).getByLabelText('Sıklık'),{target:{value:'weekly'}})
    fireEvent.change(within(dialog).getByLabelText('Hedef (kez / hafta)'),{target:{value:'3'}})
    fireEvent.click(within(dialog).getByRole('button',{name:'Oluştur'}))
    await screen.findByText('3 kez / hafta')
    expect((await db.habits.toArray())[0].frequency).toMatchObject({period:'weekly',target:3})
  })
})
