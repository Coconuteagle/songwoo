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
        // TODO: Replace with actual API call to fetch events for the given year and month
        console.log(`Fetching events for ${year}-${month + 1} from server...`);
        try {
            // Example fetch (replace with your actual endpoint and method)
            // const response = await fetch(`/api/events?year=${year}&month=${month + 1}`);
            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }
            // const data = await response.json();
            // events = data; // Assuming the server returns data in the expected format

            // Placeholder data for demonstration
            events = {
                "2025-04-28": [
                    { author: "홍길동", content: "회의 참석" },
                    { author: "김철수", content: "보고서 제출" }
                ],
                "2025-05-01": [
                    { author: "이영희", content: "프로젝트 마감" }
                ]
            };

            displayEvents(); // Display fetched events
        } catch (error) {
            console.error("Failed to fetch events:", error);
            // Handle error (e.g., show error message to user)
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
                        <p>${event.content}</p>
                    `; // 담당자 정보는 팝업에서만 표시
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
                <button class="delete-event" data-date="${date}" data-index="${index}">삭제</button>
            `;
            eventListDiv.appendChild(eventDiv);
        });

        // Add event listeners for delete buttons
        eventListDiv.querySelectorAll('.delete-event').forEach(button => {
            button.addEventListener('click', async (e) => {
                const dateToDelete = e.target.dataset.date;
                const indexToDelete = parseInt(e.target.dataset.index);
                await deleteEvent(dateToDelete, indexToDelete);
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
            // TODO: Replace with actual API call to save the new event
            console.log("Saving event to server:", { date, event: newEvent });
            try {
                // Example fetch (replace with your actual endpoint and method)
                // const response = await fetch('/api/events', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ date, event: newEvent }),
                // });
                // if (!response.ok) {
                //     throw new Error(`HTTP error! status: ${response.status}`);
                // }
                // const savedEvent = await response.json(); // Assuming server returns the saved event

                // For placeholder, manually add to events object
                 if (!events[date]) {
                     events[date] = [];
                 }
                 events[date].push(newEvent);


                closeEventPopup();
                renderCalendar(currentYear, currentMonth); // Re-render calendar to show new event
            } catch (error) {
                console.error("Failed to save event:", error);
                alert('일정 저장에 실패했습니다.');
                // Handle error
            }
        } else {
            alert('작성자와 내용을 모두 입력해주세요.');
        }
    }

    async function deleteEvent(date, index) {
        if (events[date] && events[date][index]) {
            const eventToDelete = events[date][index];
            // TODO: Replace with actual API call to delete the event
            console.log("Deleting event from server:", { date, index, event: eventToDelete });
             try {
                // Example fetch (replace with your actual endpoint and method)
                // const response = await fetch(`/api/events?date=${date}&index=${index}`, {
                //     method: 'DELETE',
                // });
                // if (!response.ok) {
                //     throw new Error(`HTTP error! status: ${response.status}`);
                // }

                // For placeholder, manually remove from events object
                events[date].splice(index, 1);
                if (events[date].length === 0) {
                    delete events[date]; // Remove date key if no events left
                }

                openEventPopup(date); // Refresh popup content
                renderCalendar(currentYear, currentMonth); // Re-render calendar to remove event
            } catch (error) {
                console.error("Failed to delete event:", error);
                alert('일정 삭제에 실패했습니다.');
                // Handle error
            }
        }
    }
});