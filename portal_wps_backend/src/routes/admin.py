from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from src.models.user import User, db
from src.models.supplier import Supplier
from src.models.appointment import Appointment
from src.routes.auth import admin_required
import secrets
import string

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/suppliers', methods=['GET'])
@admin_required
def get_suppliers(current_user):
    """Lista todos os fornecedores ativos"""
    try:
        suppliers = Supplier.query.filter_by(is_deleted=False).all()
        return jsonify([supplier.to_dict() for supplier in suppliers]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/suppliers', methods=['POST'])
@admin_required
def create_supplier(current_user):
    """Cria um novo fornecedor e seu usuário de acesso"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['cnpj', 'description', 'email']):
            return jsonify({'error': 'CNPJ, descrição e email são obrigatórios'}), 400
        
        # Verificar se CNPJ já existe
        existing_supplier = Supplier.query.filter_by(cnpj=data['cnpj']).first()
        if existing_supplier:
            return jsonify({'error': 'CNPJ já cadastrado'}), 400
        
        # Verificar se email já existe
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar fornecedor
        supplier = Supplier(
            cnpj=data['cnpj'],
            description=data['description']
        )
        db.session.add(supplier)
        db.session.flush()  # Para obter o ID do supplier
        
        # Gerar senha temporária
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # Criar usuário para o fornecedor
        user = User(
            email=data['email'],
            role='supplier',
            supplier_id=supplier.id
        )
        user.set_password(temp_password)
        db.session.add(user)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Fornecedor criado com sucesso',
            'supplier': supplier.to_dict(),
            'user': user.to_dict(),
            'temp_password': temp_password
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments', methods=['GET'])
@admin_required
def get_appointments(current_user):
    """Retorna agendamentos para uma semana específica"""
    try:
        week_start = request.args.get('week')
        
        if not week_start:
            return jsonify({'error': 'Parâmetro week é obrigatório (formato: YYYY-MM-DD)'}), 400
        
        try:
            start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        end_date = start_date + timedelta(days=6)
        
        appointments = Appointment.query.filter(
            Appointment.date >= start_date,
            Appointment.date <= end_date
        ).order_by(Appointment.date, Appointment.time).all()
        
        return jsonify([appointment.to_dict() for appointment in appointments]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>/check-in', methods=['POST'])
@admin_required
def check_in_appointment(current_user, appointment_id):
    """Realiza check-in de um agendamento"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        if appointment.status != 'scheduled':
            return jsonify({'error': f'Agendamento já está no status: {appointment.status}'}), 400
        
        appointment.status = 'checked_in'
        appointment.check_in_time = datetime.utcnow()
        
        db.session.commit()
        
        # Gerar payload para integração ERP
        erp_payload = appointment.generate_erp_payload()
        
        return jsonify({
            'message': 'Check-in realizado com sucesso',
            'appointment': appointment.to_dict(),
            'erp_payload': erp_payload
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>/check-out', methods=['POST'])
@admin_required
def check_out_appointment(current_user, appointment_id):
    """Realiza check-out de um agendamento"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        if appointment.status != 'checked_in':
            return jsonify({'error': f'Agendamento deve estar em check-in para fazer check-out. Status atual: {appointment.status}'}), 400
        
        appointment.status = 'checked_out'
        appointment.check_out_time = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Check-out realizado com sucesso',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@admin_required
def update_appointment(current_user, appointment_id):
    """Atualiza um agendamento existente"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos permitidos
        if 'date' in data:
            try:
                appointment.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        if 'time' in data:
            try:
                # Aceitar tanto HH:MM quanto HH:MM:SS
                time_str = data['time']
                if len(time_str) == 5:  # HH:MM
                    appointment.time = datetime.strptime(time_str, '%H:%M').time()
                elif len(time_str) == 8:  # HH:MM:SS
                    appointment.time = datetime.strptime(time_str, '%H:%M:%S').time()
                else:
                    raise ValueError("Formato inválido")
            except ValueError:
                return jsonify({'error': 'Formato de hora inválido. Use HH:MM ou HH:MM:SS'}), 400
        
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


@admin_bp.route('/suppliers/<int:supplier_id>', methods=['PUT'])
@admin_required
def update_supplier(current_user, supplier_id):
    """Atualiza dados de um fornecedor"""
    try:
        supplier = Supplier.query.get(supplier_id)
        
        if not supplier:
            return jsonify({'error': 'Fornecedor não encontrado'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos permitidos
        if 'description' in data:
            supplier.description = data['description']
        
        if 'is_active' in data:
            supplier.is_active = data['is_active']
        
        supplier.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Fornecedor atualizado com sucesso',
            'supplier': supplier.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/suppliers/<int:supplier_id>', methods=['DELETE'])
@admin_required
def delete_supplier(current_user, supplier_id):
    """Soft delete de um fornecedor"""
    try:
        supplier = Supplier.query.get(supplier_id)
        
        if not supplier:
            return jsonify({'error': 'Fornecedor não encontrado'}), 404
        
        # Verificar se há agendamentos ativos
        active_appointments = Appointment.query.filter_by(
            supplier_id=supplier_id
        ).filter(
            Appointment.status.in_(['scheduled', 'checked_in'])
        ).count()
        
        if active_appointments > 0:
            return jsonify({'error': 'Não é possível excluir fornecedor com agendamentos ativos'}), 400
        
        # Soft delete
        supplier.is_deleted = True
        supplier.is_active = False
        supplier.updated_at = datetime.utcnow()
        
        # Desativar usuários do fornecedor
        User.query.filter_by(supplier_id=supplier_id).update({'is_active': False})
        
        db.session.commit()
        
        return jsonify({'message': 'Fornecedor excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@admin_required
def delete_appointment(current_user, appointment_id):
    """Exclui um agendamento"""
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        # Verificar se pode ser excluído
        if appointment.status == 'checked_in':
            return jsonify({'error': 'Não é possível excluir agendamento que já fez check-in'}), 400
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Agendamento excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/schedule-config', methods=['GET'])
@admin_required
def get_schedule_config(current_user):
    """Retorna configurações de horários para uma data específica"""
    try:
        from src.models.schedule_config import ScheduleConfig
        
        date_str = request.args.get('date')
        
        if not date_str:
            return jsonify({'error': 'Parâmetro date é obrigatório (formato: YYYY-MM-DD)'}), 400
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        configs = ScheduleConfig.query.filter_by(date=target_date).all()
        
        return jsonify([config.to_dict() for config in configs]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/schedule-config', methods=['POST'])
@admin_required
def create_schedule_config(current_user):
    """Cria ou atualiza configuração de horário"""
    try:
        from src.models.schedule_config import ScheduleConfig
        
        data = request.get_json()
        
        if not data or not all(k in data for k in ['date', 'time', 'is_available']):
            return jsonify({'error': 'Data, horário e disponibilidade são obrigatórios'}), 400
        
        try:
            target_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            target_time = datetime.strptime(data['time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Formato de data/hora inválido'}), 400
        
        # Verificar se já existe configuração para esta data/hora
        existing_config = ScheduleConfig.query.filter_by(
            date=target_date,
            time=target_time
        ).first()
        
        if existing_config:
            # Atualizar existente
            existing_config.is_available = data['is_available']
            existing_config.reason = data.get('reason', '')
            existing_config.updated_at = datetime.utcnow()
            config = existing_config
        else:
            # Criar novo
            config = ScheduleConfig(
                date=target_date,
                time=target_time,
                is_available=data['is_available'],
                reason=data.get('reason', '')
            )
            db.session.add(config)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Configuração salva com sucesso',
            'config': config.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/available-times', methods=['GET'])
@admin_required
def get_available_times(current_user):
    """Retorna horários disponíveis para uma data específica"""
    try:
        from src.models.schedule_config import ScheduleConfig
        from src.models.default_schedule import DefaultSchedule
        
        date_str = request.args.get('date')
        
        if not date_str:
            return jsonify({'error': 'Parâmetro date é obrigatório (formato: YYYY-MM-DD)'}), 400
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        # Horários padrão (8h às 17h, de hora em hora)
        default_times = []
        for hour in range(8, 18):
            default_times.append(f"{hour:02d}:00")
        
        # Buscar configurações específicas para esta data
        configs = ScheduleConfig.query.filter_by(date=target_date).all()
        config_dict = {config.time.strftime('%H:%M'): config for config in configs}
        
        # Buscar configurações padrão
        day_of_week = target_date.weekday() + 1  # Converter para 1=Segunda, 7=Domingo
        if day_of_week == 7:
            day_of_week = 0  # Domingo = 0
        
        default_configs = DefaultSchedule.query.filter(
            (DefaultSchedule.day_of_week == day_of_week) | 
            (DefaultSchedule.day_of_week.is_(None))
        ).all()
        default_config_dict = {config.time.strftime('%H:%M'): config for config in default_configs}
        
        # Buscar agendamentos existentes para esta data
        existing_appointments = Appointment.query.filter_by(date=target_date).all()
        occupied_times = {apt.time.strftime('%H:%M') for apt in existing_appointments}
        
        available_times = []
        for time_str in default_times:
            specific_config = config_dict.get(time_str)
            default_config = default_config_dict.get(time_str)
            
            # Prioridade: configuração específica > configuração padrão > disponível se não ocupado
            if specific_config:
                is_available = specific_config.is_available
                reason = specific_config.reason if not specific_config.is_available else None
                config_type = "específica"
            elif default_config:
                is_available = default_config.is_available
                reason = default_config.reason if not default_config.is_available else None
                config_type = "padrão"
            else:
                # Verificar se está ocupado
                is_available = time_str not in occupied_times
                reason = "Horário ocupado" if not is_available else None
                config_type = "automática"
            
            available_times.append({
                'time': time_str,
                'is_available': is_available,
                'reason': reason,
                'has_appointment': time_str in occupied_times,
                'config_type': config_type
            })
        
        return jsonify(available_times), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/default-schedule', methods=['GET'])
@admin_required
def get_default_schedule(current_user):
    """Retorna configurações padrão de horários"""
    try:
        from src.models.default_schedule import DefaultSchedule
        
        configs = DefaultSchedule.query.all()
        
        return jsonify([config.to_dict() for config in configs]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/default-schedule', methods=['POST'])
@admin_required
def create_default_schedule(current_user):
    """Cria configuração padrão de horário"""
    try:
        from src.models.default_schedule import DefaultSchedule
        
        data = request.get_json()
        
        if not data or not all(k in data for k in ['time', 'is_available']):
            return jsonify({'error': 'Horário e disponibilidade são obrigatórios'}), 400
        
        try:
            target_time = datetime.strptime(data['time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Formato de hora inválido'}), 400
        
        day_of_week = data.get('day_of_week')  # None = todos os dias
        
        # Verificar se já existe configuração para este horário/dia
        existing_config = DefaultSchedule.query.filter_by(
            day_of_week=day_of_week,
            time=target_time
        ).first()
        
        if existing_config:
            # Atualizar existente
            existing_config.is_available = data['is_available']
            existing_config.reason = data.get('reason', '')
            existing_config.updated_at = datetime.utcnow()
            config = existing_config
        else:
            # Criar novo
            config = DefaultSchedule(
                day_of_week=day_of_week,
                time=target_time,
                is_available=data['is_available'],
                reason=data.get('reason', '')
            )
            db.session.add(config)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Configuração padrão salva com sucesso',
            'config': config.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/default-schedule/<int:config_id>', methods=['DELETE'])
@admin_required
def delete_default_schedule(current_user, config_id):
    """Remove configuração padrão de horário"""
    try:
        from src.models.default_schedule import DefaultSchedule
        
        config = DefaultSchedule.query.get(config_id)
        
        if not config:
            return jsonify({'error': 'Configuração não encontrada'}), 404
        
        db.session.delete(config)
        db.session.commit()
        
        return jsonify({'message': 'Configuração removida com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
