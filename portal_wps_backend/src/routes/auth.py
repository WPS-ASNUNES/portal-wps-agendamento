from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta
from src.models.user import User, db

auth_bp = Blueprint('auth', __name__)

SECRET_KEY = 'asdf#FGSgvasgf$5$WGT'  # Em produção, usar variável de ambiente

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login que retorna JWT token"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Gerar JWT token
        payload = {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'supplier_id': user.supplier_id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """Verifica se o token JWT é válido"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        # Remove 'Bearer ' do início do token se presente
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def token_required(f):
    """Decorator para proteger rotas que requerem autenticação"""
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Usuário não encontrado'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

def admin_required(f):
    """Decorator para proteger rotas que requerem privilégios de admin"""
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Usuário não encontrado'}), 401
            
            if current_user.role != 'admin':
                return jsonify({'error': 'Acesso negado. Privilégios de administrador necessários'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated
