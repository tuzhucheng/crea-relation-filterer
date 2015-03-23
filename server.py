from flask import Flask, jsonify, send_from_directory, make_response, request
import StringIO, csv
app = Flask(__name__, static_url_path='')


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('static/js', path)


@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('static/css', path)


@app.route('/api/get_all_relations')
def get_all_relations():
    relations = []
    with open('data/output.csv', 'r') as f:
        for line in f:
            parts = line.split(';');
            relations.append({'subject': parts[2],
                              'predicate': parts[1],
                              'object': parts[0],
                              'keyword': parts[3],
                              'article_id': parts[4].rstrip()})
    return jsonify(relations=relations)


@app.route('/api/get_pg_export', methods=['POST'])
def get_pg_export():
    post = request.get_json()

    relations = sorted(post.get('relations'), key=lambda x: x['id'])
    csvList = '\n'.join(';'.join([rel['subject'], rel['predicate'], rel['object'], rel['keyword'],
     'http://www.ncbi.nlm.nih.gov/pubmed/' + rel['article_id']]) for rel in relations)
    output = make_response(csvList)
    output.headers["Content-Disposition"] = "attachment; filename=pg_export.csv"
    output.headers["Content-type"] = "text/csv"
    return output


if __name__ == "__main__":
    app.run()