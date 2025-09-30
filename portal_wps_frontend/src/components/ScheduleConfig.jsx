import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Save, 
  Loader2,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react'
import { adminAPI } from '../lib/api'
import { dateUtils } from '../lib/utils'

const ScheduleConfig = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState(dateUtils.toISODate(new Date()))
  const [availableTimes, setAvailableTimes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingTime, setEditingTime] = useState(null)
  const [reason, setReason] = useState('')

  const loadAvailableTimes = async (date) => {
    setLoading(true)
    setError('')

    try {
      const times = await adminAPI.getAvailableTimes(date)
      setAvailableTimes(times)
    } catch (err) {
      setError('Erro ao carregar horários: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailableTimes(selectedDate)
  }, [selectedDate])

  const handleToggleAvailability = async (time, currentStatus) => {
    if (!currentStatus && !reason.trim()) {
      setEditingTime(time)
      return
    }

    setLoading(true)
    setError('')

    try {
      await adminAPI.createScheduleConfig({
        date: selectedDate,
        time: time,
        is_available: !currentStatus,
        reason: !currentStatus ? '' : reason
      })

      await loadAvailableTimes(selectedDate)
      setEditingTime(null)
      setReason('')
    } catch (err) {
      setError('Erro ao atualizar configuração: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveReason = async () => {
    if (!reason.trim()) {
      setError('Motivo é obrigatório para bloquear horário')
      return
    }

    await handleToggleAvailability(editingTime, true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Horários</h1>
          <p className="text-gray-600">Gerencie a disponibilidade de horários para agendamento</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Seletor de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Selecionar Data
          </CardTitle>
          <CardDescription>
            Escolha a data para configurar os horários disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={dateUtils.toISODate(new Date())}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de Motivo */}
      {editingTime && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Bloquear Horário {editingTime}</CardTitle>
            <CardDescription className="text-orange-700">
              Informe o motivo para bloquear este horário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do Bloqueio</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Intervalo de almoço, Manutenção, Reunião..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveReason}
                disabled={loading || !reason.trim()}
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
                    Bloquear Horário
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTime(null)
                  setReason('')
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade de Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários do Dia {dateUtils.formatDate(new Date(selectedDate + 'T00:00:00'))}
          </CardTitle>
          <CardDescription>
            Clique nos horários para alterar a disponibilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando horários...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableTimes.map((timeSlot) => (
                <Card
                  key={timeSlot.time}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    timeSlot.is_available
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : 'border-red-200 bg-red-50 hover:bg-red-100'
                  } ${timeSlot.has_appointment ? 'opacity-60' : ''}`}
                  onClick={() => !timeSlot.has_appointment && handleToggleAvailability(timeSlot.time, timeSlot.is_available)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-lg">{timeSlot.time}</span>
                      {timeSlot.is_available ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <Badge
                        className={`text-xs ${
                          timeSlot.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {timeSlot.is_available ? 'Disponível' : 'Bloqueado'}
                      </Badge>

                      {timeSlot.has_appointment && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Agendado
                        </Badge>
                      )}

                      {timeSlot.reason && (
                        <p className="text-xs text-gray-600 mt-1">
                          {timeSlot.reason}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Legenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span><strong>Verde:</strong> Horário disponível para agendamento</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span><strong>Vermelho:</strong> Horário bloqueado pelo administrador</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 text-xs">Agendado</Badge>
              <span><strong>Azul:</strong> Horário já possui agendamento</span>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Dica:</strong> Clique em qualquer horário disponível para bloquear/desbloquear. 
              Horários com agendamentos não podem ser alterados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default ScheduleConfig
