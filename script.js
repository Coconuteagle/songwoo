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
    let events = {}; // Will be populated from the server

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
        await fetchEventsFromServer(); // Fetch events after rendering the calendar structure
    }

    async function fetchEventsFromServer() {
        // Consider filtering by year/month on the backend in the future for performance
        console.log(`Workspaceing all events from server...`);
        try {
            const response = await fetch('/api/events'); // Use the backend API endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            events = data; // Assuming the server returns data in the format { "YYYY-MM-DD": [{id, author, content}, ...] }

            displayEvents(); // Display fetched events
        } catch (error) {
            console.error("Failed to fetch events:", error);
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
                    // Display only content, make it smaller
                    eventDiv.innerHTML = `<p class="calendar-event-item">${event.content}</p>`;
                    eventListForDay.appendChild(eventDiv);
                });
                 // Add indicator if there are more than 6 events
                if (events[date].length > 6) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.textContent = `... 외 ${events[date].length - 6}개`;
                    moreIndicator.style.fontSize = '0.7em';
                    moreIndicator.style.color = '#8e8e8e';
                    moreIndicator.style.marginTop = '2px';
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
        if (eventsForDate.length === 0) {
            eventListDiv.innerHTML = '<p>이 날짜에 등록된 일정이 없습니다.</p>';
        } else {
            eventsForDate.forEach(event => { // No index needed here anymore
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event-popup-item'); // Add a class for styling
                eventDiv.innerHTML = `
                    <div class="event-details">
                        <strong>${event.author}:</strong>
                        <p>${event.content}</p>
                    </div>
                    <button class="delete-event" data-event-id="${event.id}">삭제</button>
                `; // data-event-id attribute has the event ID
                eventListDiv.appendChild(eventDiv);
            });
        }

        // Add event listeners for delete buttons (use event delegation for efficiency)
        eventListDiv.querySelectorAll('.delete-event').forEach(button => {
             button.addEventListener('click', async (e) => {
                 if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
                     const eventIdToDelete = e.target.dataset.eventId; // Get event ID
                     await deleteEvent(eventIdToDelete); // Call deleteEvent with the ID
                 }
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
                const response = await fetch('/api/events', { // Use the backend API endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ date, event: newEvent }),
                });
                if (!response.ok) {
                     const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' })); // Try to parse error
                     throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                }
                // Assuming successful save, re-fetch and render calendar
                closeEventPopup();
                await renderCalendar(currentYear, currentMonth); // Use await here
            } catch (error) {
                console.error("Failed to save event:", error);
                alert(`일정 저장에 실패했습니다: ${error.message}`);
            }
        } else {
            alert('작성자와 내용을 모두 입력해주세요.');
        }
    }

    // *** CORRECTED deleteEvent function ***
    async function deleteEvent(eventId) { // Accepts eventId now
        console.log("Deleting event from server:", { eventId });
        try {
            // Make the actual API call to the backend DELETE endpoint
            const response = await fetch(`/api/events/${eventId}`, { // Use the correct endpoint with eventId
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' })); // Try to parse error
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

             console.log("Event deleted successfully from server");

             // Re-fetch events and update UI
             const currentDate = popupDateHeader.textContent; // Get date from popup header
             await fetchEventsFromServer(); // Fetch updated list from server
             renderCalendar(currentYear, currentMonth); // Re-render calendar
             openEventPopup(currentDate); // Refresh popup content with updated data

        } catch (error) {
            console.error("Failed to delete event:", error);
            alert(`일정 삭제에 실패했습니다: ${error.message}`);
            // Handle error (e.g., maybe just close popup or show error in popup)
        }
    }
});
