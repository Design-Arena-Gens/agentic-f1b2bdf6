'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Doctor {
  id: string
  name: string
  specialty: string
  availability: string[]
  rating: number
}

interface Appointment {
  id: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
}

const MOCK_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'General Physician', availability: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'], rating: 4.8 },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiologist', availability: ['10:00 AM', '1:00 PM', '3:00 PM'], rating: 4.9 },
  { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Dermatologist', availability: ['9:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'], rating: 4.7 },
  { id: '4', name: 'Dr. James Wilson', specialty: 'Pediatrician', availability: ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'], rating: 4.9 },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI doctor booking assistant. I can help you find available doctors, schedule appointments, or check your existing bookings. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          appointments
        })
      })

      const data = await response.json()

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])

      if (data.action === 'book_appointment' && data.appointmentData) {
        const newAppointment: Appointment = {
          id: Date.now().toString(),
          ...data.appointmentData,
          status: 'Confirmed'
        }
        setAppointments(prev => [...prev, newAppointment])
        setMessages(prev => [...prev, {
          role: 'system',
          content: `✓ Appointment booked successfully with ${data.appointmentData.doctorName} on ${data.appointmentData.date} at ${data.appointmentData.time}!`
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🏥 AI Doctor Booking Agent</h1>
        <p>Smart appointment scheduling powered by AI</p>
      </div>

      <div className="main-content">
        <div className="card">
          <h2 className="section-title">Available Doctors</h2>
          <div className="doctor-grid">
            {MOCK_DOCTORS.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-name">{doctor.name}</div>
                <div className="doctor-specialty">{doctor.specialty}</div>
                <div className="doctor-info">
                  ⭐ {doctor.rating} | Available slots: {doctor.availability.length}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Your Appointments</h2>
          {appointments.length === 0 ? (
            <div className="empty-state">No appointments scheduled yet</div>
          ) : (
            <div className="appointment-list">
              {appointments.map(apt => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-date">
                    📅 {apt.date} at {apt.time}
                  </div>
                  <div className="appointment-details">
                    <strong>{apt.doctorName}</strong> - {apt.specialty}
                    <br />
                    Status: <span style={{ color: '#28a745' }}>{apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card chat-section">
        <h2 className="section-title">Chat with AI Assistant</h2>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              Thinking<span className="loading"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask me to book an appointment, check availability, or reschedule..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button className="btn" onClick={handleSend} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
