import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Trash2, Plus, Clock, Calendar } from 'lucide-react'
import { adminAPI } from '../lib/api'

const DefaultScheduleConfig = ({ onBack }) => {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newConfig, setNewConfig] = useState({
    day_of_week: null,
    time: '',
    is_available: false,
    reason: ''
  })

  const daysOfWeek = [
    { value: null, label: 'Todos os dias' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }
  ]

  const availableHours = []
  for (let hour = 8; hour <= 17; hour++) {
    availableHours.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getDefaultSchedule()
      setConfigs(data)
      setError('')
    } catch (err) {
      setError('Erro ao carregar configurações: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleSaveConfig = async () => {
    if (!newConfig.time) {
      setError('Selecione um horário')
      return
    }

    if (!newConfig.is_available && !newConfig.reason.trim()) {
      setError('Informe o motivo para bloquear o horário')
      return
    }

    try {
      setSaving(true)
      await adminAPI.createDefaultSchedule(newConfig)
      
      setSuccess('Configuração salva com sucesso!')
      setNewConfig({
        day_of_week: null,
        time: '',
        is_available: false,
        reason: ''
      })
      
      await loadConfigs()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao salvar configuração: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfig = async (configId) => {
    if (!confirm('Tem certeza que deseja remover esta configuração?')) return

    try {
      await adminAPI.deleteDefaultSchedule(configId)
      setSuccess('Configuração removida com sucesso!')
      await loadConfigs()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao remover configuração: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Padrão de Horários</h1>
          <p className="text-gray-600">Configure horários que ficam bloqueados por padrão</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Formulário para Nova Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Configuração Padrão
          </CardTitle>
          <CardDescription>
            Configure horários que ficam automaticamente bloqueados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Dia da Semana</Label>
              <Select 
                value={newConfig.day_of_week?.toString() || 'null'} 
                onValueChange={(value) => setNewConfig({
                  ...newConfig, 
                  day_of_week: value === 'null' ? null : parseInt(value)
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value?.toString() || 'null'} value={day.value?.toString() || 'null'}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Select value={newConfig.time} onValueChange={(value) => setNewConfig({...newConfig, time: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {availableHours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="availability"
                  checked={newConfig.is_available}
                  onChange={() => setNewConfig({...newConfig, is_available: true, reason: ''})}
                />
                <span className="text-sm">Disponível</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="availability"
                  checked={!newConfig.is_available}
                  onChange={() => setNewConfig({...newConfig, is_available: false})}
                />
                <span className="text-sm">Bloqueado</span>
              </label>
            </div>
          </div>

          {!newConfig.is_available && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do Bloqueio</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Intervalo de almoço da equipe"
                value={newConfig.reason}
                onChange={(e) => setNewConfig({...newConfig, reason: e.target.value})}
              />
            </div>
          )}

          <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Configurações Existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configurações Ativas
          </CardTitle>
          <CardDescription>
            Configurações padrão que se aplicam automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma configuração padrão definida</p>
              <p className="text-sm text-gray-500 mt-2">
                Configure horários que ficam automaticamente bloqueados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        {config.day_name} - {config.time}
                      </p>
                      {config.reason && (
                        <p className="text-xs text-gray-600 mt-1">
                          {config.reason}
                        </p>
                      )}
                    </div>
                    <Badge className={config.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {config.is_available ? 'Disponível' : 'Bloqueado'}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteConfig(config.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DefaultScheduleConfig
