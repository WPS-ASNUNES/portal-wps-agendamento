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
            <p className="text-2xl font-bold text-gray-600">{stats.scheduled}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Check-in
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
                      dayAppointments.map((appointment) => {
                        const supplier = suppliers.find(s => s.id === appointment.supplier_id)
                        
                        return (
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
                                {supplier?.description || 'Fornecedor não encontrado'}
                              </p>
                              <p className="text-xs text-gray-600">
                                PO: {appointment.purchase_order}
                              </p>
                              <p className="text-xs text-gray-600">
                                {appointment.truck_plate} - {appointment.driver_name}
                              </p>
                            </div>

                            <div className="flex gap-1 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleEditAppointment(appointment)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              
                              {appointment.status !== 'checked_in' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                              
                              {appointment.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                                  onClick={() => handleCheckIn(appointment.id)}
                                >
                                  <LogIn className="w-3 h-3" />
                                </Button>
                              )}
                              
                              {appointment.status === 'checked_in' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                                  onClick={() => handleCheckOut(appointment.id)}
                                >
                                  <LogOut className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
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
    </div>
  )
}

export default AdminDashboard
