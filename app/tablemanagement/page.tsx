'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, Trash2, QrCode, Download } from 'lucide-react'
import { db } from '../../lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore'
import QRCode from 'qrcode'
import { AlertDialog } from "../../components/ui/alert-dialog"
import Image from 'next/image'

type Table = {
  id: string
  number: string
  capacity: number
  isOccupied: boolean
  qrCode?: string
}

export default function ManageTablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const fetchTables = async () => {
    const tablesCollection = collection(db, 'tables')
    const tableSnapshot = await getDocs(tablesCollection)
    const tableList = tableSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table))
    const sortedTables = tableList.sort((a, b) => {
      const aNum = parseInt(a.number)
      const bNum = parseInt(b.number)
      return isNaN(aNum) || isNaN(bNum) ? a.number.localeCompare(b.number) : aNum - bNum
    })
    setTables(sortedTables)
  }

  const addTable = async () => {
    if (newTableNumber && newTableCapacity) {
      try {
        const tablesRef = collection(db, 'tables')
        const q = query(tablesRef, where('number', '==', newTableNumber))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          showAlert('A table with this number already exists.')
          return
        }

        const newTable: Omit<Table, 'id'> = {
          number: newTableNumber,
          capacity: parseInt(newTableCapacity),
          isOccupied: false,
        }
        const docRef = await addDoc(collection(db, 'tables'), newTable)
        const tableWithId = { id: docRef.id, ...newTable }
        
        setTables(prevTables => {
          const updatedTables = [...prevTables, tableWithId]
          return updatedTables.sort((a, b) => {
            const aNum = parseInt(a.number)
            const bNum = parseInt(b.number)
            return isNaN(aNum) || isNaN(bNum) ? a.number.localeCompare(b.number) : aNum - bNum
          })
        })
        
        setNewTableNumber('')
        setNewTableCapacity('')
      } catch (error) {
        console.error('Error adding table:', error)
        showAlert('An error occurred while adding the table. Please try again.')
      }
    }
  }

  const deleteTable = async (id: string) => {
    await deleteDoc(doc(db, 'tables', id))
    setTables(tables.filter(table => table.id !== id))
  }

  const toggleTableOccupancy = async (id: string) => {
    const tableToUpdate = tables.find(table => table.id === id)
    if (tableToUpdate) {
      const updatedTable = { ...tableToUpdate, isOccupied: !tableToUpdate.isOccupied }
      await updateDoc(doc(db, 'tables', id), { isOccupied: updatedTable.isOccupied })
      setTables(tables.map(table => table.id === id ? updatedTable : table))
    }
  }

  const generateQRCode = useCallback(async (table: Table) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(`https://your-domain.com/table/${table.id}`)
      setSelectedTable({ ...table, qrCode: qrCodeDataUrl })
      setShowQRCode(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }, [])

  const downloadQRCode = useCallback(() => {
    if (selectedTable?.qrCode) {
      const link = document.createElement('a')
      link.href = selectedTable.qrCode
      link.download = `table_${selectedTable.number}_qr_code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [selectedTable])

  const showAlert = (message: string) => {
    setAlertMessage(message)
    setIsAlertOpen(true)
  }

  useEffect(() => {
    fetchTables()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Tables and QR Codes</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Table Number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              className="flex-1 p-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="Capacity"
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={addTable}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
            >
              <PlusCircle className="mr-2" size={20} />
              Add Table
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Table {table.number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{table.capacity} seats</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        table.isOccupied
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {table.isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleTableOccupancy(table.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      {table.isOccupied ? 'Mark Available' : 'Mark Occupied'}
                    </button>
                    <button
                      onClick={() => generateQRCode(table)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <QrCode size={20} />
                    </button>
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showQRCode && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">QR Code for Table {selectedTable.number}</h2>
            <div className="flex justify-center mb-4">
              {selectedTable.qrCode && (
                <Image 
                  src={selectedTable.qrCode} 
                  alt={`QR Code for Table ${selectedTable.number}`}
                  width={200}
                  height={200}
                />
              )}
            </div>
            <button
              onClick={downloadQRCode}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Download className="mr-2" size={20} />
              Download QR Code
            </button>
            <button
              onClick={() => setShowQRCode(false)}
              className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={() => setIsAlertOpen(false)}
        title="Error"
        message={alertMessage}
        confirmText="OK"
      />
    </div>
  )
}