/**
 * Smart Vehicle Maintenance Platform - Reminder & Notification Service
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const { query } = require('../config/db');

// Check if valid SMTP credentials are provided in environment
function isEmailConfigured() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass && user.trim() !== '' && pass.trim() !== '');
}

// Nodemailer transport factory
function getMailerTransport() {
  if (!isEmailConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Send email with honest delivery reporting
async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    return {
      sent: false,
      reason: 'SMTP credentials are not configured in .env. Configure SMTP_USER and SMTP_PASS to enable real email dispatch.'
    };
  }

  try {
    const transporter = getMailerTransport();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `Smart Vehicle Platform <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || ''
    });

    return {
      sent: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Nodemailer dispatch error:', error.message);
    return {
      sent: false,
      reason: `Email delivery failed: ${error.message}`
    };
  }
}

// Update overdue statuses in the database
async function updateOverdueStatuses() {
  try {
    const today = new Date().toISOString().split('T')[0];
    await query(`
      UPDATE maintenance_reminders
      SET status = 'overdue'
      WHERE status = 'upcoming' AND due_date < ?
    `, [today]);
  } catch (err) {
    // Database might not be initialized yet during early boot
  }
}

// Check and dispatch notifications for due/overdue items
async function checkAndSendReminders() {
  await updateOverdueStatuses();

  if (!isEmailConfigured()) {
    return {
      success: true,
      emailEnabled: false,
      message: 'In-app reminder statuses refreshed. Email dispatch skipped (SMTP not configured in .env).'
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    // Find un-notified reminders due today or overdue
    const pendingReminders = await query(`
      SELECT 
        r.id, r.task_name, r.due_date, r.due_odometer, r.status,
        v.name AS vehicle_name, v.registration_number,
        u.email AS user_email, u.name AS user_name
      FROM maintenance_reminders r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status IN ('upcoming', 'overdue')
        AND r.due_date <= ?
        AND r.reminder_sent = 0
    `, [today]);

    let sentCount = 0;
    for (const item of pendingReminders) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Vehicle Maintenance Alert</h2>
          <p>Hello <strong>${item.user_name}</strong>,</p>
          <p>This is a reminder that maintenance is due for your vehicle:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${item.vehicle_name} (${item.registration_number})</p>
            <p style="margin: 5px 0;"><strong>Task:</strong> ${item.task_name}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${item.due_date.toISOString ? item.due_date.toISOString().split('T')[0] : item.due_date}</p>
            ${item.due_odometer ? `<p style="margin: 5px 0;"><strong>Due Odometer:</strong> ${item.due_odometer} km</p>` : ''}
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${item.status === 'overdue' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${item.status.toUpperCase()}</span></p>
          </div>
          <p>Please log into your Smart Vehicle Maintenance Platform to schedule or mark this task complete.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <small style="color: #64748b;">Smart Vehicle Maintenance Platform &bull; Automated Vehicle Care Notification</small>
        </div>
      `;

      const result = await sendEmail({
        to: item.user_email,
        subject: `[Maintenance Alert] ${item.task_name} for ${item.vehicle_name}`,
        html: emailHtml,
        text: `Maintenance Alert: ${item.task_name} is due for ${item.vehicle_name} (${item.registration_number}). Due date: ${item.due_date}`
      });

      if (result.sent) {
        sentCount++;
        await query('UPDATE maintenance_reminders SET reminder_sent = 1 WHERE id = ?', [item.id]);
      }
    }

    return {
      success: true,
      emailEnabled: true,
      sentCount,
      totalPending: pendingReminders.length
    };
  } catch (error) {
    console.error('Error running reminder checks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  isEmailConfigured,
  sendEmail,
  checkAndSendReminders,
  updateOverdueStatuses
};
