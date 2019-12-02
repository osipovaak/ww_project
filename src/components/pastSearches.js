import React, { Component } from "react";
import { Table, Button } from "antd";
import axios from "axios";
import cookie from 'react-cookies';

import CompleteResults from "./completeResults";
import makeAPISearch from "./../helper/apiSearch";
import host from "../config";


class PastSearches extends Component {
    //standard columns for history table
    tableColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date'
        }, {
            title: 'Search Criteria',
            dataIndex: 'search',
            key: 'search'
        }, {
            title: 'Recheck',
            dataIndex: 'redo',
            key: 'redo',
            render: (text, column) => {
                return (<Button onClick={() => {
                    this.redoAPISearch(column.search, column.d2); //on click, redo FDA API search with terms in this row
                }}>
                    {"Recheck Results"}
                </Button>);
            },
        }
    ];

    state = {
        searchTerms: [],
        searchResults: [],
        historySearch: []
    };

    //since we do not need any information from any component or user, 
    //original search can be made on mount
    componentDidMount() {
        this.makeFullSearch();
    };

    //every time component becomes visible, update it/query the DB for history
    componentDidUpdate(prevProps) {
        if (this.props.visible !== prevProps.visible && this.props.visible === true) {
            this.makeFullSearch();
        }
    }

    //ask DB for entire history of searches
    makeFullSearch = () => {
        const session = cookie.load("sessionID");

        axios.get(host + '/history', { params: { sessionID: session } })
            .then(response => {
                if (response.data) {
                    const sorted = response.data.sort((a, b) => {
                        if (a.id < b.id) return 1;
                        else if (a.id > b.id) return -1;
                        return 0;
                    });
                    this.setState({ historySearch: sorted });
                }
            })
            .catch(error => {
                console.log(error);
            });
    };

    //takes data from DB and constructs nice table
    constructTable = (dataArr) => {
        let toReturn = [];

        dataArr.forEach((element, i) => {
            const searchTerms = element.search_crit;
            const date = new Date(element.search_date);
            const nick = element.search_name;
            const printDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

            toReturn.push({
                key: i,
                date: printDate + (nick ? (" (" + nick + ")") : ""),
                search: searchTerms,
                d2: element.search_date,
                redo: ""
            });
        });

        return toReturn;
    };

    //query FDA API for selected search terms
    redoAPISearch = (searchTerms, date) => {
        const dateObj = new Date(date);
        const sucessCallback = (response) => {
            let responseArr = !response.data ? [] : response.data.results;
            this.setState({ searchResults: responseArr, searchTerms: searchTerms.split(",") }); //setting the results of query
        };

        const failCallback = (error) => {
            this.setState({ searchResults: [], searchTerms: searchTerms.split(",") }); //setting the results of query
        };

        makeAPISearch(searchTerms.split(","), dateObj, sucessCallback, failCallback);
    };

    render() {
        const tableDataPrepped = this.constructTable(this.state.historySearch);

        return (<div>
            <CompleteResults results={this.state.searchResults} searchTerms={this.state.searchTerms} key={0}/>
            <br/> <br/>
            <h2>{"History of searches"}</h2>
            <Table columns={this.tableColumns} dataSource={tableDataPrepped} size={"small"} />
        </div>);
    };
};

export default PastSearches;