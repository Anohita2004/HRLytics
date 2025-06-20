import os
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# SQLite Config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/user/Desktop/sapui5-to-powerbi/instance/employees.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Employee Table
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100))
    Designation = db.Column(db.String(100))
    EMail = db.Column(db.String(100))
    Department = db.Column(db.String(50))
    DateOfJoining = db.Column(db.String(20))
    Salary = db.Column(db.String(20))
    Location = db.Column(db.String(100))
    DateOfBirth = db.Column(db.String(20))
    Status = db.Column(db.String(20))

# Initialize DB
with app.app_context():
    db.create_all()

# POST: Receive and save data
@app.route("/api/data", methods=["POST"])
def save_data():
    print("Raw request data:", request.data)
    print("Request content type:", request.content_type)
    data = request.get_json()
    print("Parsed JSON data:", data)
    if not data:
        return jsonify({"message": "No data received"}), 400

    try:
        Employee.query.delete()
        db.session.commit()

        for emp in data:
            print("Adding:", emp.get("ID"), emp.get("Status"))
            new_emp = Employee(
                id=int(emp.get("ID")),
                Name=emp.get("Name"),
                Designation=emp.get("Designation"),
                EMail=emp.get("EMail"),
                Department=emp.get("Department"),
                DateOfJoining=emp.get("DateOfJoining"),
                Salary=emp.get("Salary"),
                Location=emp.get("Location"),
                DateOfBirth=emp.get("DateOfBirth"),
                Status=emp.get("Status")
            )
            db.session.add(new_emp)

        db.session.commit()
        for e in Employee.query.all():
            print("DB row:", e.id, e.Status)

        with open("update_log.txt", "a") as log:
            log.write(f"Data updated at {datetime.now().isoformat()}\n")

        return jsonify({"message": "Data saved to SQLite"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET all employee data
@app.route("/api/data", methods=["GET"])
def get_all_data():
    try:
        employees = Employee.query.all()
        return jsonify([{
            "ID": e.id,
            "Name": e.Name,
            "Designation": e.Designation,
            "EMail": e.EMail,
            "Department": e.Department,
            "DateOfJoining": e.DateOfJoining,
            "Salary": e.Salary,
            "Location": e.Location,
            "DateOfBirth": e.DateOfBirth,
            "Status": e.Status
        } for e in employees]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Launch Power BI Dashboard
@app.route("/launch_dashboard", methods=["GET"])
def launch_dashboard():
    pbix_path = r"C:\Users\user\Desktop\your_dashboard.pbix"  # Update this path
    try:
        if os.path.exists(pbix_path):
            subprocess.Popen(['start', '', pbix_path], shell=True)
            return "Dashboard launched", 200
        else:
            return f"PBIX file not found at {pbix_path}", 404
    except Exception as e:
        return f"Error launching dashboard: {e}", 500

if __name__ == "__main__":
    app.run(debug=True)

