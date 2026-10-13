/**
 * Smart Vehicle Maintenance Platform - Optional Demo Data Seeder
 * Creates an explicitly labeled demo account with realistic sample vehicles,
 * service records, and reminders for testing and walkthrough demonstrations.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const databaseName = process.env.DB_NAME || 'smart_vehicle_maintenance';

  console.log('----------------------------------------------------');
  console.log('Seeding Optional Demo Account & Realistic Records');
  console.log('----------------------------------------------------');

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: databaseName
    });

    // 1. Create or replace Demo User
    const demoEmail = 'demo@smartvehicle.com';
    const demoPasswordPlain = 'Demo123!';
    const passwordHash = await bcrypt.hash(demoPasswordPlain, 10);

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [demoEmail]);
    let demoUserId;

    if (existing.length > 0) {
      demoUserId = existing[0].id;
      // Clean up previous demo data for fresh seed
      await connection.query('DELETE FROM vehicles WHERE user_id = ?', [demoUserId]);
      await connection.query('UPDATE users SET name = ?, password_hash = ? WHERE id = ?', 
        ['Demo Vehicle Owner', passwordHash, demoUserId]);
      console.log(`✓ Existing demo account (ID: ${demoUserId}) reset for fresh data.`);
    } else {
      const [insertUser] = await connection.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Demo Vehicle Owner', demoEmail, passwordHash]
      );
      demoUserId = insertUser.insertId;
      console.log(`✓ Created demo user account (ID: ${demoUserId}).`);
    }

    // 2. Add Demo Vehicles
    const [v1Res] = await connection.query(`
      INSERT INTO vehicles (user_id, name, registration_number, vehicle_type, make, model, year, fuel_type, current_odometer, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [demoUserId, 'Family Sedan', 'KA-01-AB-1234', 'Sedan', 'Toyota', 'Camry XSE', 2021, 'Petrol', 42500, '2021-04-15']);
    const v1Id = v1Res.insertId;

    const [v2Res] = await connection.query(`
      INSERT INTO vehicles (user_id, name, registration_number, vehicle_type, make, model, year, fuel_type, current_odometer, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [demoUserId, 'Adventure SUV', 'KA-05-CD-5678', 'SUV', 'Ford', 'Explorer ST', 2022, 'Petrol', 28100, '2022-08-20']);
    const v2Id = v2Res.insertId;

    console.log(`✓ Added 2 demo vehicles (Camry ID: ${v1Id}, Explorer ID: ${v2Id}).`);

    // 3. Add Service Records across recent months for Chart & History demonstration
    const services = [
      // Camry Services
      [v1Id, demoUserId, '2026-05-10', 30000, 'Full Synthetic Oil Change', 'Oil and filter replacement with 0W-20 synthetic blend.', 'OEM Oil Filter, 5L Full Synthetic Oil', 'Apex Toyota Care', 85.00, '2026-11-10'],
      [v1Id, demoUserId, '2026-07-18', 35000, 'Brake Inspection & Pad Renewal', 'Front ceramic brake pads replaced and rotors resurfaced.', 'Front Ceramic Brake Pads', 'Metro Precision Auto', 240.00, '2027-01-18'],
      [v1Id, demoUserId, '2026-09-05', 40000, 'Tire Rotation & Wheel Balancing', 'Rotated all 4 tires; high speed dynamic balancing performed.', 'Wheel Weights', 'Speedy Tyre & Alignment', 65.00, '2027-03-05'],
      [v1Id, demoUserId, '2026-10-02', 42500, 'Air & Cabin Filter Replacement', 'Replaced dirty engine air filter and active carbon cabin filter.', 'Engine Air Filter, HEPA Cabin Filter', 'Apex Toyota Care', 95.00, '2027-04-02'],
      // Explorer Services
      [v2Id, demoUserId, '2026-04-12', 15000, 'Scheduled General Maintenance', 'Standard 15k factory scheduled multipoint inspection & fluids.', 'Wiper Blades, Washer Fluid, Oil Filter', 'Summit Ford Service', 150.00, '2026-10-12'],
      [v2Id, demoUserId, '2026-08-22', 25000, 'Transmission Fluid Service', 'Automatic transmission drain and refill with Mercon LV fluid.', 'Transmission Fluid (6L)', 'Summit Ford Service', 280.00, '2027-08-22']
    ];

    for (const s of services) {
      await connection.query(`
        INSERT INTO service_records (vehicle_id, user_id, service_date, odometer_reading, service_type, description, parts_replaced, service_center, total_cost, next_service_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, s);
    }
    console.log(`✓ Logged ${services.length} realistic service history records with monthly expenses.`);

    // 4. Add Maintenance Reminders (upcoming, due soon, overdue, completed)
    const reminders = [
      // Upcoming reminder for Camry
      [v1Id, demoUserId, 'Engine Oil & Filter Change', '2026-11-10', 45000, 'Due around 45k km mark or 6 months.', 'upcoming', null],
      // Overdue reminder for Explorer
      [v2Id, demoUserId, 'Battery Health & Terminal Check', '2026-10-01', 28000, 'Check cold cranking amps before winter season.', 'overdue', null],
      // Due soon reminder for Camry
      [v1Id, demoUserId, 'Brake Fluid Flush', '2026-10-25', 43000, 'Moisture test indicated 3% water content.', 'upcoming', null],
      // Completed reminder
      [v1Id, demoUserId, 'Cabin Air Filter Replacement', '2026-10-02', 42500, 'Replaced during October servicing.', 'completed', '2026-10-02']
    ];

    for (const r of reminders) {
      await connection.query(`
        INSERT INTO maintenance_reminders (vehicle_id, user_id, task_name, due_date, due_odometer, notes, status, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, r);
    }
    console.log(`✓ Created ${reminders.length} sample maintenance reminders (Upcoming, Due soon, Overdue, Completed).`);

    console.log('----------------------------------------------------');
    console.log('Demo Data Seed Completed!');
    console.log('Login credentials:');
    console.log(`  Email:    ${demoEmail}`);
    console.log(`  Password: ${demoPasswordPlain}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Error seeding demo data:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };
