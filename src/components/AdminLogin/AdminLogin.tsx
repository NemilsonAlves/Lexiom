import React, { useState } from 'react';
import { adminAuth } from '../../services/admin/authService';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../Card/Card';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validação de campos
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }

    try {
      const result = await adminAuth.login({
        email: email.trim(),
        password: password.trim(),
        mfaCode: requiresMFA ? mfaCode.trim() : undefined,
      });

      if (result.success && result.user) {
        onLoginSuccess();
      } else if (result.requiresMFA) {
        setRequiresMFA(true);
        setError('Código MFA necessário. Por favor, insira o código de 6 dígitos do seu aplicativo autenticador.');
      } else if (result.error?.includes('bloqueada')) {
        setError('Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente em 30 minutos.');
      } else {
        setError(result.error || 'Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASetup = async () => {
    try {
      const result = await adminAuth.setupMFA();
      if (result.success && result.secret) {
        setQrCode(result.secret.qrCode);
        setShowMFASetup(true);
      } else {
        setError(result.error || 'Erro ao configurar MFA');
      }
    } catch {
      setError('Erro ao configurar MFA');
    }
  };

  const handleConfirmMFA = async () => {
    try {
      const result = await adminAuth.confirmMFA(mfaCode);
      if (result.success) {
        setShowMFASetup(false);
        setQrCode('');
        setError('MFA configurado com sucesso!');
      } else {
        setError(result.error || 'Erro ao confirmar MFA');
      }
    } catch {
      setError('Erro ao confirmar MFA');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lexiom-primary to-lexiom-petrol flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-lexiom-gold rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-lexiom-primary" />
          </div>
          <h1 className="text-3xl font-soehne font-bold text-white mb-2">
            Lexiom Admin
          </h1>
          <p className="text-blue-100 font-inter">
            Acesso exclusivo para administradores
          </p>
        </div>

        {/* Login Form */}
        <Card title="Admin Login" className="shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-soehne font-semibold text-gray-900 mb-2">
              Acesso Administrativo
            </h2>
            <p className="text-gray-600 font-inter">
              Entre com suas credenciais de administrador
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Administrativo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary focus:border-transparent font-inter"
                placeholder="admin@lexiom.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary focus:border-transparent font-inter"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* MFA Code Field (if required) */}
            {requiresMFA && (
              <div>
                <label htmlFor="mfa" className="block text-sm font-medium text-gray-700 mb-1">
                  Código MFA
                </label>
                <input
                  id="mfa"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary focus:border-transparent font-inter"
                  placeholder="123456"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                error.includes('sucesso') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {error.includes('sucesso') ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-inter">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lexiom-primary text-white py-3 px-4 rounded-lg hover:bg-lexiom-primary/90 focus:outline-none focus:ring-2 focus:ring-lexiom-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-inter font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>{requiresMFA ? 'Verificar MFA' : 'Entrar'}</span>
                </div>
              )}
            </button>
          </form>

          {/* MFA Setup Button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleMFASetup}
              className="text-lexiom-primary hover:text-lexiom-primary/80 text-sm font-inter"
            >
              Configurar autenticação de dois fatores
            </button>
          </div>

          {/* MFA Setup Modal */}
          {showMFASetup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card title="Configurar Autenticação de Dois Fatores" className="max-w-md w-full">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-soehne font-semibold text-gray-900">
                    Configurar Autenticação de Dois Fatores
                  </h3>
                  <p className="text-sm text-gray-600 font-inter mt-1">
                    Escaneie o QR code com seu aplicativo autenticador
                  </p>
                </div>

                {qrCode && (
                  <div className="text-center mb-4">
                    <img src={qrCode} alt="QR Code MFA" className="mx-auto w-48 h-48" />
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lexiom-primary font-inter"
                    placeholder="Digite o código de 6 dígitos"
                    pattern="[0-9]{6}"
                    maxLength={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMFASetup(false);
                        setQrCode('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-inter"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmMFA}
                      className="flex-1 px-4 py-2 bg-lexiom-primary text-white rounded-lg hover:bg-lexiom-primary/90 font-inter"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-blue-100 text-sm font-inter">
            Acesso restrito a administradores autorizados
          </p>
        </div>
      </div>
    </div>
  );
};
