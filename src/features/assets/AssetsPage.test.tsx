// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import AssetsPage from './AssetsPage'
import { db } from '../../db'

afterEach(async()=>{cleanup();await db.delete();await db.open()})

it('keeps separate holdings and recalculates their aggregate through create, edit, and delete',async()=>{
  const onNotice=vi.fn()
  render(<AssetsPage language="tr" onNotice={onNotice}/> )

  const addHolding=async(quantity:string,location:string,price:string,expectedTotal:string)=>{
    fireEvent.click(screen.getAllByRole('button',{name:'Varlık ekle'})[0])
    const form=screen.getByRole('combobox',{name:'Varlık türü'}).closest('form') as HTMLFormElement
    await within(form).findByRole('option',{name:'Altın'})
    fireEvent.change(within(form).getByLabelText('Varlık türü'),{target:{value:'Altın'}})
    fireEvent.change(within(form).getByLabelText('Miktar'),{target:{value:quantity}})
    fireEvent.change(within(form).getByLabelText('Birim'),{target:{value:'gram'}})
    fireEvent.change(within(form).getByLabelText('Konum'),{target:{value:location}})
    const priceInput=within(form).queryByLabelText('Birim fiyat (isteğe bağlı)')
    if(priceInput)fireEvent.change(priceInput,{target:{value:price}})
    fireEvent.click(within(form).getByRole('button',{name:'Varlık ekle'}))
    await waitFor(()=>expect(screen.queryByRole('combobox',{name:'Varlık türü'})).not.toBeInTheDocument())
    await waitFor(()=>expect(screen.getByRole('button',{name:/Altın/})).toHaveTextContent(`${expectedTotal} gram`))
  }

  await addHolding('1','Desk drawer','3000','1')
  await addHolding('1','Bank safe','3100','2')
  expect(await db.assetHoldings.count()).toBe(2)
  const goldCard=screen.getByRole('button',{name:/Altın/})
  expect(goldCard).toHaveTextContent('2 gram')
  expect(goldCard).not.toHaveTextContent(/TRY|₺|USD|EUR/)
  fireEvent.click(goldCard)
  expect(await screen.findByText('Desk drawer')).toBeInTheDocument()
  expect(screen.getByText('Bank safe')).toBeInTheDocument()
  expect(screen.getByText('Toplam').compareDocumentPosition(screen.getByText('Desk drawer'))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByText('Toplam').closest('section')).toHaveTextContent('2 gram')

  const drawerRow=screen.getByText('Desk drawer').closest('article') as HTMLElement
  fireEvent.click(within(drawerRow).getByRole('button',{name:'Düzenle Altın'}))
  const editForm=screen.getByRole('combobox',{name:'Varlık türü'}).closest('form') as HTMLFormElement
  fireEvent.change(within(editForm).getByLabelText('Miktar'),{target:{value:'2'}})
  fireEvent.change(within(editForm).getByLabelText('Tarih'),{target:{value:'2024-02-05'}})
  fireEvent.click(within(editForm).getByRole('button',{name:'Değişiklikleri kaydet'}))
  expect(await screen.findByText('3 gram')).toBeInTheDocument()
  expect(screen.queryByText(/₺|USD|EUR/)).not.toBeInTheDocument()
  expect(screen.getByText(/Tarih: 05\.02\.2024/)).toBeInTheDocument()

  const updatedDrawer=screen.getByText('Desk drawer').closest('article') as HTMLElement
  fireEvent.click(within(updatedDrawer).getByRole('button',{name:'Sil Altın'}))
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button',{name:'Sil'}))
  expect(await screen.findByText('1 gram')).toBeInTheDocument()
  expect(await db.assetHoldings.count()).toBe(1)
})

it('lets the user create and immediately select an asset type category',async()=>{
  render(<AssetsPage language="tr" onNotice={vi.fn()}/> )
  fireEvent.click(screen.getAllByRole('button',{name:'Varlık ekle'})[0])
  const form=screen.getByRole('combobox',{name:'Varlık türü'}).closest('form') as HTMLFormElement
  fireEvent.click(within(form).getByRole('button',{name:'Varlık türü ekle'}))
  fireEvent.change(within(form).getByLabelText('Yeni varlık türü'),{target:{value:'Kripto'}})
  fireEvent.click(within(form).getByRole('button',{name:'Tür oluştur'}))
  await waitFor(async()=>expect(await db.assetTypes.where('name').equals('Kripto').count()).toBe(1))
  expect(within(form).getByRole('combobox',{name:'Varlık türü'})).toHaveValue('Kripto')
  fireEvent.change(within(form).getByLabelText('Miktar'),{target:{value:'0.25'}})
  fireEvent.change(within(form).getByLabelText('Birim'),{target:{value:'BTC'}})
  fireEvent.click(within(form).getByRole('button',{name:'Varlık ekle'}))
  await waitFor(async()=>expect(await db.assetHoldings.where('assetType').equals('Kripto').count()).toBe(1))
  expect(await screen.findByRole('button',{name:/Kripto/})).toHaveTextContent('0,25 BTC')

  fireEvent.click(screen.getByRole('button',{name:'Varlık türlerini yönet'}))
  const categoryRow=screen.getByText('Kripto').closest('article') as HTMLElement
  fireEvent.click(within(categoryRow).getByRole('button',{name:'Düzenle Kripto'}))
  const editForm=screen.getByRole('heading',{name:'Varlık türünü düzenle'}).closest('form') as HTMLFormElement
  fireEvent.change(within(editForm).getByLabelText('Varlık türü'),{target:{value:'Dijital varlık'}})
  fireEvent.click(within(editForm).getByRole('button',{name:'Değişiklikleri kaydet'}))
  await waitFor(async()=>expect(await db.assetHoldings.where('assetType').equals('Dijital varlık').count()).toBe(1))
  expect(await db.assetTypes.where('name').equals('Dijital varlık').count()).toBe(1)
  expect(await db.assetTypes.where('name').equals('Kripto').count()).toBe(0)
  expect(screen.getByText('Dijital varlık')).toBeInTheDocument()
})

