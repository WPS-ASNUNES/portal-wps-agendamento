import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { adminAPI } from '../lib/api'
import { dateUtils, statusUtils } from '../lib/utils'

const AppointmentEditForm = ({ appointment, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    purchase_order: '',
    truck_plate: '',
    driver_name: ''
  })
  const [loading, setLoading] = useState(false)
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
    }
  }, [appointment])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await adminAPI.updateAppointment(appointment.id, formData)
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

  if (!appointment) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Agendamento</h1>
          <p className="text-gray-600">Modifique os dados do agendamento</p>
        </div>
      </div>

      {/* Informações do Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-800">Status Atual</CardTitle>
            <Badge className={statusUtils.getStatusColor(appointment.status)}>
              {statusUtils.getStatusLabel(appointment.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {appointment.check_in_time && (
            <p className="text-sm text-blue-700">
              <strong>Check-in:</strong> {dateUtils.formatDateTime(appointment.check_in_time)}
            </p>
          )}
          {appointment.check_out_time && (
            <p className="text-sm text-blue-700">
              <strong>Check-out:</strong> {dateUtils.formatDateTime(appointment.check_out_time)}
            </p>
          )}
          {appointment.status !== 'scheduled' && (
            <Alert>
              <AlertDescription>
                <strong>Atenção:</strong> Este agendamento já passou pelo processo de check-in/check-out. 
                Alterações devem ser feitas com cuidado.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
                disabled={loading}
              />
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
                    Salvar Alterações
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

export default AppointmentEditForm
