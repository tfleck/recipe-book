const searchInput = document.querySelector("#search_input");
const searchOutput = document.querySelector("#search_output");

let searchIndex;

let searchResultsCount = 0;
let searchSelection = -1;

// asynchronously load search "index" (the search box will remain disabled until then)
fetch("search.json")
    .then(response => response.json())
    .then(data => {
        searchIndex = data;
        searchInput.removeAttribute("disabled");
    })
    .catch(error => {
        searchOutput.innerHTML = `<span class="error">${error}</span>`
    });

// search the "index" for a query string while assigning different weights depending on which parts of the json value the query appears in
function search(query) {
    const matches = (haystack, needle) => (haystack || "").toLowerCase().includes(needle.toLowerCase());
    const matchesStart = (haystack, needle) => (haystack || "").toLowerCase().startsWith(needle.toLowerCase());

    let results = [];
    searchIndex.forEach(e => {
        let score = 0;
        if (matches(e.title, query)) score += 20;
        if (matches(e["original_title"], query)) score += 10;
        if (matches(e["category"], query)) score += 5;
        if (matches(e["author"], query)) score += 5;
        if (matches(e["description"], query)) score += 2;
        if (matches(e["htmlfile"], query)) score += 1;

        // boost favories a little
        if (score > 0 && e["favorite"]) score += 2;

        // slightly increase score if the query occurs right at the start of the title
        if (matchesStart(e.title, query)) score += 3;

        results.push({score: score, e: e});
    });

    results = results
      .filter(r => r.score > 0)           // filter out non-results
      .sort((a, b) => b.score - a.score)  // should be "a.score - b.score", but then we'd need to reverse afterwards
      .slice(0, 10)                       // limit to the best 10 results
      .map(e => e.e);                     // throw away score

    return results;
}

function clearResults() {
    searchResultsCount = 0;
    searchSelection = -1;

    searchOutput.innerHTML = "";
}

// render a subset of the search index in the results/output pane
function showResults(results) {
    searchResultsCount = results.length;
    searchSelection = -1;

    let i = 0;
    const code = results.map(e => {
        return `<a href="${e.htmlfile}" class="searchresult" id="${i++}">`
            + `<h3>`
            + `<i class="icons">`
            + (e.favorite ? `<img src="assets/tabler-icons/tabler-icon-star.svg"> ` : ``)
            + (e.spicy ? `<img src="assets/tabler-icons/tabler-icon-flame.svg"> ` : ``)
            + ((e.veggie || e.vegan) ? `` : `<img src="assets/tabler-icons/tabler-icon-bone.svg"> `)
            + (e.vegan ? `<img src="assets/tabler-icons/tabler-icon-leaf.svg"> ` : ``)
            + `</i>`
            + `<span>${e.title}</span> `
            + (e.original_title ? `<em>${e.original_title}</em>` : ``)
            + `</h3>`
            + `</a>`;
    });

    searchOutput.innerHTML = code.join("");
}

// clear results, search if the search bar isn't empty, and display results
searchInput.addEventListener('input', e => {
    clearResults();
    if (searchInput.value) {
        const results = search(searchInput.value);
        showResults(results);
    }
});

// highlight the currently selected search result
function highlightSearchSelection() {
    document.querySelectorAll(".searchresult").forEach(e => e.classList.remove("selected"));
    if (document.getElementById(`${searchSelection}`)) {
        document.getElementById(`${searchSelection}`).classList.add("selected");
    }
}

// enable keyboard naviation of search results
searchInput.addEventListener('keydown', e => {
    if (e.key == "ArrowUp") {
        searchSelection = Math.max(-1, searchSelection - 1);
        e.preventDefault();
    } else if (e.key == "ArrowDown") {
        searchSelection = Math.min(searchResultsCount - 1, searchSelection + 1);
        e.preventDefault();
    } else if (e.key == "Enter") {
        if (searchSelection != -1) {
            document.getElementById(`${searchSelection}`).click();
        }
    }
    highlightSearchSelection();
})

// allow, in conjunction with keyboard naviation (otherwise this would be a job for css), highlighting on mouseover
searchOutput.addEventListener('mousemove', e => {
    searchSelection = parseInt(e.target.closest("a.searchresult").id);
    highlightSearchSelection();
});
