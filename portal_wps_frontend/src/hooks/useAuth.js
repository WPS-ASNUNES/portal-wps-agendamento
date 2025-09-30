import { useState, useEffect } from 'react'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          // Verificar se o token ainda é válido
          const response = await fetch('/api/verify', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setToken(storedToken)
          } else {
            // Token inválido, limpar storage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (error) {
          console.error('Erro ao verificar token:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }
}

export default useAuth
