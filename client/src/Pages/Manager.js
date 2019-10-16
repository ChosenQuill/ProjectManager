import React, {useState} from "react";

import {AuthLevel, LevelCheck} from "../Auth";
import {Switch, Route, Redirect, useParams} from 'react-router-dom';
import {Button, Card, Form, Input, List, message, PageHeader, Popconfirm, Typography} from "antd";
import {gql} from 'apollo-boost';

import history from '../History'
import {useMutation, useQuery} from "@apollo/react-hooks";
import Loading from "../Components/Loading";

import './Manager.scss';
import ReactMarkdown from "react-markdown";

const {Title, Paragraph, Text} = Typography;

function Manager() {
    return (
        <LevelCheck level={AuthLevel.ADMIN} redirect={true}>
            <Switch>
                <Route exact path='/admin' component={Home}/>
                <Route path='/admin/:slug' component={Edit}/>
                <Route render={() => <Redirect to='/admin'/>}/>
            </Switch>
        </LevelCheck>
    );
}

const GET_PROJ = gql`
    query getProj($slug: String!) {
        project(slug: $slug) {
            name
            slug
            description
            visible
        }
    }
`

function Edit() {
    let {slug} = useParams();
    const {loading, error, data} = useQuery(GET_PROJ, {variables: {slug}});
    const [changesMade, setChanges] = useState(false);

    if (loading)
        return <Loading/>;
    else if (error) {
        message.error("There was an error finding your project.");
        console.log(error);
        return <Redirect to='/admin'/>;
    } else {
        if (!data.project) {
            message.error('We could not find the project you selected.');
            return <Redirect to={'/admin'}/>
        }

        const {project} = data;
        if (project.slug !== slug)
            return <Redirect to={'/admin/' + project.slug}/>;
        return (
            <Card className='card'>
                <Title level={2} editable={{onChange:(text)=>{project.title = text; setChanges(true);}}}>
                    {project.name}
                </Title>
                {
                    changesMade &&
                    <Button>
                        Save Changes
                    </Button>

                }
            </Card>
        )
    }
}


const GET_PROJS = gql`
    query getProjs {
        projects {
            name
            description
            slug
        }
    }
`;

let trimRE = /^(.{0,80})(?: |$)/;

function Projects() {
    const {loading, error, data} = useQuery(GET_PROJS);

    const [deleteProj] = useMutation(DELETE_PROJ,
        {
            refetchQueries: ['getProjs']
        });

    const deleteButton = (name) => {
        deleteProj({
            variables: {
                name: name,
            }
        }).then(value => {
            const result = value.data.Project.remove;
            if (result.completed)
                message.success('Project has been deleted!');
            else
                message.error(result.message);
        });
    };

    if (loading)
        return <Loading/>;
    else if (error) {
        message.error("There was an error grabbing the projects.");
        console.log(error);
        return <React.Fragment/>;
    } else {
        return (
            <React.Fragment>
                <List
                    header={<Title level={4}>
                        Projects
                    </Title>}
                    itemLayout="horizontal"
                    dataSource={data.projects}
                    renderItem={item => {
                        return (
                            <List.Item actions={[
                                <Button type='primary' shape='circle' icon='edit'
                                        onClick={() => history.push('admin/' + item.slug)}/>,
                                <Popconfirm onConfirm={() => deleteButton(item.name)}
                                            title='Are you sure you want to delete this project?'
                                            okText="Yes"
                                            cancelText="No"
                                            placement='topLeft'
                                >
                                    <Button type='danger' shape='circle' icon='delete'/>
                                </Popconfirm>
                            ]}>
                                <List.Item.Meta
                                    title={item.name}
                                />
                                <ReactMarkdown source={item.description}/>
                            </List.Item>
                        )
                    }}
                />
            </React.Fragment>
        )
    }
}

const ADD_PROJ = gql`
    mutation createProj($name: String!){
        Project(name: $name) {
            create{
                message
                completed
            }
        }
    }
`;

function CreateProject() {
    let name;

    const [addProj] = useMutation(ADD_PROJ,
        {
            refetchQueries: ['getProjs']
        });

    const onSubmit = () => {
        name.input.value = name.input.value.trim();
        if (!name.input.value) {
            message.error("Please fill all required fields");
        } else {
            addProj({
                variables: {
                    name: name.input.value,
                }
            }).then(value => {
                const data = value.data;
                if (data.Project.create.completed)
                    message.success('Project has been created!');
                else
                    message.error(data.Project.create.message);
            });
        }
    };


    return (
        <Card className='spaced'>
            <Paragraph strong>Create Project</Paragraph>
            <Input placeholder='Name' className='space' ref={(input) => name = input}/>
            <Button type="primary" htmlType="submit" className='space' onClick={onSubmit}>
                Submit
            </Button>
        </Card>
    );
}

const DELETE_PROJ = gql`
    mutation deleteProj($name: String!){
        Project(name: $name){
            remove {
                message
                completed
            }
        }
    }
`;

function Home() {

    return (
        <React.Fragment>
            <Card className='card'>
                <PageHeader onBack={() => history.push('/')} title="Home" subTitle="Main Admin Page">
                    <Projects/>
                    <br/>
                    <CreateProject/>
                </PageHeader>
            </Card>
        </React.Fragment>
    )
}

export default Manager;