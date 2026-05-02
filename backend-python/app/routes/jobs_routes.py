from flask import Blueprint, request, jsonify
import logging
import requests as http_requests
from app.config.settings import Config

logger = logging.getLogger(__name__)
bp = Blueprint('jobs', __name__, url_prefix='/api/v1/jobs')

_JSEARCH_HOST = 'jsearch.p.rapidapi.com'
_JSEARCH_URL  = f'https://{_JSEARCH_HOST}/search'

_MOCK_JOBS = [
    {
        'id': '1', 'title': 'Junior Software Engineer', 'company': 'Brain Station 23',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳30,000–45,000/mo',
        'url': 'https://brainstation-23.com/career',
        'description': 'Python Django React Node.js SQL Git REST API JavaScript software development agile',
        'posted': '2 days ago', 'logo': 'https://logo.clearbit.com/brainstation-23.com',
    },
    {
        'id': '2', 'title': 'Frontend Developer (React)', 'company': 'SELISE Digital Platforms',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳35,000–55,000/mo',
        'url': 'https://selisegroup.com/careers',
        'description': 'React JavaScript TypeScript HTML CSS Redux Tailwind REST API Git frontend',
        'posted': '3 days ago', 'logo': 'https://logo.clearbit.com/selisegroup.com',
    },
    {
        'id': '3', 'title': 'Python Developer', 'company': 'Kaz Software',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳40,000–60,000/mo',
        'url': 'https://kaz.com.bd/careers',
        'description': 'Python Django Flask REST API PostgreSQL Docker Git Machine Learning backend',
        'posted': '1 week ago', 'logo': 'https://logo.clearbit.com/kaz.com.bd',
    },
    {
        'id': '4', 'title': 'Machine Learning Engineer', 'company': 'Intelligent Machines',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳60,000–90,000/mo',
        'url': 'https://im.ai/careers',
        'description': 'Python TensorFlow Machine Learning Deep Learning NLP Data Analysis SQL scikit-learn Docker',
        'posted': '4 days ago', 'logo': 'https://logo.clearbit.com/im.ai',
    },
    {
        'id': '5', 'title': 'Mobile App Developer (Flutter)', 'company': 'SSL Wireless',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳35,000–55,000/mo',
        'url': 'https://sslwireless.com/career',
        'description': 'Flutter Dart Android iOS Firebase REST API Git mobile development',
        'posted': '5 days ago', 'logo': 'https://logo.clearbit.com/sslwireless.com',
    },
    {
        'id': '6', 'title': 'DevOps Engineer', 'company': 'Shohoz',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳55,000–80,000/mo',
        'url': 'https://shohoz.com/careers',
        'description': 'Docker Kubernetes AWS DevOps CI/CD Linux Bash Git Jenkins cloud infrastructure',
        'posted': '1 week ago', 'logo': 'https://logo.clearbit.com/shohoz.com',
    },
    {
        'id': '7', 'title': 'Data Analyst', 'company': 'Pathao',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳40,000–65,000/mo',
        'url': 'https://pathao.com/careers',
        'description': 'SQL Python Data Analysis Excel Power BI statistics dashboard reporting analytics',
        'posted': '2 days ago', 'logo': 'https://logo.clearbit.com/pathao.com',
    },
    {
        'id': '8', 'title': 'Backend Developer (Node.js)', 'company': 'Chaldal',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳38,000–58,000/mo',
        'url': 'https://chaldal.com/careers',
        'description': 'Node.js JavaScript MongoDB REST API Express Git Docker backend microservices',
        'posted': '3 days ago', 'logo': 'https://logo.clearbit.com/chaldal.com',
    },
    {
        'id': '9', 'title': 'UI/UX Designer', 'company': 'Therap Services',
        'location': 'Sylhet, Bangladesh', 'type': 'Full-time', 'salary': '৳30,000–50,000/mo',
        'url': 'https://therapbd.com/careers',
        'description': 'Figma UI UX design Adobe XD wireframe prototype user research CSS',
        'posted': '6 days ago', 'logo': 'https://logo.clearbit.com/therapbd.com',
    },
    {
        'id': '10', 'title': 'Cybersecurity Analyst', 'company': 'Sheba.xyz',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳50,000–75,000/mo',
        'url': 'https://sheba.xyz/careers',
        'description': 'Cybersecurity network security Linux Python penetration testing OWASP firewall SIEM',
        'posted': '1 week ago', 'logo': 'https://logo.clearbit.com/sheba.xyz',
    },
    {
        'id': '11', 'title': 'Software Engineer (Java)', 'company': 'BJIT Limited',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳45,000–70,000/mo',
        'url': 'https://bjitgroup.com/careers',
        'description': 'Java Spring Boot SQL REST API Microservices Docker Git Maven backend development',
        'posted': '2 days ago', 'logo': 'https://logo.clearbit.com/bjitgroup.com',
    },
    {
        'id': '12', 'title': 'Cloud Engineer (AWS)', 'company': 'DataSoft Systems',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳60,000–90,000/mo',
        'url': 'https://datasoft-bd.com/career',
        'description': 'AWS cloud Lambda EC2 S3 Terraform Docker Kubernetes DevOps infrastructure automation',
        'posted': '4 days ago', 'logo': 'https://logo.clearbit.com/datasoft-bd.com',
    },
    {
        'id': '13', 'title': 'PHP Developer (Laravel)', 'company': 'Nascenia',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳28,000–45,000/mo',
        'url': 'https://nascenia.com/careers',
        'description': 'PHP Laravel MySQL JavaScript REST API Git backend web development',
        'posted': '5 days ago', 'logo': 'https://logo.clearbit.com/nascenia.com',
    },
    {
        'id': '14', 'title': 'QA Engineer', 'company': 'Tiger IT Bangladesh',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': '৳30,000–48,000/mo',
        'url': 'https://tigertms.com/careers',
        'description': 'QA testing Selenium automation manual testing Python SQL bug reporting agile Jira',
        'posted': '1 week ago', 'logo': 'https://logo.clearbit.com/tigertms.com',
    },
    {
        'id': '15', 'title': 'Graduate Trainee – Software', 'company': 'Grameenphone',
        'location': 'Dhaka, Bangladesh', 'type': 'Full-time', 'salary': 'Competitive',
        'url': 'https://grameenphone.com/about/career',
        'description': 'Python JavaScript SQL software engineering communication teamwork fresh graduate entry level',
        'posted': '3 days ago', 'logo': 'https://logo.clearbit.com/grameenphone.com',
    },
]


