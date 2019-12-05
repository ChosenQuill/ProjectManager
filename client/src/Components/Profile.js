import React, {useEffect} from "react";
import './Profile.scss';
import {AuthApi, useRole} from "../Auth";
import {gql} from 'apollo-boost';
import {Dropdown, Icon, Menu, message} from 'antd';
import {useLazyQuery} from "@apollo/react-hooks";
import history from '../History'

const GET_PROFILE = gql`
    query getProfile {
        me {
            name
            avatarUrl
        }
    }
`;

const menu = (
    <Menu>
        <Menu.Item onClick={()=>history.push('/settings')}>
            <Icon type='setting'/>
            Settings
        </Menu.Item>
        <Menu.Divider/>
        <Menu.Item onClick={()=>AuthApi.logout()}>
            <Icon type='poweroff'/>
            Logout
        </Menu.Item>
    </Menu>
);


function Profile() {
    const role = useRole();
    const [query, {loading, error, data, called}] = useLazyQuery(GET_PROFILE);

    useEffect(()=>{
        console.log(role.status);
        if(role.status === 'SUCCESS' && role.role === 'USER') {
            query();
        }
    },[role]);

    if(called && !loading) {
        if(error){
            message.error(error.message);
        }
        else {
            console.log(data);
            return (
                <Dropdown overlay={menu}>
                    <div className='box'>
                        <img src={data.me.avatarUrl} alt='Profile' style={{width: '40px', marginRight: '12px', borderRadius: '20px'}}/>
                        {data.me.name}
                    </div>
                </Dropdown>

            )
        }

    }

    return (
        <div className='box' onClick={()=>AuthApi.login()}>
            Login
        </div>
    );
}

export default Profile;