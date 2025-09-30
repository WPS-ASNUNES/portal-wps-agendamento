import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Loader2, Building2, Copy, Check } from 'lucide-react'
import { adminAPI } from '../lib/api'
import { validation } from '../lib/utils'

const SupplierForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    cnpj: '',
    description: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleCNPJChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, '')
    
    // Aplicar máscara do CNPJ
    if (value.length <= 14) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
      handleInputChange('cnpj', value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    // Validações
    if (!validation.isValidCNPJ(formData.cnpj)) {
      setError('CNPJ inválido')
      setLoading(false)
      return
    }

    if (!validation.isValidEmail(formData.email)) {
      setError('Email inválido')
      setLoading(false)
      return
    }

    try {
      const result = await adminAPI.createSupplier(formData)
      setSuccess(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    if (success?.temp_password) {
      try {
        await navigator.clipboard.writeText(success.temp_password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erro ao copiar senha:', err)
      }
    }
  }

  const handleFinish = () => {
    onSubmit()
  }

  const isFormValid = () => {
    return formData.cnpj.trim() && 
           formData.description.trim() && 
           formData.email.trim() &&
           validation.isValidCNPJ(formData.cnpj) &&
           validation.isValidEmail(formData.email)
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fornecedor Criado com Sucesso!</h1>
            <p className="text-gray-600">O fornecedor foi cadastrado e o usuário foi criado</p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {success.supplier.description}
            </CardTitle>
            <CardDescription className="text-green-700">
              CNPJ: {success.supplier.cnpj}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-green-800">Email de Acesso:</Label>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                {success.user.email}
              </p>
            </div>
            
            <div>
              <Label className="text-green-800">Senha Temporária:</Label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm bg-white p-2 rounded border flex-1">
                  {success.temp_password}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Anote ou copie a senha temporária, pois ela não será exibida novamente. 
                O fornecedor deve usar essas credenciais para fazer o primeiro login no sistema.
              </AlertDescription>
            </Alert>

            <Button onClick={handleFinish} className="w-full">
              Finalizar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Fornecedor</h1>
          <p className="text-gray-600">Cadastre um novo fornecedor e crie seu usuário de acesso</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Fornecedor</CardTitle>
          <CardDescription>
            Todos os campos são obrigatórios. Um usuário de acesso será criado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                maxLength={18}
                required
                disabled={loading}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Nome/Descrição do Fornecedor</Label>
              <Input
                id="description"
                type="text"
                placeholder="Ex: Transportadora ABC Ltda"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email de Acesso</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@fornecedor.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Este email será usado pelo fornecedor para fazer login no sistema
              </p>
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
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Criar Fornecedor
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

export default SupplierForm
