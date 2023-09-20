// Check if the URL contains query parameters
const url = new URL(window.location.href);
const searchQuery = url.searchParams.get('searchQuery');
const minPrice = url.searchParams.get('minPrice');
const maxPrice = url.searchParams.get('maxPrice');

// Check if any of the query parameters are present and not empty
if (searchQuery || minPrice || maxPrice) {
    // Clear the query parameters
    url.searchParams.delete('searchQuery');
    url.searchParams.delete('minPrice');
    url.searchParams.delete('maxPrice');

    // Replace the URL without query parameters
    window.history.replaceState({}, document.title, url);
}