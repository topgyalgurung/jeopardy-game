// categories is the main data structure for the app; it looks like this:
// https://rithm-jeopardy.herokuapp.com/api/category?id=3 - questions
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

// https://rithm-jeopardy.herokuapp.com/api/categories?count=100 - category
/**
  [
  {
    "id": 2,
    "title": "baseball",
    "clues_count": 5
  },
 */

/*
Functions:
- setupAndStart
- showLoadingView
- showSpinner
- getCategoryIds
- getCategory(catId)
- fillTable
- hideSpinner
- hideLoadingView
- handleClick

*/
const CATEGORY_URL =
  "https://rithm-jeopardy.herokuapp.com/api/categories?count=100";
const QUESTION_URL = "https://rithm-jeopardy.herokuapp.com/api/category?id=";

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
  try {
    const response = await axios.get(`${CATEGORY_URL}`);
    const categoryData = response.data;

    if (!Array.isArray(categoryData) || categoryData.length === 0) {
      console.error("No categories found or data is not in expected format.");
      return [];
    }

    // Filter out any invalid categories (e.g., those missing an ID)
    const validCategories = categoryData.filter(
      (category) => category.id && category.clues_count > 0
    );

    if (validCategories.length < 5) {
      console.warn(
        "Less than 5 valid categories found. The game might not function as expected."
      );
    }

    // Shuffle and select the first 5 valid categories
    const shuffled = _.shuffle(validCategories);
    return shuffled.slice(0, 5).map((category) => category.id);
  } catch (error) {
    console.error("Error fetching category IDs:", error);
    return [];
  }
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
  try {
    const response = await axios.get(`${QUESTION_URL}${catId}`);
    const categoryData = response.data;

    if (
      !categoryData ||
      !categoryData.title ||
      !Array.isArray(categoryData.clues)
    ) {
      console.error(`Invalid data structure for category ${catId}`);
      return null; // Return null for invalid data
    }

    return {
      title: categoryData.title,
      clues: categoryData.clues.map((clue) => ({
        question: clue.question,
        answer: clue.answer,
        showing: null,
      })),
    };
  } catch (error) {
    console.error(`Error fetching category ${catId}:`, error);
    return null; // Return null on error
  }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
