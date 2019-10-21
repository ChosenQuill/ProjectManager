import React, {useEffect, useState} from "react";

import {AuthLevel, LevelCheck, LevelManager} from "../Auth";
import {Switch, Route, Redirect, useParams} from 'react-router-dom';
import {Button, Card, Form, Input, List, message, PageHeader, Popconfirm, Typography, Menu, Layout, Icon} from "antd";
import {gql} from 'apollo-boost';

import history from '../History'
import {useMutation, useQuery} from "@apollo/react-hooks";
import Loading from "../Components/Loading";

import './Manager.scss';
import ReactMarkdown from "react-markdown";
import slugify from "slugify";

const {Title, Paragraph, Text} = Typography;
const {SubMenu} = Menu;
const {Header, Content, Footer, Sider} = Layout;


function Manager() {
    const [selectedKeys, setSelected] = useState(['home']);

    return (
        <LevelManager>
            <LevelCheck level={AuthLevel.ADMIN} redirect={true}>
                <ManagerSider selected={selectedKeys} setSelected={setSelected}/>
                <Content>
                    <Switch>
                        <Route exact path='/home' render={(props) => <Home setSelected={setSelected} {...props}/>}/>
                        <Route path='/project/:slug' render={(props) => <Edit setSelected={setSelected} {...props} />}/>
                        <Route path='/settings' render={(props) => <Settings setSelected={setSelected} {...props} />}/>
                        <Route render={() => <Redirect to='/home'/>}/>
                    </Switch>
                </Content>

            </LevelCheck>
        </LevelManager>
    );
}


function Settings(props) {
    useEffect(() => props.setSelected(['settings']), []);

    return (
        <Card className='card'>
            <PageHeader onBack={() => history.push('/home')} title="Settings" subTitle="Change your info">
                Some settings here..
            </PageHeader>
        </Card>
    )

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

function ManagerSider(props) {
    const {loading, error, data} = useQuery(GET_PROJS);
    const {selected, setSelected} = props;
    return (
        <Sider width={200} style={{background: '#'}}>
            <Menu
                mode="inline"
                defaultSelectedKeys={['home']}
                // defaultOpenKeys={['projects']}
                style={{height: '100%'}}
                onClick={param => {
                    if (param.key.startsWith('proj_')) {
                        history.push('/project/' + param.key.substr(5));
                    } else {
                        history.push('/' + param.key);
                    }
                }}
                selectedKeys={selected}
            >
                <Menu.Item
                    key="home"
                >
                    <Icon type="home"/>
                    Home
                </Menu.Item>
                <SubMenu
                    key="projects"
                    title={
                        <span>
                  <Icon type={loading ? 'loading' : 'laptop'}/>
                  Projects
                </span>
                    }
                    disabled={(error)}
                >
                    {
                        (!loading && !error) &&
                        data.projects.map((proj) => {
                            return (
                                <Menu.Item key={'proj_' + proj.slug}>
                                    {proj.name}
                                </Menu.Item>
                            );
                        })

                    }
                </SubMenu>
                <Menu.Item
                    key="settings"
                >
                    <Icon type="setting"/>
                    Settings
                </Menu.Item>
            </Menu>
        </Sider>
    );
}

// let trimRE = /^(.{0,80})(?: |$)/;

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
                                        onClick={() => history.push('project/' + item.slug)}/>,
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


const GET_PROJ = gql`
    query getProj($slug: String!) {
        project(slug: $slug) {
            name
            slug
            description
            visible
        }
    }
`;

const UPDATE_PROJ = gql`
    mutation updateProj($name:String!,$data:ProjectInput! ) {
        Project(name:$name){
            update(data:$data) {
                completed
                message
            }
        }
    }
`;

const RENAME_PROJ = gql`
    mutation renameProj($name:String!,$newname:String! ){
        Project(name:$name){
            rename(name:$newname){
                completed
                message
            }
        }
    }
`;

function Edit(props) {
    let {slug} = useParams();
    const {loading, error, data, refetch} = useQuery(GET_PROJ, {variables: {slug}});

    const [changesMade, setChanges] = useState(false);
    const [project, setProject] = useState({});

    const [updateProj] = useMutation(UPDATE_PROJ, {
        refetchQueries: ['getProj']
    });
    const [renameProj] = useMutation(RENAME_PROJ, {
        refetchQueries: ['getProjs']
    });

    useEffect(() => {
        props.setSelected(['projects', 'proj_' + slug]);
        if(project && project.slug !== slug){
            refetch().then(()=>setProject({}));
        }
    }, [slug]);


    const saveChanges = () => {

        setChanges(false);
    };

    const changeName = (newName) => {
        if(project.name === newName)
            return;
        renameProj({
            variables: {
                name: project.name,
                newname: newName,
            }
        }).then(value => {
            const data = value.data;
            if (data.Project.rename.completed) {
                message.success('Project has been renamed!');
                history.replace('/project/' + slugify(newName));
            } else
                message.error(data.Project.rename.message);

        });
    };

    if (loading)
        return (
            <Card className='card'>
                <Loading />
            </Card>
        );
    else if (error) {
        message.error("There was an error finding your project.");
        console.log(error);
        return <Redirect to='/home'/>;
    } else {
        if (Object.keys(project).length === 0) {
            if (!data.project) {
                message.error('We could not find the project you selected.');
                return <Redirect to={'/home'}/>
            } else
            setProject({...data.project});
        }
        // if (project.slug !== slug)
        //     return <Redirect to={'/home/' + project.slug}/>;
        return (
            <Card className='card'>
                <Title level={2} editable={{
                    onChange: (text) => changeName(text)
                }}>
                    {project.name}
                </Title>
                <Input.TextArea defaultValue={project.description} onChange={event => {
                    if(!changesMade)
                        setChanges(true);

                }}/>

                {
                    <Button type='primary' disabled={!changesMade} onClick={saveChanges} style={{marginTop: '14px'}} >
                        Save Changes
                    </Button>

                }
            </Card>
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

function Home(props) {
    useEffect(() => {
        props.setSelected(['home'])
    }, []);

    return (
        <React.Fragment>
            <Card className='card'>
                <PageHeader title="Home" subTitle="Manage Projects Here">
                    <Projects/>
                    <br/>
                    <CreateProject/>
                </PageHeader>
            </Card>
        </React.Fragment>
    )
}

export default Manager;