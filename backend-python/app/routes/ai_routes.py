from flask import Blueprint, request, jsonify
import logging
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)
bp = Blueprint('ai', __name__, url_prefix='/api/v1/ai')

_groq_service = None

def get_groq_service():
    global _groq_service
    if _groq_service is None:
        try:
            _groq_service = GroqService()
            logger.info("Groq service initialized")
        except (ValueError, Exception) as e:
            logger.error(f"Groq service init failed: {e}")
            return None
    return _groq_service


@bp.route('/process', methods=['POST'])
def process_prompt():
    try:
        data = request.get_json()

        if not data or not data.get('prompt'):
            return jsonify({'success': False, 'message': 'Prompt is required', 'errorCode': 'VALIDATION_ERROR'}), 400

        prompt = data.get('prompt', '').strip()
        if len(prompt) < 3:
            return jsonify({'success': False, 'message': 'Prompt too short', 'errorCode': 'VALIDATION_ERROR'}), 400

        groq_service = get_groq_service()
        if groq_service is None:
            return jsonify({
                'success': False,
                'message': 'AI service not configured. Check GROQ_API_KEY in .env file.',
                'errorCode': 'SERVICE_NOT_CONFIGURED'
            }), 503

        context = data.get('context', '')
        module_type = data.get('moduleType', 'general')
        user_id = data.get('userId', 'anonymous')
        history = data.get('history', [])

        logger.info(f"Processing prompt for user: {user_id}, module: {module_type}")

        result = groq_service.process_prompt(
            prompt=prompt,
            context=context,
            module_type=module_type,
            history=history
        )

        return jsonify(result), 200

    except RuntimeError as e:
        logger.error(f"AI processing error: {str(e)}")
        return jsonify({'success': False, 'message': str(e), 'errorCode': 'AI_ERROR'}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'success': False, 'message': 'Internal server error', 'errorCode': 'INTERNAL_ERROR'}), 500


@bp.route('/smart-advisor', methods=['POST'])
def smart_advisor():
    """Smart Advisor chatbot endpoint — uses Groq (fast, free tier available)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400

        messages      = data.get('messages', [])
        system_prompt = data.get('systemPrompt', 'You are Smart Advisor at DIU.')
        try:
            max_tokens = max(1, min(int(data.get('maxTokens', 512)), 4096))
        except (ValueError, TypeError):
            max_tokens = 512

        if not messages:
            return jsonify({'success': False, 'message': 'messages array required'}), 400

        groq_svc = get_groq_service()
        if groq_svc is None:
            return jsonify({'success': False, 'message': 'AI service not configured'}), 503

        advisor_client = getattr(groq_svc, 'advisor_client', None)
        advisor_model  = getattr(groq_svc, 'advisor_model', None)
        if advisor_client is None or advisor_model is None:
            return jsonify({'success': False, 'message': 'Advisor client not initialised'}), 503

        # Build messages for Groq
        groq_messages = [{'role': 'system', 'content': system_prompt}]
        for m in messages[-12:]:                          # keep last 12 for context
            role = m.get('role', 'user')
            if role in ('user', 'assistant'):
                groq_messages.append({'role': role, 'content': m.get('content', '')})

        completion = advisor_client.chat.completions.create(
            model=advisor_model,
            messages=groq_messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        reply = completion.choices[0].message.content
        return jsonify({'success': True, 'reply': reply}), 200

    except Exception as e:
        logger.error(f'Smart Advisor error: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/health', methods=['GET'])
def health():
    svc = get_groq_service()
    return jsonify({
        'status': 'healthy',
        'groqConfigured': svc is not None,
        'model': svc.model if svc else None
    }), 200
