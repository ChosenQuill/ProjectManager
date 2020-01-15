import React, {useEffect, useState} from "react";

import {AuthApi, AuthLevel, LevelCheck, PermissionCheck, RoleCheck} from "../Auth";
import {Redirect, Route, Switch, useParams} from 'react-router-dom';
import {Button, Card, Icon, Input, Layout, List, Menu, message, PageHeader, Popconfirm, Typography} from "antd";
import {gql} from 'apollo-boost';

import history from '../History'
import {useMutation, useQuery} from "@apollo/react-hooks";
import Loading from "../Components/Loading";
import './Manager.scss';
import ReactMarkdown from "react-markdown";

const {Title, Paragraph, Text} = Typography;
const {SubMenu} = Menu;
const {Header, Content, Footer, Sider} = Layout;


function Manager() {
    const [selectedKeys, setSelected] = useState(['home']);
    useEffect(() => {
        if (!AuthApi.getToken()) {
            AuthApi.logout();
        }
    }, []);

    return (
        <RoleCheck name='USER'>
            <ManagerSider selected={selectedKeys} setSelected={setSelected}/>
            <Content>
                <Switch>
                    <Route exact path='/home' render={(props) =><Home setSelected={setSelected} {...props}/>}/>
                    <Route path='/project/:id' render={(props) => <Edit setSelected={setSelected} {...props} />}/>
                    <Route path='/settings' render={(props) => <Settings setSelected={setSelected} {...props} />}/>
                    <Route render={() => <Redirect to='/home'/>}/>
                </Switch>
            </Content>
        </RoleCheck>
    );
}


function Settings(props) {
    useEffect(() => props.setSelected(['settings']), []);

    return (
        <Card className='card'>
            <PageHeader onBack={() => history.push('/home')} title="Settings" subTitle="Change your info">
                <Paragraph>
                    <Text>
                        Name:
                    </Text>
                    <Input maxLength={4}/>
                </Paragraph>
                <Button type='danger'>Delete Your Account</Button>
            </PageHeader>
        </Card>
    )

}

// TODO Add whitelist settings page

const GET_PROJS = gql`
    query getProjs {
        projects {
            name
            description
            id
        }
    }
`;

function ManagerSider(props) {
    const {loading, error, data} = useQuery(GET_PROJS);
    const {selected, setSelected} = props;

    return (
        <Sider width={200} style={{background: '#', marginBottom: '-70px'}}>
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
                                <Menu.Item key={'proj_' + proj.id}>
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

// let trimRE = /^(.{0,80})(?: |$)/; //Regex for trimming description length down

function Projects() {
    const {loading, error, data} = useQuery(GET_PROJS);

    const [deleteProj] = useMutation(DELETE_PROJ,
        {
            refetchQueries: ['getProjs']
        });

    const deleteButton = (id) => {
        deleteProj({
            variables: {
                id: id,
            }
        }).then(value => {
            message.success('Project has been deleted!');
        }).catch(err => {
            console.log(err);
            if (err.graphQLErrors) {
                message.error(err.graphQLErrors[0].message);
            } else {
                message.error(err.message);
            }
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
                                        onClick={() => history.push('project/' + item.id)}/>,
                                <Popconfirm onConfirm={() => deleteButton(item.id)}
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
                    footer={(
                        <React.Fragment>
                            <Input />
                        </React.Fragment>
                    )}
                />
            </React.Fragment>
        )
    }
}


const GET_PROJ = gql`
    query getProj($id: String!) {
        project(projectID: $id) {
            id
            name
            description
            visible
        }
    }
`;

const UPDATE_PROJ = gql`
    mutation updateProj($id:String!,$data:ProjectInput! ) {
        Project(projectID:$id){
            update(data:$data)
        }
    }
`;

const DELETE_PROJ = gql`
    mutation deleteProj($id: String!){
        Project(projectID: $id){
            remove
        }
    }
`;


function Edit(props) {
    let {id} = useParams();
    const {loading, err, data, refetch} = useQuery(GET_PROJ, {variables: {id}});

    const [changesMade, setChanges] = useState(false);
    const [project, setProject] = useState({});
    const [map] = useState(new Map());

    const [updateProj] = useMutation(UPDATE_PROJ, {
        refetchQueries: ['getProj']
    });

    useEffect(() => {
        props.setSelected(['projects', 'proj_' + id]);
        if (map.size > 0)
            map.clear();
        if (project && project.id !== id) {
            refetch().then(() => setProject({})).catch(err => {
                console.log("Error refreshing");
            });
        }
    }, [id]);


    const saveChanges = () => {
        if (map.size === 0) {
            message.error('No changes were made.');
            setChanges(false);
            return;
        }
        let changes = [...map.entries()].reduce((obj, [key, value]) => (obj[key] = value, obj), {});
        updateProj({
            variables: {
                id: project.id,
                data: changes,
            }
        }).then(() => {
            message.success('Changes have been saved!');
            map.clear();
        }).catch(err => {
            console.log("Error Updating");
        });
        setChanges(false);
    };

    const change = (property, value) => {
        if (project[property] === value || (map.has(property) && map.get(property) === value))
            return;
        if (!changesMade)
            setChanges(true);
        map.set(property, value);
    };

    if (loading)
        return (
            <Card className='card'>
                <Loading/>
            </Card>
        );
    else if (err) {
        if (err.graphQLErrors) {
            message.error(err.graphQLErrors[0].message);
        } else {
            message.error(err.message);
        }
        console.log(err);
        return <Redirect to='/home'/>;
    } else {
        if (Object.keys(project).length === 0) {
            setProject({...data.project});
        }
        return (
            <Card className='card'>
                <Title level={2} editable={{
                    onChange: (text) => {
                        change('name', text);
                        setProject({...project, name: text});
                    }
                }}>
                    {project.name}
                </Title>
                <Input.TextArea value={project.description} onChange={event => {
                    setProject({...project, description: event.target.value});
                    change('description', event.target.value);
                }}/>

                {
                    <Button type='primary' disabled={!changesMade} onClick={saveChanges} style={{marginTop: '14px'}}>
                        Save Changes
                    </Button>

                }
            </Card>
        )
    }
}


const ADD_PROJ = gql`
    mutation createProj($name: String!){
        Project(projectID: null) {
            create(name: $name)
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
            }).then(() => {
                message.success('Project has been created!');
            }).catch(err => {
                message.error(err.graphQLErrors[0].message);
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