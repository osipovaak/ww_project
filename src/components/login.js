import React, { Component } from 'react';

import { Form, Input, Button } from "antd";

import axios from "axios";

import CryptoJS from "crypto-js";
import sha256 from "crypto-js/sha256";
import cookie from "react-cookies";

import host from "../config";

//handles loging into system
class HorizontalLoginForm extends Component {
  handleSubmit = event => {
    this.props.form.validateFields((err, values) => {
      if (!err) { //if no error, try to login
        const { username, password } = values;
        const passEncrypted = sha256(password);
        const passEncString = passEncrypted.toString(CryptoJS.enc.Base64);

        //try to get the data from DB. respond appropriately
        axios.get(host + '/login', { params: { user: username, pass: passEncString } })
          .then(response => { //need to set the a cookie for session id and update parent's state
            if (response.data !== "") {
              let d = new Date();
              d.setDate(Date.now() + 1000 * 60 * 60 * 24); //expiration in a day

              cookie.save("sessionID", response.data, { expires: d });
              cookie.save("user", username, { expires: d });

              this.props.form.setFields({ password: { value: "" }, username: { value: "" } });

              this.props.onLoggedIn(username);
            }
            else { //notify user of invalid password
              this.props.form.setFields({ password: { value: password, errors: [new Error('Invalid username or password')] } });
            }
          })
          .catch(error => {
            console.log(error);
            this.props.form.setFields({ username: { value: username, errors: [new Error('Issue communicating with the server')] } });
          });
      }
    });
    event.preventDefault();
  };

  render() {
    const { getFieldDecorator, getFieldsError } = this.props.form;

    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <Form.Item>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: 'Please input your username!' }],
          })(
            <Input placeholder="Username" />,
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: 'Please input your Password!' }],
          })(
            <Input type="password" placeholder="Password" />,
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Log in
            </Button>
        </Form.Item>
      </Form>
    );
  }
}

const WrappedLogin = Form.create({ name: 'horizontal_login' })(HorizontalLoginForm);
export default WrappedLogin;