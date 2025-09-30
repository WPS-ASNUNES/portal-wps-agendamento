from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    purchase_order = db.Column(db.String(100), nullable=False)
    truck_plate = db.Column(db.String(20), nullable=False)
    driver_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='scheduled', nullable=False)  # scheduled, checked_in, checked_out
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    
    # Chave estrangeira para Supplier
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Appointment {self.purchase_order} - {self.date} {self.time}>'

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'purchase_order': self.purchase_order,
            'truck_plate': self.truck_plate,
            'driver_name': self.driver_name,
            'status': self.status,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'supplier_id': self.supplier_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def generate_erp_payload(self):
        """Gera o payload JSON para integração com ERP"""
        return {
            'appointment_id': self.id,
            'supplier_cnpj': self.supplier.cnpj if self.supplier else None,
            'supplier_name': self.supplier.description if self.supplier else None,
            'purchase_order': self.purchase_order,
            'truck_plate': self.truck_plate,
            'driver_name': self.driver_name,
            'scheduled_date': self.date.isoformat() if self.date else None,
            'scheduled_time': self.time.isoformat() if self.time else None,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'status': self.status,
            'timestamp': datetime.utcnow().isoformat()
        }
