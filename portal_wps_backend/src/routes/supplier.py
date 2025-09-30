from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, time
from src.models.user import User, db
from src.models.appointment import Appointment
from src.routes.auth import token_required

supplier_bp = Blueprint('supplier', __name__)

# Horários disponíveis para agendamento (8h às 17h, de hora em hora)
AVAILABLE_HOURS = [
    time(8, 0), time(9, 0), time(10, 0), time(11, 0),
    time(12, 0), time(13, 0), time(14, 0), time(15, 0),
    time(16, 0), time(17, 0)
]

@supplier_bp.route('/appointments', methods=['GET'])
@token_required
def get_supplier_appointments(current_user):
    """Retorna agendamentos do fornecedor para uma semana específica"""
    try:
        if current_user.role != 'supplier':
            return jsonify({'error': 'Acesso negado. Apenas fornecedores podem acessar'}), 403
        
        week_start = request.args.get('week')
        
        if not week_start:
            return jsonify({'error': 'Parâmetro week é obrigatório (formato: YYYY-MM-DD)'}), 400
        
        try:
            start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        end_date = start_date + timedelta(days=6)
        
        # Buscar agendamentos do próprio fornecedor
        own_appointments = Appointment.query.filter(
            Appointment.supplier_id == current_user.supplier_id,
            Appointment.date >= start_date,
            Appointment.date <= end_date
        ).order_by(Appointment.date, Appointment.time).all()
        
        # Buscar TODOS os agendamentos da semana para mostrar conflitos
        all_appointments = Appointment.query.filter(
            Appointment.date >= start_date,
            Appointment.date <= end_date
        ).order_by(Appointment.date, Appointment.time).all()
        
        # Marcar quais são do próprio fornecedor
        result = []
        for appointment in all_appointments:
            appointment_dict = appointment.to_dict()
            appointment_dict['is_own'] = appointment.supplier_id == current_user.supplier_id
            appointment_dict['can_edit'] = appointment.supplier_id == current_user.supplier_id and appointment.status == 'scheduled'
            result.append(appointment_dict)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/available-slots', methods=['GET'])
@token_required
def get_available_slots(current_user):
    """Retorna horários disponíveis para agendamento em uma data específica"""
    try:
        if current_user.role != 'supplier':
            return jsonify({'error': 'Acesso negado. Apenas fornecedores podem acessar'}), 403
        
        date_str = request.args.get('date')
        
        if not date_str:
            return jsonify({'error': 'Parâmetro date é obrigatório (formato: YYYY-MM-DD)'}), 400
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        # Verificar se a data não é no passado
        if target_date < datetime.now().date():
            return jsonify({'error': 'Não é possível agendar para datas passadas'}), 400
        
        # Buscar agendamentos existentes para a data (todos os fornecedores)
        existing_appointments = Appointment.query.filter(
            Appointment.date == target_date
        ).all()
        
        # Criar lista de horários ocupados
        occupied_times = [app.time for app in existing_appointments]
        
        # Filtrar horários disponíveis
        available_slots = []
        for hour in AVAILABLE_HOURS:
            if hour not in occupied_times:
                available_slots.append(hour.strftime('%H:%M'))
        
        return jsonify({
            'date': date_str,
            'available_slots': available_slots,
            'occupied_slots': [t.strftime('%H:%M') for t in occupied_times]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/appointments', methods=['POST'])
@token_required
def create_appointment(current_user):
    """Cria um novo agendamento para o fornecedor"""
    try:
        if current_user.role != 'supplier':
            return jsonify({'error': 'Acesso negado. Apenas fornecedores podem acessar'}), 403
        
        data = request.get_json()
        
        if not data or not all(k in data for k in ['date', 'time', 'purchase_order', 'truck_plate', 'driver_name']):
            return jsonify({'error': 'Todos os campos são obrigatórios: date, time, purchase_order, truck_plate, driver_name'}), 400
        
        try:
            appointment_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            appointment_time = datetime.strptime(data['time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Formato de data/hora inválido. Use YYYY-MM-DD para data e HH:MM para hora'}), 400
        
        # Verificar se a data não é no passado
        if appointment_date < datetime.now().date():
            return jsonify({'error': 'Não é possível agendar para datas passadas'}), 400
        
        # Verificar se o horário está disponível (qualquer fornecedor)
        existing_appointment = Appointment.query.filter(
            Appointment.date == appointment_date,
            Appointment.time == appointment_time
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'Horário já ocupado por outro fornecedor'}), 400
        
        # Verificar se o horário está na lista de horários permitidos
        if appointment_time not in AVAILABLE_HOURS:
            return jsonify({'error': 'Horário não permitido. Horários disponíveis: 08:00 às 17:00'}), 400
        
        # Criar agendamento
        appointment = Appointment(
            date=appointment_date,
            time=appointment_time,
            purchase_order=data['purchase_order'],
            truck_plate=data['truck_plate'],
            driver_name=data['driver_name'],
            supplier_id=current_user.supplier_id
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento criado com sucesso',
            'appointment': appointment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@token_required
def update_supplier_appointment(current_user, appointment_id):
    """Atualiza um agendamento do fornecedor"""
    try:
        if current_user.role != 'supplier':
            return jsonify({'error': 'Acesso negado. Apenas fornecedores podem acessar'}), 403
        
        appointment = Appointment.query.filter(
            Appointment.id == appointment_id,
            Appointment.supplier_id == current_user.supplier_id
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        # Verificar se o agendamento pode ser editado
        if appointment.status != 'scheduled':
            return jsonify({'error': f'Agendamento não pode ser editado. Status atual: {appointment.status}'}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos permitidos
        if 'date' in data:
            try:
                new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
                if new_date < datetime.now().date():
                    return jsonify({'error': 'Não é possível agendar para datas passadas'}), 400
                appointment.date = new_date
            except ValueError:
                return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        if 'time' in data:
            try:
                new_time = datetime.strptime(data['time'], '%H:%M').time()
                if new_time not in AVAILABLE_HOURS:
                    return jsonify({'error': 'Horário não permitido. Horários disponíveis: 08:00 às 17:00'}), 400
                
                # Verificar se o novo horário está disponível
                existing_appointment = Appointment.query.filter(
                    Appointment.date == appointment.date,
                    Appointment.time == new_time,
                    Appointment.id != appointment_id
                ).first()
                
                if existing_appointment:
                    return jsonify({'error': 'Horário já ocupado'}), 400
                
                appointment.time = new_time
            except ValueError:
                return jsonify({'error': 'Formato de hora inválido. Use HH:MM'}), 400
        
        if 'purchase_order' in data:
            appointment.purchase_order = data['purchase_order']
        
        if 'truck_plate' in data:
            appointment.truck_plate = data['truck_plate']
        
        if 'driver_name' in data:
            appointment.driver_name = data['driver_name']
        
        appointment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Agendamento atualizado com sucesso',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@token_required
def delete_supplier_appointment(current_user, appointment_id):
    """Remove um agendamento do fornecedor"""
    try:
        if current_user.role != 'supplier':
            return jsonify({'error': 'Acesso negado. Apenas fornecedores podem acessar'}), 403
        
        appointment = Appointment.query.filter(
            Appointment.id == appointment_id,
            Appointment.supplier_id == current_user.supplier_id
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        # Verificar se o agendamento pode ser removido
        if appointment.status != 'scheduled':
            return jsonify({'error': f'Agendamento não pode ser removido. Status atual: {appointment.status}'}), 400
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Agendamento removido com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