function fillTable() {
  const table = document.querySelector("#jeopardy");
  table.innerHTML = "";

  // Set table styles for larger size and center positioning
  table.style.width = "80%";
  table.style.margin = "20px auto";
  table.style.borderCollapse = "collapse";
  table.style.fontSize = "18px";

  // Create table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  categories.forEach((category) => {
    const th = document.createElement("th");
    th.textContent = category.title;
    th.style.border = "2px solid white";
    th.style.padding = "15px";
    th.style.backgroundColor = "#060CE9";
    th.style.color = "white";
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");

  for (let i = 0; i < 5; i++) {
    // Assuming 5 clues per category
    const row = document.createElement("tr");

    categories.forEach((category, idx) => {
      const cell = document.createElement("td");
      cell.textContent = "?";
      cell.dataset.categoryId = idx;
      cell.dataset.clueIndex = i;
      cell.classList.add("clue");
      cell.style.border = "2px solid white";
      cell.style.padding = "20px";
      cell.style.textAlign = "center";
      cell.style.backgroundColor = "#060CE9";
      cell.style.color = "white";
      cell.style.cursor = "pointer";
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 */
function handleClick(evt) {
  const cell = evt.target;
  if (!cell.classList.contains("clue")) return; // Ignore clicks outside clues

  const categoryId = parseInt(cell.dataset.categoryId);
  const clueIndex = parseInt(cell.dataset.clueIndex);

  const clue = categories[categoryId].clues[clueIndex];
  if (!clue) return;

  if (!clue.showing) {
    cell.textContent = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    cell.textContent = clue.answer;
    cell.style.backgroundColor = "#28a745"; // Green background for answered clues
    clue.showing = "answer";
  }
  // If the answer is already showing, do nothing
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
  // Update the button
  const startButton = document.querySelector("#start");
  startButton.textContent = "Loading...";
  startButton.disabled = true;

  // Show loading spinner
  const spinContainer = document.createElement("div");
  spinContainer.id = "spin-container";
  spinContainer.style.position = "fixed";
  spinContainer.style.top = "50%";
  spinContainer.style.left = "50%";
  spinContainer.style.transform = "translate(-50%, -50%)";

  document.body.appendChild(spinContainer);

  const numDots = 6; // Number of dots in the spinner
  const angleStep = 360 / numDots; // Calculate the angle between each dot

  for (let i = 0; i < numDots; i++) {
    const dot = document.createElement("div"); // Create a new div element for each dot
    const angle = angleStep * i; // Calculate the angle for the current dot

    // Set the transform style to position the dot in a circle
    dot.style.transform = `rotate(${angle}deg) translate(35px)`;

    // Add animation for continuous spinning
    dot.style.animation = `spin 2s linear infinite ${i * (2 / numDots)}s`; // Add delay to create circular motion

    spinContainer.appendChild(dot);
  }

  // Add keyframes for continuous spinning animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg) translate(35px) rotate(0deg); }
      100% { transform: rotate(360deg) translate(35px) rotate(-360deg); }
    }
  `;
  document.head.appendChild(style);

  // Clear the existing board if any
  const existingTable = document.querySelector("table");
  if (existingTable) {
    existingTable.remove();
  }
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  // Remove the loading spinner
  const spinContainer = document.getElementById("spin-container");
  if (spinContainer) {
    spinContainer.remove();
  }

  // Remove the spinner style
  const spinnerStyle = document.querySelector("style");
  if (spinnerStyle) {
    spinnerStyle.remove();
  }

  // Update the button
  const startButton = document.querySelector("#start");
  if (startButton) {
    startButton.textContent = "Restart!";
    startButton.disabled = false;
  }
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 */
async function setupAndStart() {
  showLoadingView();

  // Get category IDs
  const categoryIds = await getCategoryIds();

  // Get data for each category
  // Fetch category data for all category IDs concurrently
  // Then filter out any null results (failed fetches)
  // Create an empty array to store our categories
  categories = (
    await Promise.all(categoryIds.map((id) => getCategory(id)))
  ).filter((cat) => cat !== null);

  // Explanation:
  // 1. categoryIds.map((id) => getCategory(id)) creates an array of promises,
  //    each promise fetching data for one category
  // 2. Promise.all() waits for all these promises to resolve concurrently
  // 3. The result is then filtered to remove any null entries (failed fetches)
  // 4. The final result is an array of valid category objects

  if (categories.length < 5) {
    alert("Not enough valid categories found. Please try again.");
    hideLoadingView();
    return;
  }

  // Wait for 3 seconds before showing the table
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Create the table element
  const table = document.createElement("table");
  table.id = "jeopardy";
  table.style.marginTop = "20px"; // Add space between button and table

  // Append the table to the document body
  document.body.appendChild(table);

  // Populate the table with categories and clues
  fillTable();

  hideLoadingView();
}

/** On click of start / restart button, set up game. */
document.addEventListener("DOMContentLoaded", function () {
  const heading = document.createElement("h1");
  heading.textContent = "Jeopardy!";
  heading.style.textAlign = "center";
  heading.style.color = "white";
  document.body.appendChild(heading);

  // Create start/restart button
  const button = document.createElement("button");
  button.id = "start";
  button.textContent = "Start!";
  button.style.display = "block";
  button.style.backgroundColor = "lightcoral"; // Changed to a light red color
  button.style.color = "white";
  button.style.margin = "20px auto";
  button.style.fontSize = "18px";
  button.style.padding = "10px 20px";
  document.body.appendChild(button);

  // Add event listener to start button
  button.addEventListener("click", async function () {
    await setupAndStart();
  });

  // Add event delegation for clicking clues
  document.body.addEventListener("click", handleClick);
});
