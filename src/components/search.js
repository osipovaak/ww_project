import { Form, Input, Icon, Button, DatePicker, notification } from "antd";
import React, { Component } from "react";
import moment from 'moment';
import axios from "axios";
import cookie from 'react-cookies';

import CompleteResults from "./completeResults";
import makeAPISearch from "../helper/apiSearch";
import host from "../config";

import '../css/base.css';

let id = 0;

class SearchFDAForm extends Component {
    state = {
        queryResults: [],
        searchTerms: [],
        searchMade: false
    };

    componentDidUpdate (prevProps){
        //remove all Keys if new search is to be made
        if (this.props.visible !== prevProps.visible && this.props.visible === true) { 
            this.removeAll();
            this.setState({searchTerms:[], queryResults:[], searchMade: false}); //reset to original
        }
    };

    removeAll = () =>{
        const { form } = this.props;
        id++;
        form.setFieldsValue({
            foods: [id] //use all foods that don't equal the key of the food removed
        });
    };

    //handles user clicking "-" button to remove term
    remove = key => {
        const { form } = this.props;
        const foodKeys = form.getFieldValue('foods');

        if (foodKeys.length === 1) return;

        form.setFieldsValue({
            foods: foodKeys.filter(foodK => foodK !== key) //use all foods that don't equal the key of the food removed
        });
    };

    //add an item by adding a new key(based on id counter)
    add = () => {
        const { form } = this.props;
        const foods = form.getFieldValue('foods'); //all of the current foods
        const nFoods = foods.concat(++id); //add new item to foods arr

        form.setFieldsValue({ //setting new total list of foods
            foods: nFoods,
        });
    };

    //queries the FDA API for search terms submitted
    handleSubmit = event => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { totals, date } = values;
                const sucessCallback = (response) => {
                    this.setState({ queryResults: response.data.results }); //setting the results of query
                };
                const failCallback = (error) => {
                    this.setState({ queryResults: [] });
                };

                //making search based on inputs
                makeAPISearch(totals, date._d, sucessCallback, failCallback);

                this.setState({ searchTerms: totals, searchMade: true }); //registering all search terms
            }
        });

        event.preventDefault(); //are not actually submitting form
    };

    //submits save query to my DB 
    saveSearch = event => {
        event.preventDefault();

        const sessionID = cookie.load("sessionID");
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { totals, date, nickname } = values;

                if (nickname && nickname.length >= 100) { //makes sure that save name isn't too long (DB has a limit of 100 characters)
                    this.props.form.setFields({ nickname: { value: nickname, errors: [new Error('The value entered is too long. 100 characters limit.')] } });
                }
                else {
                    const foods = totals.filter(elem => elem != "");
                    const paramsForSave = {
                        params: {
                            sessionID: sessionID,
                            foods: foods.join(","),
                            date: date._d.getTime(),  //unix time stamp
                            name: nickname
                        }
                    }

                    axios.get(host + '/save', paramsForSave)
                        .then(response => {
                            if (response.data) this.openNotification(true);
                            else this.openNotification(false);
                        })
                        .catch(error => {
                            this.openNotification(false);
                            console.log(error);
                        });
                }
            }
        });
    };

    //notify user if save was successfull
    openNotification = success => {
        let msg;
        let description;

        if (success) {
            msg = "Save Sucessfull";
            description = "Your save was successfull! You can access your search history in 'Check Past Searches'.";
        }
        else {
            msg = "Error";
            description = "There was an error with your search";
        }

        notification.info({
            message: msg,
            description: description,
            placement: "bottomRight"
        });
    };

    render() {
        const now = new Date();
        const nowStr = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();

        const { getFieldDecorator, getFieldValue } = this.props.form;
        //visual things
        const formItemLayoutWithLabel = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 20 },
            }
        };
        const formItemLayoutWithOutLabel = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 20, offset: 4 },
            }
        };

        getFieldDecorator('foods', { initialValue: [id] }); //need at least 1 food serach term
        const totals = getFieldValue('foods'); //all values current in foor list
        const formItems = totals.map((k, index) => ( 
            <Form.Item {...(index === 0 ? formItemLayoutWithLabel : formItemLayoutWithOutLabel)}
                label={index === 0 ? 'Food name' : ''} required={"true"} key={k}>
                {getFieldDecorator(`totals[${k}]`, {
                    validateTrigger: ['onChange', 'onBlur'],
                    rules: [
                        {
                            required: true,
                            message: totals.length > 1 ? "Please input search term or delete this field." : "Please input search term",
                        }
                    ]
                })(<Input placeholder="search term" style={{ width: '60%', marginRight: 8 }} />)}
                {totals.length > 1 ? ( //drawing remove if more than one food entered
                    <Icon type="minus-circle-o" onClick={() => this.remove(k)} />
                ) : null}
            </Form.Item>
        ));

        return (<div>
            <div  className={"centered"}>
            <Form onSubmit={this.handleSubmit}>
                <Form.Item {...formItemLayoutWithLabel} label={"Search label"} required={false}
                    key={"nickname"} className={this.props.loggedIn ? "" : "hidden"}>
                    {getFieldDecorator("nickname", {
                        rules: [{ required: false }]
                    })(<Input placeholder={"search nickname"} style={{ width: '60%', marginRight: 8 }} />)}
                </Form.Item>
                {formItems}
                <Form.Item {...formItemLayoutWithOutLabel}>
                    <Button type="dashed" onClick={this.add} style={{ width: '60%' }}>
                        <Icon type="plus" /> Add search term
                </Button>
                </Form.Item>
                <Form.Item {...formItemLayoutWithLabel} label={"Date"} require={"false"} key={'date'}>
                    {getFieldDecorator('date',
                        {
                            rules: [{ type: 'object', required: false }],
                            initialValue: moment(nowStr, 'MM/DD/YYYY')
                        }
                    )(<DatePicker format={'MM/DD/YYYY'} />)}
                </Form.Item>
                <Form.Item {...formItemLayoutWithOutLabel}>
                    <Button type="primary" htmlType="submit" key='search' className={"searchBtn"}>
                        Search
                </Button>
                    <Button type="primary" htmlType="submit" key="save"
                        className={"searchBtn " + this.props.loggedIn ? "" : "hidden"}
                        disabled={!this.state.searchMade}
                        onClick={this.saveSearch}>
                        Save Search
                </Button>
                </Form.Item>
            </Form>
            </div>
            <CompleteResults searchTerms={this.state.searchTerms} results={this.state.queryResults} />
        </div>);
    }
}

const WrappedSearchFDAForm = Form.create({ name: 'dynamic_form_item' })(SearchFDAForm);
export default WrappedSearchFDAForm;