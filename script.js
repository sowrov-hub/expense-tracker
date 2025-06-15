document.addEventListener('DOMContentLoaded', () => {
    // Get elements from the DOM
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseCategorySelect = document.getElementById('expenseCategory');
    const expenseDateInput = document.getElementById('expenseDate');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseList = document.getElementById('expenseList');

    // New: Reference to the dynamic total display elements
    const totalPeriodExpensesSpan = document.getElementById('totalPeriodExpenses');
    const currentPeriodLabelSpan = document.getElementById('currentPeriodLabel');


    const filterPeriodSelect = document.getElementById('filterPeriod');
    const filterMonthYearInput = document.getElementById('filterMonthYear');
    const filterYearInput = document.getElementById('filterYear');
    const filterDateInput = document.getElementById('filterDate');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    let expenses = []; // Array to store all expenses

    // --- Helper Functions ---

    // Load expenses from localStorage when the app starts
    function loadExpenses() {
        const storedExpenses = localStorage.getItem('expenses');
        if (storedExpenses) {
            try {
                expenses = JSON.parse(storedExpenses);
            } catch (e) {
                console.error("Error parsing stored expenses from localStorage:", e);
                expenses = []; // Reset if data is corrupted
            }
        }
        updateFilterInputs(); // Initialize filter UI and display expenses
    }

    // Save expenses array to localStorage
    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    // Formats a date string (YYYY-MM-DD) into a more readable format (e.g., "June 14th, 2025")
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00'); // Standardize date interpretation
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        let formattedDate = date.toLocaleDateString('en-US', options);

        // Add ordinal suffix (st, nd, rd, th) to the day
        const day = date.getDate();
        if (day > 3 && day < 21) {
            formattedDate = formattedDate.replace(/(\d+),/, `$1th,`);
        } else {
            switch (day % 10) {
                case 1: formattedDate = formattedDate.replace(/(\d+),/, `$1st,`); break;
                case 2: formattedDate = formattedDate.replace(/(\d+),/, `$1nd,`); break;
                case 3: formattedDate = formattedDate.replace(/(\d+),/, `$1rd,`); break;
                default: formattedDate = formattedDate.replace(/(\d+),/, `$1th,`); break;
            }
        }
        return formattedDate;
    }

    // Returns a Font Awesome icon HTML string based on the category name
    function getCategoryIcon(category) {
        switch (category.toLowerCase()) {
            case 'food': return '<i class="fas fa-utensils"></i>';
            case 'transport': return '<i class="fas fa-car"></i>';
            case 'utilities': return '<i class="fas fa-lightbulb"></i>';
            case 'rent': return '<i class="fas fa-home"></i>';
            case 'entertainment': return '<i class="fas fa-ticket-alt"></i>';
            case 'shopping': return '<i class="fas fa-shopping-bag"></i>';
            case 'healthcare': return '<i class="fas fa-notes-medical"></i>';
            case 'education': return '<i class="fas fa-graduation-cap"></i>';
            case 'other': return '<i class="fas fa-money-bill-wave"></i>';
            default: return '<i class="fas fa-money-bill"></i>'; // Fallback icon
        }
    }

    // Controls the visibility of filter inputs (date, month, year) and sets their default values
    function updateFilterInputs() {
        const period = filterPeriodSelect.value;
        filterMonthYearInput.style.display = 'none';
        filterYearInput.style.display = 'none';
        filterDateInput.style.display = 'none';

        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');

        if (period === 'daily') {
            filterDateInput.style.display = 'block';
            filterDateInput.value = today.toISOString().split('T')[0];
        } else if (period === 'monthly') {
            filterMonthYearInput.style.display = 'block';
            filterMonthYearInput.value = `${year}-${month}`;
        } else if (period === 'yearly') {
            filterYearInput.style.display = 'block';
            filterYearInput.value = year;
        }
        displayExpenses(); // Re-render expenses after filter input changes
    }

    // --- Main Functions ---

    // Displays expenses in the list based on the current filter, and updates monthly total
    function displayExpenses() {
        expenseList.innerHTML = ''; // Clear current list contents
        let totalCurrentPeriod = 0; // Total for the currently displayed filtered view

        const currentFilterPeriod = filterPeriodSelect.value;
        let selectedFilterValue = '';
        let periodLabelText = ''; // Text for the summary card label

        // Get the value of the active filter input and determine period label
        if (currentFilterPeriod === 'daily') {
            selectedFilterValue = filterDateInput.value;
            periodLabelText = formatDate(selectedFilterValue).replace(',',''); // "June 14th 2025"
        } else if (currentFilterPeriod === 'monthly') {
            selectedFilterValue = filterMonthYearInput.value;
            const [year, month] = selectedFilterValue.split('-');
            const dateForMonthName = new Date(year, parseInt(month) - 1, 1);
            periodLabelText = dateForMonthName.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // "June 2025"
        } else if (currentFilterPeriod === 'yearly') {
            selectedFilterValue = parseInt(filterYearInput.value);
            periodLabelText = selectedFilterValue.toString(); // "2025"
        }

        let hasDisplayedExpenses = false; // Flag to track if any expenses are shown in the filtered list

        // Sort expenses by date in descending order (most recent first)
        expenses.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00')).forEach(expense => {
            const expenseDateObj = new Date(expense.date + 'T00:00:00');

            let shouldDisplay = false; // Flag to determine if the current expense should be displayed in the list
            if (currentFilterPeriod === 'daily') {
                if (expense.date === selectedFilterValue) {
                    shouldDisplay = true;
                }
            } else if (currentFilterPeriod === 'monthly') {
                if (expense.date.slice(0, 7) === selectedFilterValue) {
                    shouldDisplay = true;
                }
            } else if (currentFilterPeriod === 'yearly') {
                if (expenseDateObj.getFullYear() === selectedFilterValue) {
                    shouldDisplay = true;
                }
            }

            // If the expense matches the current filter, add it to the total and display it
            if (shouldDisplay) {
                hasDisplayedExpenses = true;
                totalCurrentPeriod += parseFloat(expense.amount); // Sum for the current period
                const listItem = document.createElement('li');
                listItem.className = 'expense-item-card';
                listItem.innerHTML = `
                    <button class="delete-expense-btn" data-id="${expense.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <div class="expense-header">
                        <span class="category-icon">${getCategoryIcon(expense.category)}</span>
                        <span class="category-name">${expense.category}</span>
                    </div>
                    <div class="expense-date">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(expense.date)}</span>
                    </div>
                    <p class="expense-description">${expense.description || ''}</p>
                    <span class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                `;
                expenseList.appendChild(listItem);
            }
        });

        // If no expenses match the filter, display a message
        if (!hasDisplayedExpenses) {
            expenseList.innerHTML = '<p>No expenses found for this period.</p>';
        }

        // Update the dynamic total and label in the summary card
        totalPeriodExpensesSpan.textContent = `$${totalCurrentPeriod.toFixed(2)}`;
        currentPeriodLabelSpan.textContent = periodLabelText;
    }

    // Adds a new expense based on input field values
    function addExpense() {
        const amount = parseFloat(expenseAmountInput.value);
        const description = expenseDescriptionInput.value.trim();
        const category = expenseCategorySelect.value;
        const date = expenseDateInput.value;

        // Input validation
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }
        if (category === '') {
            alert('Please select a category.');
            return;
        }
        if (date === '') {
            alert('Please select a date.');
            return;
        }

        const newExpense = {
            id: Date.now(), // Unique ID
            amount: amount,
            description: description,
            category: category,
            date: date
        };

        expenses.push(newExpense);
        saveExpenses();
        displayExpenses(); // Re-render with new expense

        // Clear input fields
        expenseAmountInput.value = '';
        expenseDescriptionInput.value = '';
        expenseCategorySelect.value = '';
        expenseDateInput.value = new Date().toISOString().split('T')[0]; // Reset date to today
    }

    // Deletes an expense by its ID
    function deleteExpense(id) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        displayExpenses(); // Re-render the list
    }

    // --- Event Listeners ---

    addExpenseBtn.addEventListener('click', addExpense);

    expenseList.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.delete-expense-btn');
        if (deleteButton && deleteButton.dataset.id) {
            deleteExpense(parseInt(deleteButton.dataset.id));
        }
    });

    // Filter control changes
    filterPeriodSelect.addEventListener('change', updateFilterInputs);
    filterDateInput.addEventListener('change', displayExpenses);
    filterMonthYearInput.addEventListener('change', displayExpenses);
    filterYearInput.addEventListener('input', displayExpenses);

    // Reset Filter button
    resetFilterBtn.addEventListener('click', () => {
        filterPeriodSelect.value = 'monthly'; // Default to monthly
        updateFilterInputs();
    });

    // Set today's date as default in input on load
    expenseDateInput.value = new Date().toISOString().split('T')[0];

    // Initialize the app
    loadExpenses();
});