import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  LogIn, 
  LogOut, 
  Edit,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  Ban
} from 'lucide-react'
import { adminAPI } from '../lib/api'
import { dateUtils, statusUtils } from '../lib/utils'
import SupplierForm from './SupplierForm'
import SupplierManagement from './SupplierManagement'
import ScheduleConfig from './ScheduleConfig'
import DefaultScheduleConfig from './DefaultScheduleConfig'
import AppointmentEditForm from './AppointmentEditForm'

const AdminDashboard = ({ user, token }) => {
  const [suppliers, setSuppliers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentWeek, setCurrentWeek] = useState(dateUtils.getWeekStart())
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [showSupplierManagement, setShowSupplierManagement] = useState(false)
  const [managingSupplier, setManagingSupplier] = useState(null)
  const [showScheduleConfig, setShowScheduleConfig] = useState(false)
  const [showDefaultScheduleConfig, setShowDefaultScheduleConfig] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('appointments')

  const loadSuppliers = async () => {
    try {
      const data = await adminAPI.getSuppliers()
      setSuppliers(data)
    } catch (err) {
      setError('Erro ao carregar fornecedores: ' + err.message)
    }
  }

  const loadAppointments = async (weekStart) => {
    try {
      setLoading(true)
      const weekStartISO = dateUtils.toISODate(weekStart)
      const data = await adminAPI.getAppointments(weekStartISO)
      setAppointments(data)
      setError('')
    } catch (err) {
      setError('Erro ao carregar agendamentos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
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

  const handleCheckIn = async (appointmentId) => {
    try {
      const result = await adminAPI.checkIn(appointmentId)
      await loadAppointments(currentWeek)
      
      // Mostrar payload do ERP
      alert(`Check-in realizado com sucesso!\n\nPayload ERP:\n${JSON.stringify(result.erp_payload, null, 2)}`)
    } catch (err) {
      setError('Erro ao realizar check-in: ' + err.message)
    }
  }

  const handleCheckOut = async (appointmentId) => {
    try {
      await adminAPI.checkOut(appointmentId)
      await loadAppointments(currentWeek)
    } catch (err) {
      setError('Erro ao realizar check-out: ' + err.message)
    }
  }

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentForm(true)
  }

  const handleSupplierFormSubmit = async () => {
    setShowSupplierForm(false)
    await loadSuppliers()
  }

  const handleManageSupplier = (supplier) => {
    setManagingSupplier(supplier)
    setShowSupplierManagement(true)
  }

  const handleSupplierManagementUpdate = async () => {
    setShowSupplierManagement(false)
    setManagingSupplier(null)
    await loadSuppliers()
    await loadAppointments(currentWeek)
  }

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      await adminAPI.deleteAppointment(appointmentId)
      await loadAppointments(currentWeek)
    } catch (err) {
      setError('Erro ao excluir agendamento: ' + err.message)
    }
  }

  const handleAppointmentFormSubmit = async () => {
    setShowAppointmentForm(false)
    setEditingAppointment(null)
    await loadAppointments(currentWeek)
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

  // Horários disponíveis (8h às 17h)
  const availableHours = []
  for (let hour = 8; hour <= 17; hour++) {
    availableHours.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  // Estatísticas
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    checkedIn: appointments.filter(a => a.status === 'checked_in').length,
    checkedOut: appointments.filter(a => a.status === 'checked_out').length
  }

  if (showSupplierForm) {
    return (
      <SupplierForm
        onSubmit={handleSupplierFormSubmit}
        onCancel={() => setShowSupplierForm(false)}
      />
    )
  }

  if (showSupplierManagement) {
    return (
      <SupplierManagement
        supplier={managingSupplier}
        onBack={() => setShowSupplierManagement(false)}
        onUpdate={handleSupplierManagementUpdate}
      />
    )
  }

  if (showScheduleConfig) {
    return (
      <ScheduleConfig
        onBack={() => setShowScheduleConfig(false)}
      />
    )
  }

  if (showDefaultScheduleConfig) {
    return (
      <DefaultScheduleConfig
        onBack={() => setShowDefaultScheduleConfig(false)}
      />
    )
  }

  if (showAppointmentForm) {
    return (
      <AppointmentEditForm
        appointment={editingAppointment}
        onSubmit={handleAppointmentFormSubmit}
        onCancel={() => {
          setShowAppointmentForm(false)
          setEditingAppointment(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie fornecedores e agendamentos</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Agendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats.scheduled}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Check-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.checkedIn}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.checkedOut}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>

        {/* Tab de Agendamentos */}
        <TabsContent value="appointments" className="space-y-4">
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

          {/* Grade da Semana com Horários */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const dateISO = dateUtils.toISODate(date)
              const dayAppointments = appointmentsByDate[dateISO] || []
              const isToday = dateUtils.isToday(date)
              const isPast = dateUtils.isPast(date)

              // Criar mapa de agendamentos por horário
              const appointmentsByTime = dayAppointments.reduce((acc, apt) => {
                const timeStr = dateUtils.formatTime(apt.time)
                acc[timeStr] = apt
                return acc
              }, {})

              return (
                <Card key={index} className={`${isToday ? 'ring-2 ring-blue-500' : ''} ${isPast ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-center">
                      {dateUtils.getDayName(date)}
                    </CardTitle>
                    <CardDescription className="text-xs text-center">
                      {dateUtils.formatDate(date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {availableHours.map((timeSlot) => {
                      const appointment = appointmentsByTime[timeSlot]

                      return (
                        <div
                          key={timeSlot}
                          className={`p-2 rounded border text-xs transition-all ${
                            appointment
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{timeSlot}</span>
                            {appointment && (
                              <Badge className={`text-xs ${statusUtils.getStatusColor(appointment.status)}`}>
                                {statusUtils.getStatusLabel(appointment.status)}
                              </Badge>
                            )}
                          </div>

                          {appointment ? (
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900 truncate">
                                {suppliers.find(s => s.id === appointment.supplier_id)?.description || 'Fornecedor'}
                              </p>
                              <p className="text-gray-600 truncate">
                                PO: {appointment.purchase_order}
                              </p>
                              <p className="text-gray-600 truncate">
                                {appointment.truck_plate} - {appointment.driver_name}
                              </p>
                              
                              <div className="flex gap-1 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs"
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  <Edit className="w-2 h-2" />
                                </Button>
                                
                                {appointment.status !== 'checked_in' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-1 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                  >
                                    <Trash2 className="w-2 h-2" />
                                  </Button>
                                )}
                                
                                {appointment.status === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-1 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => handleCheckIn(appointment.id)}
                                  >
                                    <LogIn className="w-2 h-2" />
                                  </Button>
                                )}
                                
                                {appointment.status === 'checked_in' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-1 text-xs text-blue-600 hover:text-blue-700"
                                    onClick={() => handleCheckOut(appointment.id)}
                                  >
                                    <LogOut className="w-2 h-2" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400">
                              <span>Disponível</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab de Fornecedores */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Fornecedores Cadastrados</h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowDefaultScheduleConfig(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Horários Padrão
              </Button>
              <Button 
                onClick={() => setShowScheduleConfig(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurar Horários
              </Button>
              <Button onClick={() => setShowSupplierForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Fornecedor
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {supplier.description}
                    </div>
                    <Badge className={supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {supplier.is_active ? 'Ativo' : 'Bloqueado'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    CNPJ: {supplier.cnpj}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-600">
                      Agendamentos esta semana: {appointments.filter(a => a.supplier_id === supplier.id).length}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageSupplier(supplier)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Edit className="w-3 h-3" />
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {suppliers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum fornecedor cadastrado</p>
                <Button 
                  onClick={() => setShowSupplierForm(true)} 
                  className="mt-4"
                  variant="outline"
                >
                  Cadastrar Primeiro Fornecedor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando...</p>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
