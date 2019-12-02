import React from "react";
import { Collapse, Badge } from "antd";

const { Panel } = Collapse;

//renders panel with results of search
function CompleteResults(props) {
    const createPanel = (term) => {
        let allResults = [];
        for (const res of props.results) {
            //since strings can be all kinds of cases and so can input be
            if (res.product_description.toLowerCase().indexOf(term.toLowerCase()) > 0)
                allResults.push(res);
        }

        const generateList = (info) => {
            let recallStr = info.recall_initiation_date;
            if (recallStr.length >= 8)
                recallStr = recallStr.substring(0, 4) + "-" + recallStr.substring(4, 6) + "-" + recallStr.substring(6, 8);
            let termStr = info.termination_date ? info.termination_date : "";
            if (termStr.length >= 8)
                termStr = termStr.substring(0, 4) + "-" + termStr.substring(4, 6) + "-" + termStr.substring(6, 8);

            return (<div>
                {`Date of Recall: ${recallStr}`} <br/>
                {`Address: ${info.address_1}${info.address_2}, ${info.city}, ${info.state} ${info.postal_code}`} <br/>
                {`Termination Date: ${termStr}`} <br/>
                {`Product Description: ${info.product_description}`} <br/>
                {`Reason for recall: ${info.reason_for_recall}`} <br/> <br/>
            </div>);
        };

        return (
            <Panel showArrow={allResults.length ? true : false} header={<h4>{term} {allResults.length ? <Badge count={allResults.length} /> : " - All Clear!"}</h4>} key={term}>
                {allResults.map((res) => generateList(res))}
            </Panel>
        )
    };

    return ( //dynamically create a panel for every search term
        <Collapse>
            {props.searchTerms.map((term) => createPanel(term))}
        </Collapse>
    );
};

export default CompleteResults;