import axios from "axios";
import { fail } from "assert";

const urlPrefix = "https://api.fda.gov/food/enforcement.json?";
const key = "api_key=c8zNxfqblaDBKFJXnO27NHOuA6E5tiVk0rKvrnZm";
const limit = 100;

//forms and submits query to FDA API
// on result, will call the callbacks passed in
export default function makeAPISearch(foods, date, sucessCallback, failCallback) {
    let searchQuery = "search=(product_description:";
    const properMonth = ((date.getMonth() + 1) < 10 ? ("0" + (date.getMonth() + 1)) : (date.getMonth() + 1));
    const properDay = (date.getDate() < 10 ? ("0" + date.getDate()) : date.getDate() + 1);

    foods.forEach((searchTerm, i) => {
        if (i > 0) searchQuery += "+";

        searchQuery += searchTerm;
    });
    searchQuery += ")+AND+report_date:["
        + (date.getFullYear() - 5) + (properMonth) + (properDay)
        + "+TO+"
        + (date.getFullYear()) + (properMonth) + (properDay) + "]";

    //construct and send request
    axios.get(urlPrefix + key + "&" + searchQuery + "&sort=report_date:desc&limit=" + limit)
        .then(response => {
            if (sucessCallback)
                sucessCallback(response);
        })
        .catch(error => {
            if(failCallback)
                failCallback(error);
        });
};