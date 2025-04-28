document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const eventPopup = document.getElementById('eventPopup');
    const popupDateHeader = document.getElementById('popupDate');
    const authorInput = document.getElementById('author');
    const contentTextarea = document.getElementById('content');
    const saveEventButton = document.getElementById('saveEvent');
    const closePopup = document.getElementById('closePopup');
    const eventListDiv = document.getElementById('eventList');

    let currentYear;
    let currentMonth; // 0-indexed (0 for January, 11 for December)
    let events = {}; // 서버에서 데이터를 불러올 예정

    // Populate year and month select dropdowns
    const currentFullYear = new Date().getFullYear();
    for (let i = currentFullYear - 5; i <= currentFullYear + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    monthNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        monthSelect.appendChild(option);
    });

    // Initialize with current date
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();

    yearSelect.value = currentYear;
    monthSelect.value = currentMonth;

    renderCalendar(currentYear, currentMonth);

    // Event Listeners
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        yearSelect.value = currentYear;
        monthSelect.value = currentMonth;
        renderCalendar(currentYear, currentMonth);
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        yearSelect.value = currentYear;
        monthSelect.value = currentMonth;
        renderCalendar(currentYear, currentMonth);
    });

    yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
    });

    monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
    });

    calendarGrid.addEventListener('click', (e) => {
        const dayElement = e.target.closest('.calendar-day');
        if (dayElement && !dayElement.classList.contains('empty')) {
            const date = dayElement.dataset.date;
            openEventPopup(date);
        }
    });

    saveEventButton.addEventListener('click', () => {
        saveEvent();
    });

    closePopup.addEventListener('click', () => {
        closeEventPopup();
    });

    // Close popup when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === eventPopup) {
            closeEventPopup();
        }
    });


    // Functions

    async function renderCalendar(year, month) {
        calendarGrid.innerHTML = ''; // Clear previous calendar

        // Add day of week headers
        const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-of-week');
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 6 for Saturday

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayElement.dataset.date = dateString;

            const dayOfWeek = new Date(year, month, day).getDay(); // 0 for Sunday, 6 for Saturday
            if (dayOfWeek === 0) {
                dayElement.classList.add('sunday');
            } else if (dayOfWeek === 6) {
                dayElement.classList.add('saturday');
            }

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const eventListForDay = document.createElement('div');
            eventListForDay.classList.add('event-list');
            dayElement.appendChild(eventListForDay);

            calendarGrid.appendChild(dayElement);
        }

        currentMonthYearHeader.textContent = `${year}년 ${month + 1}월`;
        await fetchEventsFromServer(year, month); // Fetch events after rendering the calendar structure
    }

    async function fetchEventsFromServer(year, month) {
        console.log(`Fetching events for ${year}-${month + 1} from server...`);
        try {
            // Fetch all events from the server
            // Note: The backend currently returns all events, not filtered by month/year.
            // If needed, update backend /api/events GET to accept year/month params.
            // TODO: If client is served from a different domain/port than backend API, update fetch URL
            const response = await fetch('/api/events'); // Use the backend API endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            events = data; // Assuming the server returns data in the format { "YYYY-MM-DD": [{id, author, content}, ...] }

            displayEvents(); // Display fetched events
        } catch (error) {
            console.error("Failed to fetch events:", error);
            // Handle error (e.g., show error message to user)
            alert('일정 불러오기에 실패했습니다.');
        }
    }


    function displayEvents() {
        // Clear previous event displays
        document.querySelectorAll('.calendar-day .event-list').forEach(el => el.innerHTML = '');

        for (const date in events) {
            const dayElement = calendarGrid.querySelector(`.calendar-day[data-date="${date}"]`);
            if (dayElement) {
                const eventListForDay = dayElement.querySelector('.event-list');
                // Limit to 6 events for display in the calendar cell
                events[date].slice(0, 6).forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.innerHTML = `
                        <p>${event.author} ${event.content}</p>
                    `; // 작성자와 내용을 함께 표시
                    eventListForDay.appendChild(eventDiv);
                });
                 // Add indicator if there are more than 6 events
                if (events[date].length > 6) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.textContent = `... 외 ${events[date].length - 6}개`;
                    moreIndicator.style.fontSize = '0.7em';
                    moreIndicator.style.color = '#8e8e8e';
                    eventListForDay.appendChild(moreIndicator);
                }
            }
        }
    }

    function openEventPopup(date) {
        popupDateHeader.textContent = date;
        authorInput.value = '';
        contentTextarea.value = '';
        eventListDiv.innerHTML = ''; // Clear previous event list in popup

        const eventsForDate = events[date] || [];
        eventsForDate.forEach((event, index) => {
            const eventDiv = document.createElement('div');
            eventDiv.innerHTML = `
                <div class="event-details">
                    <strong>${event.author}</strong>
                    <p>${event.content}</p>
                </div>
                <button class="delete-event" data-event-id="${event.id}">삭제</button>
            `; // data-event-id 속성에 이벤트 ID 추가
            eventListDiv.appendChild(eventDiv);
        });

        // Add event listeners for delete buttons
        eventListDiv.querySelectorAll('.delete-event').forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventIdToDelete = e.target.dataset.eventId; // 이벤트 ID 가져오기
                await deleteEvent(eventIdToDelete); // 이벤트 ID를 deleteEvent 함수에 전달
            });
        });

        eventPopup.style.display = 'flex'; // Show the popup
        saveEventButton.dataset.date = date; // Store date for saving
    }

    function closeEventPopup() {
        eventPopup.style.display = 'none'; // Hide the popup
    }

    async function saveEvent() {
        const date = saveEventButton.dataset.date;
        const author = authorInput.value.trim();
        const content = contentTextarea.value.trim();

        if (author && content) {
            const newEvent = { author, content };
            console.log("Saving event to server:", { date, event: newEvent });
            try {
                // TODO: If client is served from a different domain/port than backend API, update fetch URL
                const response = await fetch('/api/events', { // Use the backend API endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ date, event: newEvent }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Assuming successful save, re-fetch and render calendar
                closeEventPopup();
                renderCalendar(currentYear, currentMonth);
            } catch (error) {
                console.error("Failed to save event:", error);
                alert('일정 저장에 실패했습니다.');
                // Handle error
            }
        } else {
            alert('작성자와 내용을 모두 입력해주세요.');
        }
    }

    async function deleteEvent(eventId) {
        console.log("Deleting event with ID:", eventId);
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Assuming successful deletion on server, update client-side events
            // Find the event in the events object and remove it
            let dateOfDeletedEvent = null;
            for (const date in events) {
                const initialLength = events[date].length;
                events[date] = events[date].filter(event => event.id !== eventId);
                if (events[date].length < initialLength) {
                    dateOfDeletedEvent = date;
                    if (events[date].length === 0) {
                        delete events[date]; // Remove date key if no events left
                    }
                    break; // Event found and removed, no need to continue searching
                }
            }

            if (dateOfDeletedEvent) {
                 // Re-open popup for the date where the event was deleted, or close if no events left
                if (events[dateOfDeletedEvent] && events[dateOfDeletedEvent].length > 0) {
                     openEventPopup(dateOfDeletedEvent);
                } else {
                    closeEventPopup();
                }
                renderCalendar(currentYear, currentMonth); // Re-render calendar
            } else {
                console.warn("Deleted event not found in client-side events object.");
                 closeEventPopup(); // Close popup if event not found client-side
                 renderCalendar(currentYear, currentMonth); // Re-render calendar
            }


        } catch (error) {
            console.error("Failed to delete event:", error);
            alert('일정 삭제에 실패했습니다.');
            // Handle error
        }
    }
});
