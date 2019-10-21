import  {Typography, Col, Row, Spin} from "antd";
import React from "react";

export default function (props) {
    return (
        <Row>
            <Col style={{textAlign: 'center'}}>
                <Spin size='large'/>
                <Typography.Text strong={true} style={{
                    marginLeft: '10px',
                    fontSize: '24px'
                }}>
                    Loading
                </Typography.Text>
            </Col>
        </Row>
    );
}