it('does not seed duplicate built-in asset categories under Strict Mode',async()=>{
  render(<StrictMode><AssetsPage language="tr" onNotice={vi.fn()}/></StrictMode>)
  await screen.findByText('Henüz varlık yok')
  await waitFor(async()=>expect(await db.assetTypes.where('name').equals('Altın').count()).toBe(1))
  fireEvent.click(screen.getAllByRole('button',{name:'Varlık ekle'})[0])
  const form=screen.getByRole('combobox',{name:'Varlık türü'}).closest('form') as HTMLFormElement
  expect(within(form).getAllByRole('option',{name:'Altın'})).toHaveLength(1)
})

it('migrates the old default cash type to TRY and preserves its holding',async()=>{
  const now=new Date().toISOString()
  await db.assetTypes.add({id:'legacy-cash',name:'Nakit',isDefault:true,createdAt:now,updatedAt:now})
  await db.assetHoldings.add({id:'cash-holding',assetType:'Nakit',quantity:1250,unit:'TRY',location:'Wallet',description:'',localDate:'2026-11-07',createdAt:now,updatedAt:now})
  render(<AssetsPage language="tr" onNotice={vi.fn()}/> )
  expect(await screen.findByRole('button',{name:/TRY/})).toHaveTextContent('1.250 TRY')
  expect(await db.assetTypes.where('name').equals('TRY').count()).toBe(1)
  expect(await db.assetTypes.where('name').equals('Nakit').count()).toBe(0)
  expect(await db.assetHoldings.get('cash-holding')).toMatchObject({assetType:'TRY',quantity:1250,location:'Wallet'})
})

it.each(['TRY','EUR','USD'])('uses %s as the fixed unit for its holdings',async currency=>{
  render(<AssetsPage language="tr" onNotice={vi.fn()}/> )
  await screen.findByText('Henüz varlık yok')
  fireEvent.click(screen.getAllByRole('button',{name:'Varlık ekle'})[0])
  const form=screen.getByRole('combobox',{name:'Varlık türü'}).closest('form') as HTMLFormElement
  await within(form).findByRole('option',{name:currency})
  fireEvent.change(within(form).getByRole('combobox',{name:'Varlık türü'}),{target:{value:currency}})
  expect(within(form).getByLabelText('Birim')).toHaveValue(currency)
  expect(within(form).getByLabelText('Birim')).toHaveAttribute('readonly')
  fireEvent.change(within(form).getByLabelText('Miktar'),{target:{value:'25'}})
  fireEvent.click(within(form).getByRole('button',{name:'Varlık ekle'}))
  await waitFor(async()=>expect(await db.assetHoldings.where('assetType').equals(currency).count()).toBe(1))
  expect(await db.assetHoldings.where('assetType').equals(currency).first()).toMatchObject({unit:currency,quantity:25})
})

it('deletes an unused custom asset type without changing holdings',async()=>{
  await db.assetTypes.add({id:'custom-unused',name:'Koleksiyon',isDefault:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})
  render(<AssetsPage language="tr" onNotice={vi.fn()}/> )
  await screen.findByText('Henüz varlık yok')
  fireEvent.click(screen.getByRole('button',{name:'Varlık türlerini yönet'}))
  const typeRow=await screen.findByText('Koleksiyon')
  fireEvent.click(within(typeRow.closest('article') as HTMLElement).getByRole('button',{name:'Sil Koleksiyon'}))
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button',{name:'Sil'}))
  await waitFor(async()=>expect(await db.assetTypes.get('custom-unused')).toBeUndefined())
  expect(await db.assetHoldings.count()).toBe(0)
  await waitFor(()=>expect(screen.queryByText('Koleksiyon')).not.toBeInTheDocument())
})
