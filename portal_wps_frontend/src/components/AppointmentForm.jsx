import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { supplierAPI } from '../lib/api'
import { dateUtils } from '../lib/utils'

const AppointmentForm = ({ appointment, preSelectedDate, preSelectedTime, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: preSelectedDate || '',
    time: preSelectedTime || '',
    purchase_order: '',
    truck_plate: '',
    driver_name: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (appointment) {
      setFormData({
        date: appointment.date,
        time: appointment.time,
        purchase_order: appointment.purchase_order,
        truck_plate: appointment.truck_plate,
        driver_name: appointment.driver_name
      })
      if (appointment.date) {
        loadAvailableSlots(appointment.date)
      }
    } else if (preSelectedDate) {
      // Se há data pré-selecionada, carregar horários disponíveis
      loadAvailableSlots(preSelectedDate)
    }
  }, [appointment, preSelectedDate])

  const loadAvailableSlots = async (date) => {
    if (!date) return

    try {
      setLoadingSlots(true)
      const data = await supplierAPI.getAvailableSlots(date)
      setAvailableSlots(data.available_slots)
    } catch (err) {
      setError('Erro ao carregar horários disponíveis: ' + err.message)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (e) => {
    const newDate = e.target.value
    setFormData(prev => ({ ...prev, date: newDate, time: '' }))
    if (newDate) {
      loadAvailableSlots(newDate)
    } else {
      setAvailableSlots([])
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (appointment) {
        // Editar agendamento existente
        await supplierAPI.updateAppointment(appointment.id, formData)
      } else {
        // Criar novo agendamento
        await supplierAPI.createAppointment(formData)
      }
      onSubmit()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.date && 
           formData.time && 
           formData.purchase_order.trim() && 
           formData.truck_plate.trim() && 
           formData.driver_name.trim()
  }

  // Data mínima é hoje
  const minDate = dateUtils.toISODate(new Date())

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h1>
          <p className="text-gray-600">
            {appointment ? 'Modifique os dados do agendamento' : 'Preencha os dados para criar um novo agendamento'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Agendamento</CardTitle>
          <CardDescription>
            Todos os campos são obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={formData.date}
                onChange={handleDateChange}
                required
                disabled={loading}
              />
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Carregando horários...</span>
                </div>
              ) : (
                <Select
                  value={formData.time}
                  onValueChange={(value) => handleInputChange('time', value)}
                  disabled={!formData.date || loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.length === 0 ? (
                      <SelectItem value="" disabled>
                        {formData.date ? 'Nenhum horário disponível' : 'Selecione uma data primeiro'}
                      </SelectItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Pedido de Compra */}
            <div className="space-y-2">
              <Label htmlFor="purchase_order">Pedido de Compra</Label>
              <Input
                id="purchase_order"
                type="text"
                placeholder="Ex: PO-2025-001"
                value={formData.purchase_order}
                onChange={(e) => handleInputChange('purchase_order', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Placa do Caminhão */}
            <div className="space-y-2">
              <Label htmlFor="truck_plate">Placa do Caminhão</Label>
              <Input
                id="truck_plate"
                type="text"
                placeholder="Ex: ABC-1234"
                value={formData.truck_plate}
                onChange={(e) => handleInputChange('truck_plate', e.target.value.toUpperCase())}
                required
                disabled={loading}
              />
            </div>

            {/* Nome do Motorista */}
            <div className="space-y-2">
              <Label htmlFor="driver_name">Nome do Motorista</Label>
              <Input
                id="driver_name"
                type="text"
                placeholder="Ex: João Silva"
                value={formData.driver_name}
                onChange={(e) => handleInputChange('driver_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!isFormValid() || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {appointment ? 'Atualizar' : 'Criar'} Agendamento
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AppointmentForm
