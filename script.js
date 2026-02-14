/* =================== Smart Expense Manager =================== */

const description = document.getElementById('description');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const addExpenseBtn = document.getElementById('addExpense');
const voiceExpenseBtn = document.getElementById('voiceExpense');

const budgetAmount = document.getElementById('budgetAmount');
const setBudgetBtn = document.getElementById('setBudget');
const incomeAmount = document.getElementById('incomeAmount');
const setIncomeBtn = document.getElementById('setIncome');

const budgetValue = document.getElementById('budgetValue');
const totalSpentEl = document.getElementById('totalSpent');
const remainingValue = document.getElementById('remainingValue');
const incomeValue = document.getElementById('incomeValue');
const budgetProgress = document.getElementById('budgetProgress');

const expensesTableBody = document.querySelector('#expensesTable tbody');
const monthFilter = document.getElementById('monthFilter');
const modeToggle = document.getElementById('modeToggle');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let income = parseFloat(localStorage.getItem('income')) || 0;

const ctx = document.getElementById('categoryChart').getContext('2d');
let categoryChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: { responsive: true }
});

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('budget', budget);
    localStorage.setItem('income', income);
}

function updateBudgetDisplay() {
    budgetValue.textContent = budget.toFixed(2);
    incomeValue.textContent = income.toFixed(2);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalSpentEl.textContent = totalSpent.toFixed(2);
    const remaining = income - totalSpent;
    remainingValue.textContent = remaining.toFixed(2);
    const progress = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;
    budgetProgress.style.width = progress + '%';
    budgetProgress.style.backgroundColor = progress >= 90 ? 'red' : '#4caf50';
}

function renderExpenses(filterMonth) {
    expensesTableBody.innerHTML = '';
    const filtered = filterMonth
        ? expenses.filter(e => e.date.startsWith(filterMonth))
        : expenses;
    filtered.forEach((exp, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${exp.date}</td>
            <td>${exp.description}</td>
            <td>${exp.category}</td>
            <td>${exp.amount.toFixed(2)}</td>
            <td><button onclick="deleteExpense(${index})">❌</button></td>
        `;
        expensesTableBody.appendChild(tr);
    });
    updateChart();
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveData();
    renderExpenses(monthFilter.value);
    updateBudgetDisplay();
}

// Add Expense
addExpenseBtn.addEventListener('click', addExpense);
function addExpense(desc, amt, cat) {
    let descriptionValue = desc || description.value.trim();
    let amountValue = amt || parseFloat(amount.value);
    let categoryValue = cat || category.value;

    if (!descriptionValue || isNaN(amountValue) || amountValue <= 0) return alert('Enter valid expense');

    const date = new Date().toISOString().split('T')[0];
    expenses.push({ description: descriptionValue, amount: amountValue, category: categoryValue, date });
    saveData();
    renderExpenses(monthFilter.value);
    updateBudgetDisplay();

    description.value = '';
    amount.value = '';
}

// Set Budget
setBudgetBtn.addEventListener('click', () => {
    const val = parseFloat(budgetAmount.value);
    if (isNaN(val) || val <= 0) return alert('Enter valid budget');
    budget = val;
    saveData();
    updateBudgetDisplay();
    budgetAmount.value = '';
});

// Set Income
setIncomeBtn.addEventListener('click', () => {
    const val = parseFloat(incomeAmount.value);
    if (isNaN(val) || val <= 0) return alert('Enter valid income');
    income = val;
    saveData();
    updateBudgetDisplay();
    incomeAmount.value = '';
});

// Month filter
monthFilter.addEventListener('change', () => renderExpenses(monthFilter.value));

// Dark/Light Mode
modeToggle.addEventListener('click', () => document.body.classList.toggle('dark'));

// Chart Update
function updateChart() {
    const categoryData = {};
    expenses.forEach(e => categoryData[e.category] = (categoryData[e.category] || 0) + e.amount);
    categoryChart.data.labels = Object.keys(categoryData);
    categoryChart.data.datasets[0].data = Object.values(categoryData);
    categoryChart.data.datasets[0].backgroundColor = Object.keys(categoryData).map(() => `hsl(${Math.random()*360},70%,60%)`);
    categoryChart.update();
}

// ------------------- VOICE INPUT -------------------
voiceExpenseBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window)) return alert('Voice recognition not supported');
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.start();
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim();
        parseVoiceExpense(transcript);
    };
});

function parseVoiceExpense(text) {
    // Example: "Add 500 Food Lunch"
    const words = text.split(' ');
    const amountValue = parseFloat(words[1]);
    const categoryValue = words[2] ? capitalize(words[2]) : 'Other';
    const descriptionValue = words.slice(3).join(' ') || 'No description';
    addExpense(descriptionValue, amountValue, categoryValue);
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }

// Initialize
renderExpenses();
updateBudgetDisplay();
