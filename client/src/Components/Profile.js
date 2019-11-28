import React from "react";
import './Profile.scss';
import {AuthApi} from "../Auth";
import {gql} from 'apollo-boost';

const GET_PROFILE = gql`
    query getProfile {
        me {
            name
            avatarUrl
        }
    }
`;


function Profile() {

    if (AuthApi.getToken()) {

    }
    return (
        <div className='box'>
            TEST
        </div>
    );
}

export default Profile;