from flask import Blueprint, render_template, request, jsonify
from app.services.search_service import GoogleIndexChecker
from config import Config
import csv
import json

main = Blueprint('main', __name__)
index_checker = GoogleIndexChecker()

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/check-index', methods=['POST'])
def check_index():
    mode = request.form.get('mode')
    apikey = request.form.get('apikey')

    if 'file' in request.files:
        file = request.files['file']    
        stream = file.stream.read().decode('utf-8').splitlines()
        reader = csv.reader(stream)
        urls = [row[0] for row in reader]
    else:
        urls = json.loads(request.form.get('urls'))
        if not urls:
            return jsonify({'error': 'Missing urls parameter'}), 400    
    
    check_index_status = index_checker.check_indexed_batch(apikey, urls, mode)
    return jsonify(check_index_status)
