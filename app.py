import json
import os
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='.')

DATA_FILE = 'events.json'

# 데이터 파일 로드
def load_events_from_file():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

# 데이터 파일 저장
def save_events_to_file(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 정적 파일 제공 (HTML, CSS, JS)
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# 일정 데이터를 가져오는 API
@app.route('/api/events', methods=['GET'])
def get_events():
    events_data = load_events_from_file()
    # 클라이언트에서 연도와 월을 보내지 않으므로 전체 데이터 반환
    return jsonify(events_data)

# 일정 데이터를 저장하는 API
@app.route('/api/events', methods=['POST'])
def save_event():
    data = request.json
    date = data.get('date')
    event = data.get('event')

    if not date or not event or 'author' not in event or 'content' not in event:
        return jsonify({"message": "Invalid data"}), 400

    events_data = load_events_from_file()

    if date not in events_data:
        events_data[date] = []

    events_data[date].append(event)
    save_events_to_file(events_data)

    return jsonify({"message": "Event saved successfully", "event": event}), 201

# 일정 데이터를 삭제하는 API
@app.route('/api/events', methods=['DELETE'])
def delete_event():
    date = request.args.get('date')
    index = request.args.get('index')

    if not date or index is None:
         return jsonify({"message": "Invalid data"}), 400

    try:
        index = int(index)
    except ValueError:
        return jsonify({"message": "Invalid index"}), 400

    events_data = load_events_from_file()

    if date in events_data and 0 <= index < len(events_data[date]):
        deleted_event = events_data[date].pop(index)
        if len(events_data[date]) == 0:
            del events_data[date] # 해당 날짜에 일정이 없으면 키 삭제
        save_events_to_file(events_data)
        return jsonify({"message": "Event deleted successfully", "event": deleted_event}), 200
    else:
        return jsonify({"message": "Event not found"}), 404


if __name__ == '__main__':
    # 배포 환경에서는 PORT 환경 변수를 사용하고, 없으면 기본값 5000 사용
    port = int(os.environ.get('PORT', 5000))
    # TODO: 배포 환경에서는 debug=False로 설정해야 합니다.
    # Cloudtype 배포 시에는 gunicorn 등을 사용하도록 변경해야 할 수 있습니다.
    app.run(debug=True, host='0.0.0.0', port=port)
