from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import re  # [NUEVO] Para validaciones con Regex

app = Flask(__name__)
CORS(app) 

BBDD_FILE = 'bbdd.json'

# --- FUNCIONES AUXILIARES ---

def leer_bbdd():
    if not os.path.exists(BBDD_FILE):
        return {"usuarios": [], "notas": []}
    try:
        with open(BBDD_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"usuarios": [], "notas": []}

def guardar_bbdd(data):
    with open(BBDD_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# [MODIFICADO] Función para validar complejidad de contraseña estricta
def validar_password_complejidad(password):
    # Explicación del Regex:
    # (?=.*[a-z]) -> Al menos una minúscula
    # (?=.*[A-Z]) -> Al menos una mayúscula
    # (?=.*\d)    -> Al menos un número
    # (?=.*[@$!%*?&._]) -> Al menos un carácter especial
    # {6,15}      -> Entre 6 y 15 caracteres de longitud
    regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._])[A-Za-z\d@$!%*?&._]{6,15}$"
    
    if " " in password:
        return False
    return re.match(regex, password) is not None

# --- RUTAS DE AUTENTICACIÓN ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({"mensaje": "Datos no recibidos"}), 400
    
    email = data.get("email", "").strip()
    password = data.get("password", "")

    # [SURVIVAL CHECKLIST: VALIDACIÓN]
    if not email or not password:
        return jsonify({"mensaje": "Email y contraseña son obligatorios"}), 400

    if not validar_password_complejidad(password):
        return jsonify({"mensaje": "La contraseña debe tener entre 6 y 15 caracteres, incluir mayúscula, minúscula, número y un carácter especial (@$!%*?&), sin espacios."}), 400

    bbdd = leer_bbdd()
    
    if any(usuario["email"] == email for usuario in bbdd["usuarios"]):
        return jsonify({"mensaje": "Este email ya está registrado"}), 409

    password_hasheada = generate_password_hash(password)

    nuevo_usuario = {
        "id": len(bbdd["usuarios"]) + 1,
        "email": email,
        "password": password_hasheada
    }
    
    bbdd["usuarios"].append(nuevo_usuario)
    guardar_bbdd(bbdd)
    
    return jsonify({
        "mensaje": "Usuario registrado con éxito", 
        "usuario": {"id": nuevo_usuario["id"], "email": nuevo_usuario["email"]}
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"mensaje": "Faltan credenciales"}), 400
        
    email = data.get("email", "").strip()
    password = data.get("password", "")
    
    bbdd = leer_bbdd()
    
    for usuario in bbdd["usuarios"]:
        if usuario["email"] == email:
            if check_password_hash(usuario["password"], password):
                return jsonify({
                    "mensaje": "Login exitoso",
                    "usuario": {"id": usuario["id"], "email": usuario["email"]}
                }), 200
            else:
                return jsonify({"mensaje": "Credenciales inválidas"}), 401
                
    return jsonify({"mensaje": "Credenciales inválidas"}), 401

# --- RUTAS DE NOTAS ---

@app.route('/api/notas', methods=['GET', 'POST'])
def notas():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"mensaje": "Acceso denegado"}), 401
        
    bbdd = leer_bbdd()
    
    if request.method == 'GET':
        mis_notas = [nota for nota in bbdd["notas"] if str(nota["user_id"]) == str(user_id)]
        return jsonify({"notas": mis_notas}), 200
        
    if request.method == 'POST':
        data = request.get_json()
        titulo = data.get("titulo", "").strip()
        contenido = data.get("contenido", "").strip()
        
        if not titulo or not contenido:
            return jsonify({"mensaje": "Título y contenido no pueden estar vacíos"}), 400
            
        nueva_nota = {
            "id": len(bbdd["notas"]) + 1,
            "user_id": int(user_id),
            "titulo": titulo,
            "contenido": contenido 
        }
        
        bbdd["notas"].append(nueva_nota)
        guardar_bbdd(bbdd)
        
        return jsonify({"mensaje": "Nota guardada con éxito", "nota": nueva_nota}), 201

@app.route('/api/notas/<int:nota_id>', methods=['PUT', 'DELETE'])
def manejar_nota(nota_id):
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return jsonify({"mensaje": "Acceso denegado"}), 401

    bbdd = leer_bbdd()
    nota_index = next((index for (index, d) in enumerate(bbdd["notas"]) if d["id"] == nota_id), None)

    if nota_index is None:
        return jsonify({"mensaje": "Nota no encontrada"}), 404

    nota = bbdd["notas"][nota_index]

    if str(nota["user_id"]) != str(user_id):
        return jsonify({"mensaje": "No tienes permiso"}), 403

    if request.method == 'DELETE':
        bbdd["notas"].pop(nota_index)
        guardar_bbdd(bbdd)
        return jsonify({"mensaje": "Nota eliminada"}), 200

    if request.method == 'PUT':
        data = request.get_json()
        titulo = data.get("titulo", "").strip()
        contenido = data.get("contenido", "").strip()

        if not titulo or not contenido:
            return jsonify({"mensaje": "Campos obligatorios"}), 400

        bbdd["notas"][nota_index]["titulo"] = titulo
        bbdd["notas"][nota_index]["contenido"] = contenido
        guardar_bbdd(bbdd)

        return jsonify({"mensaje": "Nota actualizada", "nota": bbdd["notas"][nota_index]}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)