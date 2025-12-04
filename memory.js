
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

const users = [];      
const events = [];  
const bookings = [];   

const seed = async () => {
  
  if (users.length === 0) {
    const saltRounds = 10;
    const orgPass = await bcrypt.hash("organizer123", saltRounds);
    const attPass = await bcrypt.hash("attendee123", saltRounds);

    users.push({
      id: uuidv4(),
      name: "Default Organizer",
      email: "organizer@example.com",
      passwordHash: orgPass,
      role: "Organizer"
    });

    users.push({
      id: uuidv4(),
      name: "Default Attendee",
      email: "attendee@example.com",
      passwordHash: attPass,
      role: "Attendee"
    });
  }
};

export default {
  users,
  events,
  bookings,
  seed
};