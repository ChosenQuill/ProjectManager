import React from "react";
import './Profile.scss';
import {AuthApi} from "../Auth";
import {useQuery} from "@apollo/react-hooks";

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
            {
                Test
            }
        </div>
    );
}

export default Profile;