import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPreviousMonth - i, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, isCurrentMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      day: cells.length - daysInMonth - firstWeekday + 1,
      isCurrentMonth: false,
    });
  }

  const weeks = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export default function EventsCalendar({ events = [] }) {
  const today = new Date();

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDay, setSelectedDay] = useState(null);
  const navigate = useNavigate();

  const weeks = buildMonthGrid(
    viewDate.getFullYear(),
    viewDate.getMonth()
  );

  const eventsByDay = events.reduce((byDay, event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);

    if (
      eventDate.getFullYear() === viewDate.getFullYear() &&
      eventDate.getMonth() === viewDate.getMonth()
    ) {
      const day = eventDate.getDate();

      if (!byDay[day]) {
        byDay[day] = [];
      }

      byDay[day].push(event);
    }

    return byDay;
  }, {});

  const isToday = (day, isCurrentMonth) =>
    isCurrentMonth &&
    day === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const goToPreviousMonth = () =>
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );

  const goToNextMonth = () =>
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );

  return (
    <section className="events-calendar">
      <div className="calendar-nav">
        <button
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          &lsaquo;
        </button>

        <h2>
          {monthNames[viewDate.getMonth()]}{" "}
          {viewDate.getFullYear()}
        </h2>

        <button
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          &rsaquo;
        </button>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            {dayNames.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((cell, cellIndex) => {
                const dayEvents = cell.isCurrentMonth
                  ? eventsByDay[cell.day] || []
                  : [];

                const dayKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}-${cell.day}`;
                const hasEvents = dayEvents.length > 0;

                const handleDayClick = () => {
                  if (dayEvents.length === 1) {
                    navigate(`/events/${dayEvents[0].id}`);
                  } else if (dayEvents.length > 1) {
                    setSelectedDay((current) =>
                      current === dayKey ? null : dayKey
                    );
                  }
                };

                return (
                  <td
                    key={cellIndex}
                    className={[
                      !cell.isCurrentMonth
                        ? "calendar-day-muted"
                        : "",
                      isToday(
                        cell.day,
                        cell.isCurrentMonth
                      )
                        ? "calendar-day-today"
                        : "",
                      hasEvents
                        ? "calendar-day-has-events"
                        : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {isToday(
                      cell.day,
                      cell.isCurrentMonth
                    ) && (
                      <span className="calendar-today-label">
                        Today
                      </span>
                    )}

                    <button
                      type="button"
                      className="calendar-day-button"
                      onClick={handleDayClick}
                      disabled={!hasEvents}
                      aria-label={
                        hasEvents
                          ? `View event${
                              dayEvents.length > 1 ? "s" : ""
                            } on day ${cell.day}`
                          : undefined
                      }
                    >
                      {cell.day}

                      {hasEvents && (
                        <span
                          className={`calendar-event-dot ${
                            dayEvents.length > 1
                              ? "calendar-event-dot-multiple"
                              : ""
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {selectedDay === dayKey &&
                      dayEvents.length > 1 && (
                        <div className="calendar-event-list">
                          {dayEvents.map((event) => (
                            <Link
                              key={event.id}
                              to={`/events/${event.id}`}
                              className="calendar-event-link"
                            >
                              <strong>{event.name}</strong>
                              <span>{event.type}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}