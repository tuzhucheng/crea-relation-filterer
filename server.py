from flask import Flask, jsonify, send_from_directory, make_response, request
from pymongo import MongoClient
import os
import json
app = Flask(__name__, static_url_path='')

mongo_uri = os.environ['MONGOLAB_URI']
mongo_database_str = mongo_uri.split('/')[-1]
client = MongoClient(mongo_uri)
db = client[mongo_database_str]
relations_collection = db['relations']
access_codes_collection = db['access_codes']


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
    relations = relations_collection.find()
    if relations.count() == 0:
        relations = []
        id = 1
        with open('data/output.csv', 'r') as f:
            for line in f:
                parts = line.split(';');
                relations.append({'id': id,
                                  'subject': parts[2],
                                  'predicate': parts[1],
                                  'object': parts[0],
                                  'keyword': parts[3],
                                  'article_id': parts[4].rstrip()})
                id += 1
    else:
        sanitized_relations = []
        for relation in relations:
            relation.pop('_id', None);
            sanitized_relations.append(relation)
        relations = sanitized_relations
    return jsonify(relations=relations)


@app.route('/api/get_pg_export', methods=['POST'])
def get_pg_export():
    relations = relations_collection.find()
    relations = sorted(relations, key=lambda x: x['id'])
    csvList = '\n'.join(';'.join([rel['subject'], rel['predicate'], rel['object'], rel['keyword'],
     'http://www.ncbi.nlm.nih.gov/pubmed/' + rel['article_id']]) for rel in relations)
    output = make_response(csvList)
    output.headers["Content-Disposition"] = "attachment; filename=pg_export.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@app.route('/api/save_relations', methods=['POST'])
def save_relations():
    post = request.get_json()
    relations = sorted(post.get('relations'), key=lambda x: x['id'])
    hashed_password = post.get('password')

    authorized = False
    for valid_hash in access_codes_collection.find():
        if valid_hash['hash'] == hashed_password:
            authorized = True
            break

    if authorized:
        # empty existing relations
        relations_collection.remove({})
        relations_collection.insert(relations)
        return json.dumps({'success':True}), 200, {'ContentType':'application/json'}
    else:
        return json.dumps({'success':False}), 403, {'ContentType':'application/json'}


if __name__ == "__main__":
    app.run()