import { Reservation, ReservationSettings, TimeSlot } from '@/types';

/**
 * Generate time slots between opening and closing time
 */
export function generateTimeSlots(
    openingTime: string,
    closingTime: string,
    durationMinutes: number
): string[] {
    const slots: string[] = [];

    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    while (currentMinutes < closeMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        currentMinutes += durationMinutes;
    }

    return slots;
}

/**
 * Check if a date is within the booking window
 */
export function isWithinBookingWindow(
    date: Date,
    advanceDays: number
): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + advanceDays);

    return targetDate >= today && targetDate <= maxDate;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time for display (e.g., "19:00" -> "7:00 PM")
 */
export function formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format reservation date and time for display
 */
export function formatReservationDateTime(date: string, time: string): string {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    const formattedTime = formatTimeDisplay(time);
    return `${formattedDate} at ${formattedTime}`;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        confirmed: 'bg-green-100 text-green-800 border-green-200',
        seated: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-gray-100 text-gray-800 border-gray-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        'no-show': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: string): string {
    const names: Record<string, string> = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        seated: 'Seated',
        completed: 'Completed',
        cancelled: 'Cancelled',
        'no-show': 'No Show',
    };
    return names[status] || status;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Generate a random confirmation code
 */
export function generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}