@bp.route('/search', methods=['GET'])
def search_jobs():
    term = (request.args.get('term', '') or '').strip().lower()
    if not term:
        return jsonify({'success': True, 'data': _MOCK_JOBS, 'count': len(_MOCK_JOBS), 'term': ''}), 200

    keywords = [w for w in term.split() if len(w) > 1]
    filtered = [
        j for j in _MOCK_JOBS
        if any(
            kw in j['title'].lower() or
            kw in j['company'].lower() or
            kw in j['description'].lower() or
            kw in j['location'].lower()
            for kw in keywords
        )
    ]
    return jsonify({'success': True, 'data': filtered, 'count': len(filtered), 'term': term}), 200


@bp.route('/external', methods=['GET'])
def external_jobs():
    keyword  = (request.args.get('keyword',  '') or '').strip()
    location = (request.args.get('location', '') or '').strip() or 'Bangladesh'

    if not keyword:
        return jsonify({'success': False, 'message': 'keyword is required', 'errorCode': 'VALIDATION_ERROR'}), 400

    api_key = Config.RAPIDAPI_KEY
    if not api_key or api_key == 'your_rapidapi_key_here':
        return jsonify({'success': False, 'message': 'Job search API not configured', 'errorCode': 'SERVICE_NOT_CONFIGURED'}), 503

    try:
        resp = http_requests.get(
            _JSEARCH_URL,
            params={'query': f'{keyword} in {location}', 'num_pages': '1', 'page': '1', 'date_posted': 'month'},
            headers={'X-RapidAPI-Key': api_key, 'X-RapidAPI-Host': _JSEARCH_HOST},
            timeout=12,
        )

        if resp.status_code == 429:
            return jsonify({'success': False, 'message': 'Rate limit reached. Please try again in a moment.', 'errorCode': 'RATE_LIMIT'}), 429

        if resp.status_code in (401, 403):
            logger.error(f'JSearch API auth error: {resp.status_code} {resp.text[:200]}')
            return jsonify({'success': False, 'message': 'Job search API subscription required. Please subscribe to JSearch on RapidAPI.', 'errorCode': 'NOT_SUBSCRIBED'}), 403

        if not resp.ok:
            logger.error(f'JSearch API error: {resp.status_code} {resp.text[:200]}')
            return jsonify({'success': False, 'message': 'External job search unavailable', 'errorCode': 'UPSTREAM_ERROR'}), 502

        raw_jobs = resp.json().get('data', [])

        # Keyword relevance filter — title or first 400 chars of description must contain keyword
        kw_lower = keyword.lower()
        results = []
        for job in raw_jobs:
            title = (job.get('job_title') or '').strip()
            desc_snippet = (job.get('job_description') or '')[:400].lower()
            if kw_lower not in title.lower() and kw_lower not in desc_snippet:
                continue
            city    = job.get('job_city')    or ''
            country = job.get('job_country') or ''
            results.append({
                'job_title':      title,
                'employer_name':  (job.get('employer_name') or '').strip(),
                'job_city':       city,
                'job_country':    country,
                'job_location':   ', '.join(filter(None, [city, country])) or location,
                'job_apply_link': job.get('job_apply_link') or job.get('job_google_link') or '',
            })

        logger.info(f'External jobs: keyword="{keyword}" location="{location}" raw={len(raw_jobs)} filtered={len(results)}')
        return jsonify({'success': True, 'data': results, 'count': len(results), 'keyword': keyword, 'location': location}), 200

    except http_requests.Timeout:
        return jsonify({'success': False, 'message': 'Job search timed out. Please try again.', 'errorCode': 'TIMEOUT'}), 504
    except Exception as e:
        logger.error(f'External jobs error: {e}')
        return jsonify({'success': False, 'message': 'Failed to fetch external jobs', 'errorCode': 'INTERNAL_ERROR'}), 500


@bp.route('/health', methods=['GET'])
def jobs_health():
    return jsonify({'status': 'ok', 'service': 'jobs'}), 200
