export function getWhatsAppLink(phoneNumber, message) {
  if (!phoneNumber) return '';
  
  // Strip spaces, plus signs, dashes, brackets, and non-numeric characters
  const cleanNumber = phoneNumber.toString().replace(/\D/g, '');
  
  // If no message, just return the chat link
  if (!message) {
    return `https://wa.me/${cleanNumber}`;
  }

  // Encode the message
  const encodedMessage = encodeURIComponent(message.trim());
  
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
