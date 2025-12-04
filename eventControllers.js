import db from "../..database/memory.js";
import { v4 as uuidv4 } from "uuid";


const parseDate = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const createEvent = (req, res) => {
  const organizerId = req.user.id;
  const {
    title,
    description = "",
    category = "General",
    date,
    venue = "",
    totalTickets = 100,
    price = 0
  } = req.body;

  if (!title || !date) return res.status(400).json({ message: "title and date required" });
  const eventDate = parseDate(date);
  if (!eventDate) return res.status(400).json({ message: "Invalid date" });

  const ev = {
    id: uuidv4(),
    title,
    description,
    category,
    date: eventDate.toISOString(),
    venue,
    totalTickets: Number(totalTickets) || 0,
    ticketsSold: 0,
    price: Number(price) || 0,
    organizerId,
    createdAt: new Date().toISOString()
  };
  db.events.push(ev);
  res.status(201).json({ message: "Event created", event: ev });
};


export const updateEvent = (req, res) => {
  const organizerId = req.user.id;
  const eventId = req.params.id;
  const ev = db.events.find(e => e.id === eventId);
  if (!ev) return res.status(404).json({ message: "Event not found" });
  if (ev.organizerId !== organizerId) return res.status(403).json({ message: "You don't own this event" });

  const { title, description, category, date, venue, totalTickets, price } = req.body;
  if (title) ev.title = title;
  if (description) ev.description = description;
  if (category) ev.category = category;
  if (date) {
    const d = parseDate(date);
    if (!d) return res.status(400).json({ message: "Invalid date" });
    ev.date = d.toISOString();
  }
  if (venue) ev.venue = venue;
  if (totalTickets !== undefined) {
    const n = Number(totalTickets);
    if (isNaN(n) || n < ev.ticketsSold) {
      return res.status(400).json({ message: "totalTickets must be >= ticketsSold" });
    }
    ev.totalTickets = n;
  }
  if (price !== undefined) ev.price = Number(price) || 0;

  res.json({ message: "Event updated", event: ev });
};


export const deleteEvent = (req, res) => {
  const organizerId = req.user.id;
  const eventId = req.params.id;
  const idx = db.events.findIndex(e => e.id === eventId);
  if (idx === -1) return res.status(404).json({ message: "Event not found" });
  const ev = db.events[idx];
  if (ev.organizerId !== organizerId) return res.status(403).json({ message: "You don't own this event" });

  db.bookings = db.bookings.filter(b => b.eventId !== eventId);
  db.events.splice(idx, 1);
  res.json({ message: "Event deleted" });
};


export const getEvent = (req, res) => {
  const ev = db.events.find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ message: "Not found" });
  res.json({ event: ev });
};


export const listEvents = (req, res) => {
  const { q, category, venue, dateFrom, dateTo, page = 1, limit = 10, sort } = req.query;
  let items = [...db.events];

  if (q) {
    const ql = q.toLowerCase();
    items = items.filter(e => (e.title + " " + e.description).toLowerCase().includes(ql));
  }

  if (category) {
    items = items.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
  }

  if (venue) {
    items = items.filter(e => e.venue && e.venue.toLowerCase().includes(venue.toLowerCase()));
  }

  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (from) items = items.filter(e => new Date(e.date) >= from);
  if (to) items = items.filter(e => new Date(e.date) <= to);

  if (sort === "date_asc") items.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sort === "date_desc") items.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sort === "newest") items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else items.sort((a, b) => new Date(a.date) - new Date(b.date));

  const p = Math.max(Number(page) || 1, 1);
  const lim = Math.max(Math.min(Number(limit) || 10, 100), 1);
  const start = (p - 1) * lim;
  const paged = items.slice(start, start + lim);

  res.json({
    meta: {
      total: items.length,
      page: p,
      limit: lim,
      pages: Math.ceil(items.length / lim)
    },
    events: paged
  });
};


export const bookTickets = (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  const { quantity } = req.body;
  const qty = Number(quantity) || 0;
  if (qty <= 0) return res.status(400).json({ message: "quantity must be > 0" });

  const ev = db.events.find(e => e.id === eventId);
  if (!ev) return res.status(404).json({ message: "Event not found" });

  const available = ev.totalTickets - ev.ticketsSold;
  if (qty > available) return res.status(400).json({ message: `Only ${available} tickets available` });

  const totalPrice = qty * (ev.price || 0);
  const booking = {
    id: uuidv4(),
    eventId,
    userId,
    quantity: qty,
    totalPrice,
    bookedAt: new Date().toISOString()
  };

  db.bookings.push(booking);
  ev.ticketsSold += qty;

  res.status(201).json({ message: "Booking successful", booking });
};

export const getBookingsForUser = (req, res) => {
  const userId = req.user.id;
  const myBookings = db.bookings.filter(b => b.userId === userId).map(b => {
    const ev = db.events.find(e => e.id === b.eventId);
    return { ...b, event: ev ? { id: ev.id, title: ev.title, date: ev.date, venue: ev.venue } : null };
  });
  res.json({ bookings: myBookings });
};

export const getBookingsForEvent = (req, res) => {
  const organizerId = req.user.id;
  const eventId = req.params.id;
  const ev = db.events.find(e => e.id === eventId);
  if (!ev) return res.status(404).json({ message: "Event not found" });
  if (ev.organizerId !== organizerId) return res.status(403).json({ message: "You don't own this event" });

  const eventBookings = db.bookings.filter(b => b.eventId === eventId).map(b => {
    const user = db.users.find(u => u.id === b.userId);
    return { ...b, user: user ? { id: user.id, name: user.name, email: user.email } : null };
  });
  res.json({ bookings: eventBookings });
};