document.addEventListener('DOMContentLoaded', () => {
    const courseSearchInput = document.getElementById('courseSearch');
    const courseListDiv = document.getElementById('courseList');
    const sectionSelectionDiv = document.getElementById('sectionList');
    const sectionSelectionContainer = document.querySelector('.section-selection');
    const generateTimetableBtn = document.getElementById('generateTimetableBtn');
    const generateSectionContainer = document.querySelector('.generate-section');
    const timetableDisplayContainer = document.querySelector('.timetable-display');
    const timetableGridDiv = document.getElementById('timetableGrid');
    const timetableDetailsDiv = document.getElementById('timetableDetails');
    const timetableNavigationDiv = document.querySelector('.timetable-navigation');
    const prevTimetableBtn = document.getElementById('prevTimetableBtn');
    const nextTimetableBtn = document.getElementById('nextTimetableBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const newCourseCodeInput = document.getElementById('newCourseCode');
    const newCourseTitleInput = document.getElementById('newCourseTitle');
    const totalCreditsDisplay = document.getElementById('totalCreditsDisplay');
    const examClashContainer = document.getElementById('examClashContainer');
    const examClashList = document.getElementById('examClashList');
    const timetableNumberDisplay = document.createElement('span');
    timetableNavigationDiv.appendChild(timetableNumberDisplay);
    const darkModeToggle = document.getElementById('darkModeToggle');
    const downloadTimetableBtn = document.getElementById('downloadTimetableBtn'); // Download button

    let allCourses = {};
    let selectedCourses = {};
    let filteredCourseKeys = [];
    let currentTimetableSolution = null;
    let solutions = [];

    // Helper function to expand slots (same as before)
    function expandSlot(slotStr) {
        if (slotStr.startsWith("Th")) {
            const day = "Th";
            const remainder = slotStr.substring(2);
            if (remainder.length > 1) return remainder.split('').map(d => day + d);
            return [day + remainder];
        } else {
            const day = slotStr[0];
            const remainder = slotStr.substring(1);
            if (remainder.length > 1) return remainder.split('').map(d => day + d);
            return [slotStr];
        }
    }

    // Helper function to expand multiple slots (same as before)
    function expandSlots(slotList) {
        let result = [];
        slotList.forEach(slot => {
            result = result.concat(expandSlot(slot));
        });
        return result;
    }

    // Load courses from JSON file (same as before)
    async function loadCourses() {
        try {
            const response = await fetch('courses.json');
            allCourses = await response.json();
            filteredCourseKeys = Object.keys(allCourses);
            for (const courseKey in allCourses) {
                if (allCourses[courseKey].lecture_sections) {
                    allCourses[courseKey].lecture_sections.forEach(sec => {
                        sec.slots = expandSlots(sec.slots);
                        sec.slotsSet = new Set(sec.slots);
                    });
                } else {
                    allCourses[courseKey].lecture_sections = [];
                }
                if (allCourses[courseKey].practical_sections) {
                    allCourses[courseKey].practical_sections.forEach(sec => {
                        sec.slots = expandSlots(sec.slots);
                        sec.slotsSet = new Set(sec.slots);
                    });
                } else {
                    allCourses[courseKey].practical_sections = [];
                }
            }
            displayCourses();
        } catch (error) {
            console.error('Error loading courses:', error);
            courseListDiv.innerHTML = '<p class="error-message">Error loading course data.</p>';
        }
    }

    // Display courses in the course list (same as before)
    function displayCourses() {
        courseListDiv.innerHTML = '';
        filteredCourseKeys.forEach(courseKey => {
            const course = allCourses[courseKey];
            const courseDiv = document.createElement('div');
            courseDiv.classList.add('course-item');
            const isSelected = selectedCourses[courseKey];
            courseDiv.innerHTML = `
                <span>${courseKey}: ${course.course_title} (${course.credit} Credits)</span>
                <div>
                    <button class="${isSelected ? 'selected-button' : ''}" onclick="toggleCourseSelection('${courseKey}', this)">${isSelected ? 'Delete' : 'Select'}</button>
                </div>
            `;
            courseListDiv.appendChild(courseDiv);
        });
    }

    // Handle course selection (same as before)
    window.toggleCourseSelection = function(courseKey, buttonElement) {
        if (selectedCourses[courseKey]) {
            delete selectedCourses[courseKey];
            buttonElement.textContent = 'Select';
            buttonElement.classList.remove('selected-button');
        } else {
            selectedCourses[courseKey] = { lecture: [], practical: [] };
            buttonElement.textContent = 'Delete';
            buttonElement.classList.add('selected-button');
        }
        displayCourseSections();
        updateButtonVisibility();
        updateCreditDisplay();
        updateExamClashDisplay();
    };

    // Display section selection for selected courses (same as before)
    function displayCourseSections() {
        sectionSelectionDiv.innerHTML = '';
        if (Object.keys(selectedCourses).length === 0) {
            sectionSelectionContainer.style.display = 'none';
            generateSectionContainer.style.display = 'none';
            return;
        }
        sectionSelectionContainer.style.display = 'block';

        for (const courseKey in selectedCourses) {
            const course = allCourses[courseKey];
            const courseSectionRowDiv = document.createElement('div');
            courseSectionRowDiv.classList.add('section-course-row');
            courseSectionRowDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>${courseKey}: ${course.course_title}</h3>
                </div>
                `;

            const sectionTypesDiv = document.createElement('div');
            sectionTypesDiv.classList.add('section-types');

            // Lecture Sections (same as before)
            if (course.lecture_sections && course.lecture_sections.length > 0) {
                const lectureSectionDiv = document.createElement('div');
                lectureSectionDiv.classList.add('section-type');
                lectureSectionDiv.innerHTML = `<p>Lecture Sections:</p>`;
                const lectureButtonsDiv = document.createElement('div');
                lectureButtonsDiv.classList.add('section-buttons');
                course.lecture_sections.forEach(section => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = section.section;
                    checkbox.onchange = (event) => selectSection(courseKey, 'lecture', section.section, event.target);
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(`${section.section} (${section.instructor}) - ${section.slots.join(', ')}`));
                    lectureButtonsDiv.appendChild(label);
                });
                lectureSectionDiv.appendChild(lectureButtonsDiv);
                sectionTypesDiv.appendChild(lectureSectionDiv);
            } else {
                const lectureSectionDiv = document.createElement('div');
                lectureSectionDiv.classList.add('section-type');
                lectureSectionDiv.innerHTML = `<p>Lecture Sections: No sections available</p>`;
                sectionTypesDiv.appendChild(lectureSectionDiv);
            }


            // Practical Sections (same as before)
            if (course.practical_sections && course.practical_sections.length > 0) {
                const practicalSectionDiv = document.createElement('div');
                practicalSectionDiv.classList.add('section-type');
                practicalSectionDiv.innerHTML = `<p>Practical Sections:</p>`;
                const practicalButtonsDiv = document.createElement('div');
                practicalButtonsDiv.classList.add('section-buttons');
                course.practical_sections.forEach(section => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = section.section;
                    checkbox.onchange = (event) => selectSection(courseKey, 'practical', section.section, event.target);
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(`${section.section} (${section.instructor}) - ${section.slots.join(', ')}`));
                    practicalButtonsDiv.appendChild(label);
                });
                practicalSectionDiv.appendChild(practicalButtonsDiv);
                sectionTypesDiv.appendChild(practicalSectionDiv);
            } else {
                const practicalSectionDiv = document.createElement('div');
                practicalSectionDiv.classList.add('section-type');
                practicalSectionDiv.innerHTML = `<p>Practical Sections: No sections available</p>`;
                sectionTypesDiv.appendChild(practicalSectionDiv);
            }
            courseSectionRowDiv.appendChild(sectionTypesDiv);
            sectionSelectionDiv.appendChild(courseSectionRowDiv);
        }
    }

    // Handle section selection (same as before)
    window.selectSection = function(courseKey, type, sectionId, checkboxElement) {
        if (selectedCourses[courseKey]) {
            const sectionArray = selectedCourses[courseKey][type];
            if (checkboxElement.checked) {
                if (!sectionArray.includes(sectionId)) {
                    sectionArray.push(sectionId);
                }
            } else {
                const index = sectionArray.indexOf(sectionId);
                if (index > -1) {
                    sectionArray.splice(index, 1);
                }
            }
        }
        updateButtonVisibility();
    };

    // Update visibility of Generate Timetable button (same as before)
    function updateButtonVisibility() {
        let allSectionsSelected = true;
        for (const courseKey in selectedCourses) {
            const course = allCourses[courseKey];
            if (course.lecture_sections && course.lecture_sections.length > 0 && selectedCourses[courseKey].lecture.length === 0) {
                allSectionsSelected = false;
                break;
            }
            // Practical sections are optional, so we don't check for their selection here for button visibility
        }

        if (Object.keys(selectedCourses).length > 0 && allSectionsSelected) {
            generateTimetableBtn.style.display = 'block';
            generateSectionContainer.style.display = 'block';
        } else {
            generateTimetableBtn.style.display = 'none';
            generateSectionContainer.style.display = 'none';
        }
    }


    // Generate timetable using CSP solver (same as before)
    generateTimetableBtn.addEventListener('click', generateTimetable);

    function generateTimetable() {
        timetableDisplayContainer.style.display = 'none';
        timetableNavigationDiv.style.display = 'none';
        timetableGridDiv.innerHTML = '<p>Generating timetables...</p>';
        timetableDetailsDiv.innerHTML = "";
        examClashContainer.style.display = 'none';
        examClashList.innerHTML = '';

        const selectedCourseKeys = Object.keys(selectedCourses);

        // Prepare variables and domains for CSP (same as before)
        const variables = [];
        const domains = {};
        const courseKeys = selectedCourseKeys;

        courseKeys.forEach(courseKey => {
            const courseData = allCourses[courseKey];
            const lectureSections = courseData.lecture_sections.filter(sec => selectedCourses[courseKey].lecture.includes(sec.section));
            const practicalSections = courseData.practical_sections.filter(sec => selectedCourses[courseKey].practical.includes(sec.section));

            if (lectureSections.length > 0) {
                const lectureVar = `${courseKey}_lecture`;
                variables.push(lectureVar);
                domains[lectureVar] = lectureSections.map(sec => ({
                    section: sec.section,
                    slots: sec.slotsSet,
                    instructor: sec.instructor,
                    room: sec.room
                }));
            }
            if (practicalSections.length > 0) {
                const practicalVar = `${courseKey}_practical`;
                variables.push(practicalVar);
                domains[practicalVar] = practicalSections.map(sec => ({
                    section: sec.section,
                    slots: sec.slotsSet,
                    instructor: sec.instructor,
                    room: sec.room
                }));
            }
            variables.push(`${courseKey}_midsem`);
            domains[`${courseKey}_midsem`] = [courseData.midsem];
            variables.push(`${courseKey}_compre`);
            domains[`${courseKey}_compre`] = [courseData.compre];
        });

        solutions = [];
        const timetableSolutions = solveCSP(variables, domains, courseKeys);

        if (timetableSolutions.length > 0) {
            solutions = timetableSolutions;
            currentTimetableSolution = solutions[0];
            displayTimetable(currentTimetableSolution, 0, solutions.length);
            timetableNavigationDiv.style.display = solutions.length > 1 ? 'block' : 'none';
            timetableDisplayContainer.style.display = 'block';
        } else {
            timetableGridDiv.innerHTML = '<p class="error-message">No valid timetable found with the selected sections (considering all constraints).</p>';
            timetableDisplayContainer.style.display = 'block';
            timetableNavigationDiv.style.display = 'none';
            timetableNumberDisplay.textContent = "";
        }
    }

    // CSP solving function (backtracking) (same as before)
    function solveCSP(variables, domains, courseKeys) {
        const validSolutions = [];
        function backtrack(assignment) {
            if (Object.keys(assignment).length === variables.length) {
                if (isAssignmentCompleteAndValid(assignment, courseKeys)) {
                    validSolutions.push({...assignment});
                }
                return;
            }

            const variable = variables[Object.keys(assignment).length];
            for (const value of domains[variable]) {
                const newAssignment = { ...assignment, [variable]: value };
                if (isConsistent(newAssignment, courseKeys)) {
                    backtrack(newAssignment);
                }
            }
        }
        backtrack({});
        return validSolutions;
    }

    // Check for consistency in assignments (same as before)
    function isConsistent(assignment, courseKeys) {
        for (const courseKey of courseKeys) {
            const lectureVar = `${courseKey}_lecture`;
            const practicalVar = `${courseKey}_practical`;
            if (assignment[lectureVar] && assignment[practicalVar]) {
                const lecSlots = assignment[lectureVar].slots;
                const pracSlots = assignment[practicalVar].slots;
                if (hasSlotConflict(lecSlots, pracSlots)) return false;
            }
        }

        for (let i = 0; i < courseKeys.length; i++) {
            for (let j = i + 1; j < courseKeys.length; j++) {
                const courseKey1 = courseKeys[i];
                const courseKey2 = courseKeys[j];

                const lecVar1 = `${courseKey1}_lecture`;
                const lecVar2 = `${courseKey2}_lecture`;
                if (assignment[lecVar1] && assignment[lecVar2]) {
                    if (hasSlotConflict(assignment[lecVar1].slots, assignment[lecVar2].slots)) return false;
                }

                const pracVar1 = `${courseKey1}_practical`;
                const pracVar2 = `${courseKey2}_practical`;
                if (assignment[pracVar1] && assignment[pracVar2]) {
                    if (hasSlotConflict(assignment[pracVar1].slots, assignment[pracVar2].slots)) return false;
                }

                // Check for Lecture-Practical and Practical-Lecture clashes between different courses (same as before)
                if (assignment[lecVar1] && assignment[pracVar2]) {
                    if (hasSlotConflict(assignment[lecVar1].slots, assignment[pracVar2].slots)) return false;
                }
                if (assignment[pracVar1] && assignment[lecVar2]) {
                    if (hasSlotConflict(assignment[pracVar1].slots, assignment[lecVar2].slots)) return false;
                }


                const midsemVar1 = `${courseKey1}_midsem`;
                const midsemVar2 = `${courseKey2}_midsem`;
                const compreVar1 = `${courseKey1}_compre`;
                const compreVar2 = `${courseKey2}_compre`;

                if (assignment[midsemVar1] && assignment[midsemVar2] && assignment[midsemVar1] !== null && assignment[midsemVar2] !== null && assignment[midsemVar1] === assignment[midsemVar2]) return false;
                if (assignment[compreVar1] && assignment[compreVar2] && assignment[compreVar1] !== null && assignment[compreVar2] !== null && assignment[compreVar1] === assignment[compreVar2]) return false;
            }
        }
        return true;
    }

    // Check for slot conflict between two sets of slots (same as before)
    function hasSlotConflict(slots1, slots2) {
        if (!slots1 || !slots2) return false;
        for (const slot1 of slots1) {
            if (slots2.has(slot1)) return true;
        }
        return false;
    }

    // Check if assignment is complete and valid (same as before)
    function isAssignmentCompleteAndValid(assignment, courseKeys) {
        return isConsistent(assignment, courseKeys);
    }

    // Update display of total credits (same as before)
    function updateCreditDisplay() {
        let totalCredits = 0;
        const selectedCourseKeys = Object.keys(selectedCourses);
        for (const courseKey of selectedCourseKeys) {
            totalCredits += parseInt(allCourses[courseKey].credit);
        }
        totalCreditsDisplay.textContent = totalCredits.toString();
        totalCreditsDisplay.parentElement.style.color = totalCredits > 25 ? '#dc3545' : '#28a745';
    }

    // Update display of exam clashes (same as before)
    function updateExamClashDisplay() {
        const selectedCourseKeys = Object.keys(selectedCourses);
        const clashMessages = checkExamClashes(selectedCourseKeys);
        examClashList.innerHTML = '';

        if (clashMessages.length > 0) {
            examClashContainer.style.display = 'block';
            clashMessages.forEach(message => {
                const li = document.createElement('li');
                li.textContent = message;
                examClashList.appendChild(li);
            });
        } else {
            examClashContainer.style.display = 'none';
        }
    }

    // Check for exam clashes between selected courses (same as before)
    function checkExamClashes(selectedCourseKeys) {
        const clashMessages = [];
        for (let i = 0; i < selectedCourseKeys.length; i++) {
            for (let j = i + 1; j < selectedCourseKeys.length; j++) {
                const courseKey1 = selectedCourseKeys[i];
                const courseKey2 = selectedCourseKeys[j];
                const midsem1 = allCourses[courseKey1].midsem;
                const midsem2 = allCourses[courseKey2].midsem;
                const compre1 = allCourses[courseKey1].compre;
                const compre2 = allCourses[courseKey2].compre;

                if (midsem1 !== null && midsem2 !== null && midsem1 === midsem2) clashMessages.push(`Midsem exam clash: ${courseKey1} and ${courseKey2} (${midsem1}).`);
                if (compre1 !== null && compre2 !== null && compre1 === compre2) clashMessages.push(`Comprehensive exam clash: ${courseKey1} and ${courseKey2} (${compre1}).`);
            }
        }
        return clashMessages;
    }

    // Display generated timetable (TRANSPOSED) with multi-line cells (same as before)
    function displayTimetable(solution, solutionIndex, totalSolutions) {
        const days = ["M", "T", "W", "Th", "F"];
        const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const timetableGrid = {};

        hours.forEach(hour => {
            timetableGrid[hour] = {};
            days.forEach(day => {
                timetableGrid[hour][day] = "";
            });
        });

        for (const courseKey in selectedCourses) {
            const lectureVarName = `${courseKey}_lecture`;
            if (solution[lectureVarName]) {
                const lectureSection = solution[lectureVarName];
                Array.from(lectureSection.slots).forEach(slot => {
                    const day = slot.startsWith("Th") ? "Th" : slot[0];
                    const hour = slot.substring(slot.startsWith("Th") ? 2 : slot.length > 2 ? 2 : 1);
                    timetableGrid[hour][day] = `${courseKey}<br>${lectureSection.section}<br>${lectureSection.room}`;
                });
            }
            const practicalVarName = `${courseKey}_practical`;
            if (solution[practicalVarName]) {
                const practicalSection = solution[practicalVarName];
                Array.from(practicalSection.slots).forEach(slot => {
                    const day = slot.startsWith("Th") ? "Th" : slot[0];
                    const hour = slot.substring(slot.startsWith("Th") ? 2 : slot.length > 2 ? 2 : 1);
                    timetableGrid[hour][day] = `${timetableGrid[hour][day] ? timetableGrid[hour][day] + '<br><br>' : ''}${courseKey}<br>${practicalSection.section}<br>${practicalSection.room}`;
                });
            }
        }

        let timetableHTML = '<table><thead><tr><th>Hour</th>';
        days.forEach(day => timetableHTML += `<th>${day}</th>`);
        timetableHTML += '</tr></thead><tbody>';
        hours.forEach(hour => {
            timetableHTML += `<tr><th>${hour}</th>`;
            days.forEach(day => timetableHTML += `<td>${timetableGrid[hour][day] || ''}</td>`);
            timetableHTML += '</tr>';
        });
        timetableHTML += '</tbody></table>';
        timetableGridDiv.innerHTML = timetableHTML;

        let detailsHTML = '<h3>Course Details:</h3><ul>';
        for (const courseKey in selectedCourses) {
            const course = allCourses[courseKey];
            const lectureSection = solution[`${courseKey}_lecture`] || {};
            const practicalSection = solution[`${courseKey}_practical`] || {};

            detailsHTML += `<li><strong>${courseKey}: ${course.course_title} (${course.credit} Credits)</strong>`;
            if (lectureSection.section) detailsHTML += `<br>- Lecture: L${lectureSection.section} (Slots: ${Array.from(lectureSection.slots).join(', ')}, Instructor: ${lectureSection.instructor}, Room: ${lectureSection.room})`;
            if (practicalSection.section) detailsHTML += `<br>- Practical: P${practicalSection.section} (Slots: ${Array.from(practicalSection.slots).join(', ')}, Instructor: ${practicalSection.instructor}, Room: ${practicalSection.room})`;
            detailsHTML += `<br>- Midsem: ${solution[`${courseKey}_midsem`] === null ? 'N/A' : solution[`${courseKey}_midsem`]}, Compre: ${solution[`${courseKey}_compre`] === null ? 'N/A' : solution[`${courseKey}_compre`]}</li>`;
        }
        timetableDetailsDiv.innerHTML = detailsHTML;

        timetableNumberDisplay.textContent = `(${solutionIndex + 1}/${totalSolutions})`;
    }

    // Navigation buttons for timetables (same as before)
    nextTimetableBtn.addEventListener('click', () => {
        if (solutions.length > 0) {
            const nextIndex = (solutions.indexOf(currentTimetableSolution) + 1) % solutions.length;
            currentTimetableSolution = solutions[nextIndex];
            displayTimetable(currentTimetableSolution, nextIndex, solutions.length);
        }
    });

    prevTimetableBtn.addEventListener('click', () => {
        if (solutions.length > 0) {
            const prevIndex = (solutions.indexOf(currentTimetableSolution) - 1 + solutions.length) % solutions.length;
            currentTimetableSolution = solutions[prevIndex];
            displayTimetable(currentTimetableSolution, prevIndex, solutions.length);
        }
    });

    // Event listeners for course search and add course (same as before)
    courseSearchInput.addEventListener('input', () => {
        const query = courseSearchInput.value.toLowerCase();
        filteredCourseKeys = Object.keys(allCourses).filter(key => key.toLowerCase().includes(query) || allCourses[key].course_title.toLowerCase().includes(query));
        displayCourses();
    });

    addCourseBtn.addEventListener('click', () => {
        const newCode = newCourseCodeInput.value.trim().toUpperCase();
        const newTitle = newCourseTitleInput.value.trim();
        if (newCode && newTitle) {
            if (!allCourses[newCode]) {
                allCourses[newCode] = {
                    course_code: 0,
                    course_title: newTitle,
                    credit: "3",
                    instructor_in_charge: "TBD",
                    lecture_sections: [],
                    practical_sections: [],
                    midsem: null,
                    compre: null
                };
                filteredCourseKeys = Object.keys(allCourses);
                displayCourses();
                newCourseCodeInput.value = '';
                newCourseTitleInput.value = '';
                alert('Course added successfully!');
            } else {
                alert('Course code already exists!');
            }
        } else {
            alert('Please enter both Course Code and Title.');
        }
    });

    // Function to toggle dark mode and save preference (same as before)
    function toggleDarkMode(isDarkMode) {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Event listener for dark mode toggle switch (same as before)
    darkModeToggle.addEventListener('change', function() {
        toggleDarkMode(this.checked);
    });

    // Check for saved dark mode preference on page load (same as before)
    if (localStorage.getItem('darkMode') === 'true') {
        darkModeToggle.checked = true;
        toggleDarkMode(true);
    } else {
        darkModeToggle.checked = false;
        toggleDarkMode(false);
    }

    // Event listener for Download Timetable button (newly added)
    downloadTimetableBtn.addEventListener('click', () => {
        downloadTimetableAsImage();
    });

    // Function to download timetable as image (newly added)
    function downloadTimetableAsImage() {
        const timetableGridDiv = document.getElementById('timetableGrid');

        html2canvas(timetableGridDiv).then(function(canvas) {
            const dataURL = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.href = dataURL;
            downloadLink.download = 'timetable.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        });
    }


    loadCourses();
    updateCreditDisplay();
    updateExamClashDisplay();
});