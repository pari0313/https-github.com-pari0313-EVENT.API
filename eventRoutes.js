import express from "express";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  listEvents,
  bookTickets,
  getBookingsForUser,
  getBookingsForEvent
} from "../controllers/eventController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/role.js";

const router = express.Router();

router.get("/", listEvents);     
router.get("/:id", getEvent);

router.post("/", authenticate, authorize("Organizer"), createEvent);
router.put("/:id", authenticate, authorize("Organizer"), updateEvent);
router.delete("/:id", authenticate, authorize("Organizer"), deleteEvent);

router.post("/:id/book", authenticate, authorize("Attendee"), bookTickets);

router.get("/bookings/me", authenticate, getBookingsForUser);
router.get("/:id/bookings", authenticate, authorize("Organizer"), getBookingsForEvent);

export default router;