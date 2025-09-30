import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react'
import { supplierAPI } from '../lib/api'
import { dateUtils, statusUtils } from '../lib/utils'
import AppointmentForm from './AppointmentForm'

const SupplierDashboard = ({ user, token }) => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentWeek, setCurrentWeek] = useState(dateUtils.getWeekStart())
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)

  const loadAppointments = async (weekStart) => {
    try {
      setLoading(true)
      const weekStartISO = dateUtils.toISODate(weekStart)
      const data = await supplierAPI.getAppointments(weekStartISO)
      setAppointments(data)
      setError('')
    } catch (err) {
      setError('Erro ao carregar agendamentos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments(currentWeek)
  }, [currentWeek])

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() - 7)
    setCurrentWeek(newWeek)
  }

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + 7)
    setCurrentWeek(newWeek)
  }

  const handleCreateAppointment = () => {
    setEditingAppointment(null)
    setShowForm(true)
  }

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment)
    setShowForm(true)
  }

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      await supplierAPI.deleteAppointment(appointmentId)
      await loadAppointments(currentWeek)
    } catch (err) {
      setError('Erro ao excluir agendamento: ' + err.message)
    }
  }

  const handleFormSubmit = async () => {
    setShowForm(false)
    setEditingAppointment(null)
    await loadAppointments(currentWeek)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAppointment(null)
  }

  const weekDates = dateUtils.getWeekDates(currentWeek)
  const weekEnd = dateUtils.getWeekEnd(currentWeek)

  // Agrupar agendamentos por data
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = appointment.date
    if (!acc[date]) acc[date] = []
    acc[date].push(appointment)
    return acc
  }, {})

  if (showForm) {
    return (
      <AppointmentForm
        appointment={editingAppointment}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
          <p className="text-gray-600">Gerencie seus agendamentos de carga</p>
        </div>
        <Button onClick={handleCreateAppointment} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navegação da Semana */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">
              {dateUtils.formatDate(currentWeek)} - {dateUtils.formatDate(weekEnd)}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Grade da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateISO = dateUtils.toISODate(date)
          const dayAppointments = appointmentsByDate[dateISO] || []
          const isToday = dateUtils.isToday(date)
          const isPast = dateUtils.isPast(date)

          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-blue-500' : ''} ${isPast ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {dateUtils.getDayName(date)}
                </CardTitle>
                <CardDescription className="text-xs">
                  {dateUtils.formatDate(date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayAppointments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhum agendamento
                  </p>
                ) : (
                  dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 bg-gray-50 rounded-lg border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium">
                            {dateUtils.formatTime(appointment.time)}
                          </span>
                        </div>
                        <Badge className={`text-xs ${statusUtils.getStatusColor(appointment.status)}`}>
                          {statusUtils.getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-900">
                          PO: {appointment.purchase_order}
                        </p>
                        <p className="text-xs text-gray-600">
                          {appointment.truck_plate} - {appointment.driver_name}
                        </p>
                      </div>

                      {appointment.status === 'scheduled' && (
                        <div className="flex gap-1 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'checked_out').length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SupplierDashboard
