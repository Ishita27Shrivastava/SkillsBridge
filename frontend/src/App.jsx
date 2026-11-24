import { useState, useEffect } from 'react';
import Auth from './Auth';
import './App.css';

const BASE_URL = 'https://skillsbridge-j1nn.onrender.com';

const API = `${BASE_URL}/api/auth`;
const PROJECTS_API = `${BASE_URL}/api/projects`;

function App() {
  const [showAuth, setShowAuth] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('Overview');
  const [newSkill, setNewSkill] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillMessage, setSkillMessage] = useState('');
  const [skillError, setSkillError] = useState(false);

  // Connections states
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  // Connection request states
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [requestLoadingId, setRequestLoadingId] = useState('');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState(false);

  // Projects states
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectMessage, setProjectMessage] = useState('');
  const [projectError, setProjectError] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState('');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    githubLink: '',
    liveLink: ''
  });

  const skills = Array.isArray(user?.skills) ? user.skills : [];

  // Update user data
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Fetch latest profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token || !user) return;

      try {
        const response = await fetch(`${API}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.user) {
          updateUser(data.user);
        }
      } catch (error) {
        console.error('Profile error:', error);
      }
    };

    fetchProfile();
  }, []);

  // Load students, connection requests and accepted connections
  const loadConnectionData = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setConnectionsError('Please login again.');
      return;
    }

    try {
      setConnectionsLoading(true);
      setRequestsLoading(true);
      setConnectionsError('');

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [usersResponse, requestsResponse, acceptedResponse] =
        await Promise.all([
          fetch(`${API}/users`, { headers }),
          fetch(`${API}/connections/requests`, { headers }),
          fetch(`${API}/connections`, { headers })
        ]);

      const [usersData, requestsData, acceptedData] = await Promise.all([
        usersResponse.json(),
        requestsResponse.json(),
        acceptedResponse.json()
      ]);

      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'Unable to load students');
      }

      if (!requestsResponse.ok) {
        throw new Error(requestsData.message || 'Unable to load requests');
      }

      if (!acceptedResponse.ok) {
        throw new Error(acceptedData.message || 'Unable to load connections');
      }

      const allUsers = Array.isArray(usersData.users) ? usersData.users : [];
      const otherStudents = allUsers.filter(
        student => student.email !== user?.email
      );

      setConnections(otherStudents);
      setReceivedRequests(
        Array.isArray(requestsData.receivedRequests)
          ? requestsData.receivedRequests
          : []
      );
      setSentRequests(
        Array.isArray(requestsData.sentRequests)
          ? requestsData.sentRequests
          : []
      );
      setAcceptedConnections(
        Array.isArray(acceptedData.connections)
          ? acceptedData.connections
          : []
      );
    } catch (error) {
      setConnectionsError(error.message);
    } finally {
      setConnectionsLoading(false);
      setRequestsLoading(false);
    }
  };

  // Fetch connection data when Connections tab opens
  useEffect(() => {
    if (activeTab === 'Connections' && user) {
      loadConnectionData();
    }
  }, [activeTab, user?.email]);

  // Send a connection request
  const handleSendRequest = async (studentId) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setRequestError(true);
      setRequestMessage('Please login again.');
      return;
    }

    try {
      setRequestLoadingId(studentId);
      setRequestMessage('');

      const response = await fetch(
        `${API}/connections/request/${studentId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send request');
      }

      setRequestError(false);
      setRequestMessage('Connection request sent successfully!');
      await loadConnectionData();
    } catch (error) {
      setRequestError(true);
      setRequestMessage(error.message);
    } finally {
      setRequestLoadingId('');
    }
  };

  // Accept or reject a received connection request
  const handleRequestResponse = async (requestId, status) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setRequestError(true);
      setRequestMessage('Please login again.');
      return;
    }

    try {
      setRequestLoadingId(requestId);
      setRequestMessage('');

      const response = await fetch(
        `${API}/connections/requests/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update request');
      }

      setRequestError(false);
      setRequestMessage(
        status === 'accepted'
          ? 'Connection request accepted!'
          : 'Connection request rejected.'
      );
      await loadConnectionData();
    } catch (error) {
      setRequestError(true);
      setRequestMessage(error.message);
    } finally {
      setRequestLoadingId('');
    }
  };

  // Search students by name, email or skill
  const filteredConnections = connections.filter(student => {
    const search = searchStudent.toLowerCase();

    return (
      student.name?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.skills?.some(skill =>
        skill.toLowerCase().includes(search)
      )
    );
  });

  // Load projects belonging to the logged-in user
  const loadProjects = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setProjectError(true);
      setProjectMessage('Please login again.');
      return;
    }

    try {
      setProjectsLoading(true);
      const response = await fetch(PROJECTS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load projects');
      }

      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (error) {
      setProjectError(true);
      setProjectMessage(error.message);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load projects whenever the Projects tab opens
  useEffect(() => {
    if (activeTab === 'Projects' && user) {
      loadProjects();
    }
  }, [activeTab, user?.email]);

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      technologies: '',
      githubLink: '',
      liveLink: ''
    });
    setEditingProjectId('');
    setShowProjectForm(false);
  };

  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    setProjectForm(previous => ({ ...previous, [name]: value }));
  };

  // Add or update a project
  const handleProjectSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setProjectError(true);
      setProjectMessage('Please login again.');
      return;
    }

    const payload = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      technologies: projectForm.technologies
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      githubLink: projectForm.githubLink.trim(),
      liveLink: projectForm.liveLink.trim()
    };

    if (!payload.title || !payload.description) {
      setProjectError(true);
      setProjectMessage('Project title and description are required.');
      return;
    }

    try {
      setProjectSaving(true);
      setProjectMessage('');

      const isEditing = Boolean(editingProjectId);
      const response = await fetch(
        isEditing ? `${PROJECTS_API}/${editingProjectId}` : PROJECTS_API,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save project');
      }

      setProjectError(false);
      setProjectMessage(
        isEditing ? 'Project updated successfully!' : 'Project added successfully!'
      );
      resetProjectForm();
      await loadProjects();
    } catch (error) {
      setProjectError(true);
      setProjectMessage(error.message);
    } finally {
      setProjectSaving(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project._id);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(', ')
        : '',
      githubLink: project.githubLink || '',
      liveLink: project.liveLink || ''
    });
    setShowProjectForm(true);
    setProjectMessage('');
  };

  const handleDeleteProject = async (projectId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this project?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setProjectError(true);
      setProjectMessage('Please login again.');
      return;
    }

    try {
      setProjectSaving(true);
      const response = await fetch(`${PROJECTS_API}/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete project');
      }

      setProjectError(false);
      setProjectMessage('Project deleted successfully!');
      await loadProjects();
    } catch (error) {
      setProjectError(true);
      setProjectMessage(error.message);
    } finally {
      setProjectSaving(false);
    }
  };

  // Login success
  const handleLoginSuccess = (loggedInUser) => {
    updateUser(loggedInUser);
    setShowAuth(false);
    setActiveTab('Overview');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAuth(false);
    setActiveTab('Overview');
    setConnections([]);
    setReceivedRequests([]);
    setSentRequests([]);
    setAcceptedConnections([]);
    setRequestMessage('');
    setProjects([]);
    setProjectMessage('');
    resetProjectForm();
  };

  // ADD SKILL
  const handleAddSkill = async (e) => {
    e.preventDefault();

    const skill = newSkill.trim();

    if (!skill) {
      setSkillError(true);
      setSkillMessage('Please enter a skill.');
      return;
    }

    if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setSkillError(true);
      setSkillMessage('This skill already exists!');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setSkillError(true);
      setSkillMessage('Please login again.');
      return;
    }

    try {
      setLoadingSkills(true);
      setSkillMessage('');

      const response = await fetch(`${API}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          skills: [skill]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add skill');
      }

      updateUser({
        ...user,
        skills: data.skills
      });

      setNewSkill('');
      setSkillError(false);
      setSkillMessage('Skill added successfully!');

    } catch (error) {
      setSkillError(true);
      setSkillMessage(error.message);
    } finally {
      setLoadingSkills(false);
    }
  };

  // DELETE SKILL
  const handleDeleteSkill = async (skill) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${skill}?`
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem('token');

    try {
      setLoadingSkills(true);
      setSkillMessage('');

      const response = await fetch(`${API}/skills`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skill })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete skill');
      }

      updateUser({
        ...user,
        skills: data.skills
      });

      setSkillError(false);
      setSkillMessage('Skill deleted successfully!');

    } catch (error) {
      setSkillError(true);
      setSkillMessage(error.message);
    } finally {
      setLoadingSkills(false);
    }
  };

  if (showAuth) {
    return (
      <Auth
        onBack={() => setShowAuth(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // DASHBOARD
  if (user) {
    const menuItems = [
      { name: 'Overview', icon: '▦' },
      { name: 'My Skills', icon: '💻' },
      { name: 'Connections', icon: '👥' },
      { name: 'Projects', icon: '📁' },
      { name: 'Opportunities', icon: '🚀' }
    ];

    return (
      <div className="dashboard-layout">

        <aside className="sidebar">
          <h2 className="logo">
            Skills<span>Bridge</span>
          </h2>

          <p className="sidebar-label">MAIN MENU</p>

          <div className="sidebar-menu">
            {menuItems.map(item => (
              <button
                key={item.name}
                className={`sidebar-link ${
                  activeTab === item.name ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveTab(item.name);
                  setSkillMessage('');
                  setSearchStudent('');
                }}
              >
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4>{user.name}</h4>
                <p>Student Account</p>
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              ↪ Logout
            </button>
          </div>
        </aside>

        <main className="dashboard-main">

          <header className="dashboard-topbar">
            <div>
              <p className="topbar-subtitle">STUDENT WORKSPACE</p>
              <h2>{activeTab}</h2>
            </div>

            <div className="topbar-profile">
              <div className="notification-icon">♧</div>
              <div className="avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4>{user.name}</h4>
                <p>Student</p>
              </div>
            </div>
          </header>

          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <p className="welcome-tag">WELCOME BACK 👋</p>
                  <h1>Hello, {user.name}!</h1>
                  <p>
                    Your journey to learn, connect and grow starts here.
                    Keep building your future with SkillsBridge.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setActiveTab('My Skills')}
                  >
                    Explore My Skills →
                  </button>
                </div>

                <div className="welcome-illustration">🚀</div>
              </section>

              <div className="section-heading">
                <div>
                  <h2>Your Overview</h2>
                  <p>Track your learning journey</p>
                </div>
              </div>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">💻</div>
                  <p>Total Skills</p>
                  <h2>{skills.length}</h2>
                  <span>Skills in your profile</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">👥</div>
                  <p>Connections</p>
                  <h2>{acceptedConnections.length}</h2>
                  <span>Accepted connections</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">📁</div>
                  <p>Projects</p>
                  <h2>0</h2>
                  <span>Projects added</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">🎯</div>
                  <p>Opportunities</p>
                  <h2>Explore</h2>
                  <span>Discover new possibilities</span>
                </div>
              </section>

              <section className="dashboard-content-grid">
                <div className="content-card">
                  <div className="card-heading">
                    <div>
                      <h3>My Skills</h3>
                      <p>Your current skill collection</p>
                    </div>
                    <button onClick={() => setActiveTab('My Skills')}>
                      View All →
                    </button>
                  </div>

                  {skills.length > 0 ? (
                    <div className="my-skills-list">
                      {skills.map((skill, index) => (
                        <span key={index} className="skill-badge">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span>💡</span>
                      <h4>No skills added yet</h4>
                      <p>Add your skills to build your student profile.</p>
                      <button
                        className="primary-button"
                        onClick={() => setActiveTab('My Skills')}
                      >
                        Explore Skills
                      </button>
                    </div>
                  )}
                </div>

                <div className="content-card profile-card">
                  <div className="card-heading">
                    <div>
                      <h3>My Profile</h3>
                      <p>Your account information</p>
                    </div>
                    <span className="profile-status">Active</span>
                  </div>

                  <div className="profile-details">
                    <div className="large-avatar">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <div className="profile-info">
                      <span>Account Type</span>
                      <strong>Student</strong>
                    </div>
                    <div className="profile-info">
                      <span>Listed Skills</span>
                      <strong>{skills.length}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="content-card opportunities-card">
                <div className="card-heading">
                  <div>
                    <h3>Explore Opportunities</h3>
                    <p>Take the next step in your learning journey</p>
                  </div>
                </div>

                <div className="opportunity-grid">
                  <div className="opportunity-item">
                    <span>🌐</span>
                    <h4>Web Development</h4>
                    <p>Build modern websites and applications.</p>
                  </div>

                  <div className="opportunity-item">
                    <span>☕</span>
                    <h4>Java Programming</h4>
                    <p>Improve your programming knowledge.</p>
                  </div>

                  <div className="opportunity-item">
                    <span>📊</span>
                    <h4>Data Analytics</h4>
                    <p>Learn to understand and analyze data.</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* MY SKILLS */}
          {activeTab === 'My Skills' && (
            <section className="content-card page-content">
              <div className="skills-page-heading">
                <div>
                  <h2>My Skills 💻</h2>
                  <p>Manage and grow your technical skills.</p>
                </div>
                <div className="skills-count">
                  {skills.length} Skills
                </div>
              </div>

              <form className="add-skill-form" onSubmit={handleAddSkill}>
                <input
                  type="text"
                  placeholder="Enter a skill (e.g. Java, React, Python)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  disabled={loadingSkills}
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loadingSkills}
                >
                  {loadingSkills ? 'Please wait...' : '+ Add Skill'}
                </button>
              </form>

              {skillMessage && (
                <p className={`skill-message ${
                  skillError ? 'error' : 'success'
                }`}>
                  {skillMessage}
                </p>
              )}

              <div className="skills-list-container">
                <h3>Your Technical Skills</h3>

                {skills.length > 0 ? (
                  <div className="managed-skills-list">
                    {skills.map((skill, index) => (
                      <div className="managed-skill" key={`${skill}-${index}`}>
                        <span className="managed-skill-name">
                          💻 {skill}
                        </span>

                        <button
                          className="delete-skill-button"
                          onClick={() => handleDeleteSkill(skill)}
                          disabled={loadingSkills}
                          type="button"
                          title="Delete skill"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>💡</span>
                    <h3>Your skill list is empty</h3>
                    <p>Add your first skill using the box above.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CONNECTIONS */}
          {activeTab === 'Connections' && (
            <section className="content-card page-content connections-page">

              <div className="connections-heading">
                <div>
                  <h2>Student Connections 👥</h2>
                  <p>
                    Discover students, send requests and grow your network.
                  </p>
                </div>

                <div className="connections-count">
                  {connections.length} Students
                </div>
              </div>

              {requestMessage && (
                <p className={`skill-message ${
                  requestError ? 'error' : 'success'
                }`}>
                  {requestMessage}
                </p>
              )}

              {/* Received Requests */}
              <div className="connection-request-section">
                <div className="connection-section-heading">
                  <div>
                    <h3>Received Requests</h3>
                    <p>Students who want to connect with you.</p>
                  </div>
                  <span className="connections-count">
                    {receivedRequests.length} Pending
                  </span>
                </div>

                {requestsLoading ? (
                  <p className="connection-muted">Loading requests...</p>
                ) : receivedRequests.length > 0 ? (
                  <div className="connections-grid">
                    {receivedRequests.map(request => (
                      <div className="student-card" key={request._id}>
                        <div className="student-card-top">
                          <div className="student-avatar">
                            {request.sender?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <span className="student-status">Request received</span>
                        </div>

                        <h3>{request.sender?.name || 'Student'}</h3>
                        <p className="student-email">{request.sender?.email}</p>

                        <div className="student-request-actions">
                          <button
                            type="button"
                            className="connect-button accept-button"
                            onClick={() => handleRequestResponse(request._id, 'accepted')}
                            disabled={requestLoadingId === request._id}
                          >
                            {requestLoadingId === request._id ? 'Please wait...' : '✓ Accept'}
                          </button>
                          <button
                            type="button"
                            className="connect-button reject-button"
                            onClick={() => handleRequestResponse(request._id, 'rejected')}
                            disabled={requestLoadingId === request._id}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="connection-muted">No pending received requests.</p>
                )}
              </div>

              {/* My Connections */}
              <div className="connection-request-section">
                <div className="connection-section-heading">
                  <div>
                    <h3>My Connections 🤝</h3>
                    <p>Students whose requests you have accepted or who accepted yours.</p>
                  </div>
                  <span className="connections-count">
                    {acceptedConnections.length} Connected
                  </span>
                </div>

                {acceptedConnections.length > 0 ? (
                  <div className="connections-grid">
                    {acceptedConnections.map(student => (
                      <div className="student-card" key={student._id}>
                        <div className="student-card-top">
                          <div className="student-avatar">
                            {student.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <span className="student-status connected-status">Connected ✓</span>
                        </div>
                        <h3>{student.name}</h3>
                        <p className="student-email">{student.email}</p>
                        <div className="student-skills">
                          <h4>Technical Skills</h4>
                          {student.skills?.length > 0 ? (
                            <div className="student-skill-tags">
                              {student.skills.map((skill, index) => (
                                <span key={`${skill}-${index}`}>{skill}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="no-student-skills">No skills added yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="connection-muted">You haven't connected with anyone yet.</p>
                )}
              </div>

              {/* Sent Requests */}
              <div className="connection-request-section">
                <div className="connection-section-heading">
                  <div>
                    <h3>Sent Requests</h3>
                    <p>Requests waiting for a response.</p>
                  </div>
                  <span className="connections-count">
                    {sentRequests.length} Pending
                  </span>
                </div>

                {sentRequests.length > 0 ? (
                  <div className="connections-grid">
                    {sentRequests.map(request => (
                      <div className="student-card" key={request._id}>
                        <div className="student-card-top">
                          <div className="student-avatar">
                            {request.receiver?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <span className="student-status pending-status">Request pending</span>
                        </div>
                        <h3>{request.receiver?.name || 'Student'}</h3>
                        <p className="student-email">{request.receiver?.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="connection-muted">You haven't sent any pending requests.</p>
                )}
              </div>

              {/* Student Directory */}
              <div className="connection-request-section">
                <div className="connection-section-heading">
                  <div>
                    <h3>Discover Students</h3>
                    <p>Find students and send them a connection request.</p>
                  </div>
                </div>

                <div className="connections-search">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name, email or skill..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                </div>

                {connectionsLoading ? (
                  <div className="empty-state">
                    <span>⏳</span>
                    <h3>Loading students...</h3>
                  </div>
                ) : connectionsError ? (
                  <div className="empty-state">
                    <span>⚠️</span>
                    <h3>{connectionsError}</h3>
                    <button
                      className="primary-button"
                      onClick={loadConnectionData}
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredConnections.length > 0 ? (
                  <div className="connections-grid">
                    {filteredConnections.map(student => {
                      const isConnected = acceptedConnections.some(
                        item => item._id === student._id
                      );
                      const outgoingRequest = sentRequests.find(
                        request => request.receiver?._id === student._id
                      );
                      const incomingRequest = receivedRequests.find(
                        request => request.sender?._id === student._id
                      );

                      return (
                        <div className="student-card" key={student._id}>
                          <div className="student-card-top">
                            <div className="student-avatar">
                              {student.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <span className="student-status">Student</span>
                          </div>

                          <h3>{student.name}</h3>
                          <p className="student-email">{student.email}</p>

                          <div className="student-skills">
                            <h4>Technical Skills</h4>

                            {student.skills?.length > 0 ? (
                              <div className="student-skill-tags">
                                {student.skills.map((skill, index) => (
                                  <span key={`${skill}-${index}`}>{skill}</span>
                                ))}
                              </div>
                            ) : (
                              <p className="no-student-skills">
                                No skills added yet.
                              </p>
                            )}
                          </div>

                          <div className="student-request-actions">
                            {isConnected ? (
                              <button className="connect-button connected-button" disabled>
                                ✓ Connected
                              </button>
                            ) : outgoingRequest ? (
                              <button className="connect-button pending-button" disabled>
                                Request Sent
                              </button>
                            ) : incomingRequest ? (
                              <button
                                className="connect-button accept-button"
                                onClick={() => handleRequestResponse(incomingRequest._id, 'accepted')}
                                disabled={requestLoadingId === incomingRequest._id}
                              >
                                {requestLoadingId === incomingRequest._id ? 'Please wait...' : 'Accept Request'}
                              </button>
                            ) : (
                              <button
                                className="connect-button"
                                onClick={() => handleSendRequest(student._id)}
                                disabled={requestLoadingId === student._id}
                              >
                                {requestLoadingId === student._id ? 'Sending...' : '+ Connect'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>🤝</span>
                    <h3>
                      {searchStudent
                        ? 'No students found'
                        : 'No other students registered yet'}
                    </h3>
                    <p>
                      {searchStudent
                        ? 'Try searching with another name or skill.'
                        : 'When other students register, they will appear here.'}
                    </p>
                  </div>
                )}
              </div>

            </section>
          )}

          {/* PROJECTS */}
          {activeTab === 'Projects' && (
            <section className="content-card page-content projects-page">
              <div className="skills-page-heading">
                <div>
                  <h2>My Projects 📁</h2>
                  <p>Showcase your work and achievements.</p>
                </div>
                <div className="skills-count">{projects.length} Projects</div>
              </div>

              {projectMessage && (
                <p className={`skill-message ${projectError ? 'error' : 'success'}`}>
                  {projectMessage}
                </p>
              )}

              <div className="projects-toolbar">
                <p>Manage your projects and share them with other students.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    if (showProjectForm) {
                      resetProjectForm();
                    } else {
                      setEditingProjectId('');
                      setProjectForm({
                        title: '',
                        description: '',
                        technologies: '',
                        githubLink: '',
                        liveLink: ''
                      });
                      setShowProjectForm(true);
                    }
                  }}
                >
                  {showProjectForm ? 'Cancel' : '+ Add Project'}
                </button>
              </div>

              {showProjectForm && (
                <form className="project-form" onSubmit={handleProjectSubmit}>
                  <h3>{editingProjectId ? 'Edit Project' : 'Add New Project'}</h3>

                  <label htmlFor="project-title">Project Title *</label>
                  <input
                    id="project-title"
                    name="title"
                    type="text"
                    placeholder="e.g. SkillsBridge"
                    value={projectForm.title}
                    onChange={handleProjectInputChange}
                    required
                  />

                  <label htmlFor="project-description">Description *</label>
                  <textarea
                    id="project-description"
                    name="description"
                    placeholder="Describe what your project does..."
                    value={projectForm.description}
                    onChange={handleProjectInputChange}
                    rows="4"
                    required
                  />

                  <label htmlFor="project-technologies">Technologies</label>
                  <input
                    id="project-technologies"
                    name="technologies"
                    type="text"
                    placeholder="React, Node.js, MongoDB"
                    value={projectForm.technologies}
                    onChange={handleProjectInputChange}
                  />
                  <small>Separate technologies with commas.</small>

                  <label htmlFor="project-github">GitHub Link</label>
                  <input
                    id="project-github"
                    name="githubLink"
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={projectForm.githubLink}
                    onChange={handleProjectInputChange}
                  />

                  <label htmlFor="project-live">Live Demo Link</label>
                  <input
                    id="project-live"
                    name="liveLink"
                    type="url"
                    placeholder="https://your-project.com"
                    value={projectForm.liveLink}
                    onChange={handleProjectInputChange}
                  />

                  <div className="project-form-actions">
                    <button type="submit" className="primary-button" disabled={projectSaving}>
                      {projectSaving
                        ? 'Saving...'
                        : editingProjectId ? 'Update Project' : 'Save Project'}
                    </button>
                    <button type="button" className="secondary-button" onClick={resetProjectForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {projectsLoading ? (
                <div className="empty-state">
                  <span>⏳</span>
                  <h3>Loading projects...</h3>
                </div>
              ) : projects.length > 0 ? (
                <div className="projects-grid">
                  {projects.map(project => (
                    <article className="project-card" key={project._id}>
                      <div className="project-card-heading">
                        <span className="project-icon">📁</span>
                        <span className="project-date">
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>

                      <h3>{project.title}</h3>
                      <p className="project-description">{project.description}</p>

                      {project.technologies?.length > 0 && (
                        <div className="project-technologies">
                          {project.technologies.map((technology, index) => (
                            <span key={`${technology}-${index}`}>{technology}</span>
                          ))}
                        </div>
                      )}

                      <div className="project-links">
                        {project.githubLink && (
                          <a href={project.githubLink} target="_blank" rel="noreferrer">
                            GitHub ↗
                          </a>
                        )}
                        {project.liveLink && (
                          <a href={project.liveLink} target="_blank" rel="noreferrer">
                            Live Demo ↗
                          </a>
                        )}
                      </div>

                      <div className="project-card-actions">
                        <button
                          type="button"
                          className="edit-project-button"
                          onClick={() => handleEditProject(project)}
                        >
                          ✏ Edit
                        </button>
                        <button
                          type="button"
                          className="delete-project-button"
                          onClick={() => handleDeleteProject(project._id)}
                          disabled={projectSaving}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>🚀</span>
                  <h3>No projects added yet</h3>
                  <p>Add your first project and showcase your work.</p>
                </div>
              )}
            </section>
          )}

          {/* OPPORTUNITIES */}
          {activeTab === 'Opportunities' && (
            <section className="content-card page-content">
              <h2>Opportunities 🚀</h2>
              <p>Discover areas where you can learn and grow.</p>

              <div className="opportunity-grid">
                <div className="opportunity-item">
                  <span>🌐</span>
                  <h4>Web Development</h4>
                  <p>Explore frontend and backend development.</p>
                </div>

                <div className="opportunity-item">
                  <span>☕</span>
                  <h4>Java Programming</h4>
                  <p>Strengthen your Java programming skills.</p>
                </div>

                <div className="opportunity-item">
                  <span>📊</span>
                  <h4>Data Analytics</h4>
                  <p>Explore data analysis and visualization.</p>
                </div>
              </div>
            </section>
          )}

          <footer className="dashboard-footer">
            © 2026 SkillsBridge. All Rights Reserved.
          </footer>
        </main>
      </div>
    );
  }

  // LANDING PAGE
  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">
          Skills<span>Bridge</span>
        </h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Explore Skills</a>
        </div>

        <div className="nav-buttons">
          <button className="login-btn" onClick={() => setShowAuth(true)}>
            Login
          </button>
          <button className="signup-btn" onClick={() => setShowAuth(true)}>
            Sign Up
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">LEARN • CONNECT • GROW</p>
          <h1>
            Build Skills.<br />
            Connect with <span>Opportunities.</span>
          </h1>
          <p className="description">
            SkillsBridge helps students discover new skills,
            connect with learners and build a better future.
          </p>
          <button
            className="get-started"
            onClick={() => setShowAuth(true)}
          >
            Get Started →
          </button>
        </div>

        <div className="hero-card">
          <div className="hero-icon">🚀</div>
          <h2>Your Skills, Your Future</h2>
          <p>Learn something new. Share what you know.</p>
          <div className="skill-tags">
            <span>Web Development</span>
            <span>Java</span>
            <span>Python</span>
            <span>Data Analytics</span>
          </div>
        </div>
      </section>

      <section className="features" id="about">
        <h2>Why Choose SkillsBridge?</h2>
        <p className="section-text">
          Everything you need to grow your skills in one place.
        </p>

        <div className="feature-grid" id="skills">
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Learn Skills</h3>
            <p>Discover and develop valuable technical skills.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Connect</h3>
            <p>Connect with students and like-minded learners.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Grow Together</h3>
            <p>Share your knowledge and improve every day.</p>
          </div>
        </div>
      </section>

      <footer>© 2026 SkillsBridge. All Rights Reserved.</footer>
    </div>
  );
}

export default App;
