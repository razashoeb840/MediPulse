# 🏥 MediPulse - SmartCare Hospital Management System

![MediPulse Banner](banner.png)

Welcome to **MediPulse** (also known as SmartCare) - a comprehensive, full-stack Hospital Management System designed to streamline hospital operations, enhance patient care, and provide a seamless digital experience for doctors, patients, and administrators.

---

## 🌟 Overview

MediPulse is built with a modern tech stack to handle the complex workflows of a medical facility. It features real-time updates using Socket.io, robust data management with MongoDB, and an intuitive, responsive frontend tailored for various hospital roles. 

Whether it's managing patient queues, tracking pharmacy inventory, or assigning beds, MediPulse offers a unified platform for all your hospital needs.

---

## ✨ Key Features

- **Role-Based Access Control:** Dedicated, secure modules for Admins, Doctors, Receptionists, and Patients. Guest access available for testing.
- **Real-Time Data Synchronization:** Live updates for patient queues, bed availability, and pharmacy stock using WebSockets (Socket.io).
- **Patient Queue Management:** Efficient token-based queuing system ensuring smooth patient flow for doctor consultations.
- **Digital Prescriptions:** Doctors can write and instantly send digital prescriptions directly to the pharmacy POS.
- **Pharmacy & Inventory POS:** Point-of-Sale system for selling medicines with automatic stock deduction, alerts, and billing.
- **Bed & Ward Management:** Visual representation of bed occupancy across different wards (ICU, General, etc.).
- **Admin Dashboard:** Comprehensive analytics, staff management (add/remove doctors and staff), and financial overviews.

---

## 🛠️ Technology Stack

### Frontend
- **HTML5 & CSS3:** Semantic markup with modern, visually appealing, and mobile-responsive styling.
- **Vanilla JavaScript:** Fast, lightweight DOM manipulation and API integration without the overhead of heavy frameworks.

### Backend
- **Node.js:** Powerful JavaScript runtime environment.
- **Express.js:** Fast, unopinionated web framework for building the RESTful APIs.
- **Socket.io:** Enables real-time, bi-directional communication between web clients and the server.

### Database
- **MongoDB:** NoSQL database for flexible and highly scalable data storage.
- **Mongoose:** Elegant MongoDB object modeling for Node.js, ensuring strict schema validation.

---

## 📂 Project Structure & Modules

The application is divided into distinct HTML interfaces, each serving a specific operational role:

| Module File | Description |
| :--- | :--- |
| `1index.html` | **Main Landing Page** - The entry point and navigation hub to the system. |
| `8login.html` | **Authentication System** - Secure login portal enforcing ID-based role validation. |
| `9admin_dashboard.html` | **Admin Dashboard** - System-wide analytics, staff registration, and workforce management. |
| `2patient.html` | **Reception / Registration** - For registering new patients, capturing details, and assigning them to doctors. |
| `3doctor_module.html` / `3doctor_module2.html` | **Doctor's Portal** - View patient queues, check medical histories, and prescribe medicines. |
| `4bed_management.html` | **Bed Management** - Track, assign, and discharge hospital beds in real-time. |
| `5medicine.html` | **Pharmacy POS** - Manage inventory, process sales, and view digital prescriptions seamlessly. |
| `6patient_portal.html` | **Patient Portal** - Interface for patients to view their queue status and prescriptions. |
| `7patient_history.html` | **Patient Records** - Comprehensive, searchable view of past patient consultations. |

---

## 🚀 Installation & Setup Guide

Follow these simple steps to get the project running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas account)

### 1. Clone the Repository
*(Note: Skip this step if you already have the source code locally)*
```bash
git clone https://github.com/razashoeb840/MediPulse.git
cd MediPulse
```

### 2. Install Dependencies
Navigate to the project directory and install the required Node.js packages:
```bash
npm install
```
*(This installs Express, Mongoose, Socket.io, Cors, and Dotenv).*

### 3. Environment Configuration
The project uses `dotenv` for environment variables. The database connection is already configured in `server.js`, but you can override it by creating a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_custom_mongodb_connection_string
```

### 4. Database Seeding (Optional)
To populate the database with initial dummy data (medicines, staff, etc.) for testing:
```bash
node seed.js
```

### 5. Start the Server
Start the Express backend server:
```bash
npm start
```
*You should see a message confirming: `Server running on port 5000` and `MongoDB Connected`.*

### 6. Access the Application
Open your preferred web browser and navigate to:
```
http://localhost:5000
```

---

## 📡 Core API Endpoints

Here is a quick reference to the major RESTful APIs powering the backend:

### Authentication & Staff Management
- `POST /api/doctors/login` - Authenticates doctor login.
- `GET /api/admin/staff` - Retrieves all registered hospital staff (Doctors, Receptionists, etc.).
- `POST /api/admin/register-staff` - Registers a new doctor or staff member and generates a unique ID.
- `DELETE /api/admin/staff/:id` - Removes a staff member from the system.
- `PUT /api/doctors/:id/active` - Toggles the real-time availability status of a doctor.

### Patient & Queue Management
- `POST /api/patients/register` - Registers a new patient, assigns a doctor, and generates a queue token.
- `GET /api/patients/queue` - Fetches the current active patient queue.
- `GET /api/patients/history` - Retrieves all past patient records and consultation histories.
- `PUT /api/patients/:id/status` - Updates patient lifecycle status (e.g., waiting, prescribed, completed).

### Medical & Pharmacy Operations
- `POST /api/prescriptions` - Submits a new digital prescription for a patient.
- `GET /api/medicines` - Lists all available inventory medicines.
- `POST /api/medicines/sell` - Processes a pharmacy sale, validating and deducting stock automatically.
- `GET /api/beds` - Retrieves all hospital beds and their current occupancy status.

---

## 💡 Usage Workflow Example
1. **Admin** logs in, registers a new Doctor, and monitors hospital stats.
2. **Receptionist** registers a patient and assigns them to the newly created Doctor.
3. **Patient** waits; their token updates live on the Patient Portal.
4. **Doctor** sees the patient in their queue, conducts the checkup, and submits a digital prescription.
5. **Pharmacist** receives the prescription instantly in the Pharmacy module and processes the final billing.

---

## 🤝 Contribution

This project is currently maintained as an academic/portfolio project. For feedback or suggestions, please refer to the repository owner.

---

## 📄 License

This project is licensed under the **ISC License**.

---
*Developed with ❤️ for smarter healthcare management.*
