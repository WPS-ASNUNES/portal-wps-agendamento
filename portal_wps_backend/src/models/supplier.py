from flask_sqlalchemy import SQLAlchemy
from src.models.user import db
from datetime import datetime

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # Status ativo/bloqueado
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)  # Soft delete
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com usuários
    users = db.relationship('User', backref='supplier', lazy=True)
    
    # Relacionamento com agendamentos
    appointments = db.relationship('Appointment', backref='supplier', lazy=True)

    def __repr__(self):
        return f'<Supplier {self.description}>'

    def to_dict(self):
        return {
            'id': self.id,
            'cnpj': self.cnpj,
            'description': self.description,
            'is_active': self.is_active,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
