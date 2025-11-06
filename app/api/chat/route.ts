import { NextResponse } from 'next/server'

interface Doctor {
  id: string
  name: string
  specialty: string
  availability: string[]
  rating: number
}

const MOCK_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'General Physician', availability: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'], rating: 4.8 },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiologist', availability: ['10:00 AM', '1:00 PM', '3:00 PM'], rating: 4.9 },
  { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Dermatologist', availability: ['9:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'], rating: 4.7 },
  { id: '4', name: 'Dr. James Wilson', specialty: 'Pediatrician', availability: ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'], rating: 4.9 },
]

function analyzeIntent(message: string): { intent: string; details: any } {
  const lower = message.toLowerCase()

  // Book appointment intent
  if (lower.includes('book') || lower.includes('schedule') || lower.includes('appointment')) {
    const doctorMatch = MOCK_DOCTORS.find(d =>
      lower.includes(d.name.toLowerCase()) ||
      lower.includes(d.specialty.toLowerCase())
    )

    const timeMatch = lower.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/i) ||
                     lower.match(/(\d{1,2}\s*(?:am|pm))/i)

    const dateMatch = lower.match(/(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)

    return {
      intent: 'book',
      details: {
        doctor: doctorMatch,
        time: timeMatch ? timeMatch[0] : null,
        date: dateMatch ? dateMatch[0] : null
      }
    }
  }

  // Check availability intent
  if (lower.includes('available') || lower.includes('availability') || lower.includes('free')) {
    const specialtyMatch = MOCK_DOCTORS.find(d =>
      lower.includes(d.specialty.toLowerCase())
    )
    return { intent: 'check_availability', details: { specialty: specialtyMatch?.specialty } }
  }

  // List doctors intent
  if (lower.includes('list') || lower.includes('show me') || lower.includes('who are')) {
    return { intent: 'list_doctors', details: {} }
  }

  // View appointments intent
  if (lower.includes('my appointment') || lower.includes('my booking')) {
    return { intent: 'view_appointments', details: {} }
  }

  return { intent: 'general', details: {} }
}

function generateResponse(intent: string, details: any, appointments: any[]): any {
  switch (intent) {
    case 'book':
      if (details.doctor && details.time) {
        const date = details.date || 'Tomorrow'
        return {
          reply: `Perfect! I'm booking an appointment with ${details.doctor.name} (${details.doctor.specialty}) for ${date} at ${details.time}. You'll receive a confirmation shortly.`,
          action: 'book_appointment',
          appointmentData: {
            doctorName: details.doctor.name,
            specialty: details.doctor.specialty,
            date: date.charAt(0).toUpperCase() + date.slice(1),
            time: details.time
          }
        }
      } else if (details.doctor) {
        return {
          reply: `I can help you book with ${details.doctor.name}. They have availability at: ${details.doctor.availability.join(', ')}. Which time works best for you?`
        }
      } else {
        return {
          reply: `I can help you book an appointment. Here are our available doctors:\n\n${MOCK_DOCTORS.map(d => `• ${d.name} - ${d.specialty} (Rating: ${d.rating})`).join('\n')}\n\nWhich doctor would you like to see?`
        }
      }

    case 'check_availability':
      const filteredDoctors = details.specialty
        ? MOCK_DOCTORS.filter(d => d.specialty === details.specialty)
        : MOCK_DOCTORS

      return {
        reply: `Here's the availability for ${details.specialty || 'all doctors'}:\n\n${filteredDoctors.map(d =>
          `${d.name}: ${d.availability.join(', ')}`
        ).join('\n\n')}\n\nWould you like to book an appointment?`
      }

    case 'list_doctors':
      return {
        reply: `We have ${MOCK_DOCTORS.length} excellent doctors available:\n\n${MOCK_DOCTORS.map(d =>
          `• ${d.name} - ${d.specialty}\n  Rating: ${d.rating}/5 | ${d.availability.length} slots available`
        ).join('\n\n')}\n\nWho would you like to book with?`
      }

    case 'view_appointments':
      if (appointments.length === 0) {
        return {
          reply: "You don't have any appointments scheduled yet. Would you like to book one?"
        }
      }
      return {
        reply: `You have ${appointments.length} appointment(s):\n\n${appointments.map(a =>
          `• ${a.date} at ${a.time}\n  ${a.doctorName} - ${a.specialty}\n  Status: ${a.status}`
        ).join('\n\n')}`
      }

    default:
      return {
        reply: "I can help you with:\n• Booking doctor appointments\n• Checking doctor availability\n• Viewing your scheduled appointments\n• Finding specialists\n\nWhat would you like to do?"
      }
  }
}

export async function POST(req: Request) {
  try {
    const { message, appointments } = await req.json()

    const { intent, details } = analyzeIntent(message)
    const response = generateResponse(intent, details, appointments || [])

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: 'I apologize, but I encountered an error. Please try again.' },
      { status: 500 }
    )
  }
}
