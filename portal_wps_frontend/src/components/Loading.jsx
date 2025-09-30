import { Loader2, Truck } from 'lucide-react'

const Loading = ({ message = 'Carregando...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default Loading
