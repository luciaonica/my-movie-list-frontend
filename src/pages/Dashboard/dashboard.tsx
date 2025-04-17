import { useEffect, useState } from "react";
import "./dashboard.css";
import { Link } from "react-router-dom";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import BallotIcon from "@mui/icons-material/Ballot";
import ForumIcon from "@mui/icons-material/Forum";
import SearchIcon from "@mui/icons-material/Search";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import axios from "axios";
import { decodeToken, userJwt } from "../../utils/jwt";
import { deleteCommentOnWatchlist, getAllWatchlistComments, getAllWatchlistsAdmins, getUsers, updateBanStatus } from "../../utils/databaseCalls";
import { BASE_ROUTE } from "../../utils/config";

const TOKEN = window.localStorage.getItem("token") || '';
const admin = decodeToken(TOKEN) as userJwt;

type Section = "dashboard" | "users" | "watchlists" | "comments";

interface CommentData {
  commentId: string;
  comment: string;
  datePosted: string;
  userId: string;
  username: string;
  watchlistId: string;
  watchlistName: string;
}

interface UserData {
  username: string;
  email: string;
  biography: string;
  preferredGenres: string[];
  friends: string[];
  signedUrl: string;
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
}

interface WatchlistData {
  listId: string;
  listName: string;
  userId: string;
  username: string;
  comments: string[];
  likes: string[];
  titles: string[];
  collaborators: string[];
  isPublic: boolean;
  posterUrl?: string;
}

function dashboard() {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSearchTerm(""); // Reset search input whenever the section changes
  }, [section]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, usersRes, watchlistRes] = await Promise.all([
          getAllWatchlistComments(),
          getUsers(),
          getAllWatchlistsAdmins(),
        ]);

        const enrichedWatchlists = await Promise.all(
          watchlistRes?.data.map(async (watchlist: WatchlistData) => {
            if (watchlist.titles.length > 0) {
              const firstTitleId = watchlist.titles[0];
              try {
                const res = await axios.get(
                  `${BASE_ROUTE}/watchmode/title/${firstTitleId}`
                );
                return {
                  ...watchlist,
                  posterUrl: res.data.poster, // assuming response has posterUrl
                };
              } catch (error) {
                console.error(`Failed to fetch title ${firstTitleId}:`, error);
                return {
                  ...watchlist,
                  posterUrl: "/src/assets/Images/default-title-image.png",
                };
              }
            } else {
              return {
                ...watchlist,
                posterUrl: "/src/assets/Images/default-title-image.png",
              };
            }
          })
        );

        if (commentsRes && usersRes && watchlistRes) {
          setComments(commentsRes.data);
          setUsers(usersRes.data);
          setWatchlists(enrichedWatchlists);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleBanToggle = async (
    userId: string,
    isCurrentlyBanned: boolean
  ) => {
    try {
      const banStatus = isCurrentlyBanned ? "unbanned" : "banned";
      await updateBanStatus(userId, banStatus);

      // Update user state locally after ban/unban
      setUsers((prev) =>
        prev.map((user) =>
          user.userId === userId
            ? { ...user, isBanned: !isCurrentlyBanned }
            : user
        )
      );
    } catch (error) {
      console.error("Failed to toggle ban:", error);
    }
  };

  const handleDeleteComment = async (listId: string, commentId: string) => {
    try {
      await deleteCommentOnWatchlist(listId, commentId);

      // Remove the comment from state
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.commentId !== commentId)
      );
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const adminProfile = users.find((user) => user.userId === admin?.userId);
  const adminProfilePicture =
    adminProfile?.signedUrl || "/src/assets/Images/default-profile.jpg";

    const filteredUsers = users.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredWatchlists = watchlists.filter((w) =>
      w.listName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredComments = comments.filter((c) =>
      c.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      <div className="dashboard">
        <div className="sidebar">
          <div className="logo">
            <MovieFilterIcon className="logo-icon" />
            <h2>My Movie List</h2>
          </div>
          <div className="menu">
            <div className="item" onClick={() => setSection("dashboard")} data-testid="sidebar-dashboard">
              <HomeIcon className="icon" />
              Dashboard
            </div>
            <div className="item" onClick={() => setSection("users")} data-testid="sidebar-users">
              <GroupIcon className="icon" />
              Users
            </div>
            <div className="item" onClick={() => setSection("watchlists")} data-testid="sidebar-watchlists">
              <BallotIcon className="icon" />
              Watchlists
            </div>
            <div className="item" onClick={() => setSection("comments")} data-testid="sidebar-comments">
              <ForumIcon className="icon" />
              Comments
            </div>
          </div>
        </div>

        <div className="main">
          <div className="main-header">
            <h1 className="header-title" data-testid="header-title">
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h1>
            <div className="header-activity">
              <div className="search-box">
                <input type="text" placeholder="Search..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                <SearchIcon className="icon" />
              </div>
            </div>
          </div>
          {/* <div className="admin-main-content"> */}
          {section === "dashboard" && (
            <div className="dashboard-widgets">
              <div className="content-users-watchlists">
                <div className="content-users">
                  <div className="content-title" data-testid="dashboard-users">Users</div>
                  <div className="users-list">
                    {users.slice(0, 3).map((item) => (
                      <div className="user-item" key={item.userId}>
                        <div className="user-display">
                          <img
                            src={
                              item.signedUrl
                                ? item.signedUrl
                                : "/src/assets/Images/default-profile.jpg"
                            }
                            alt="user photo"
                          />
                        </div>
                        <div className="user-username">
                          <a
                            href="#"
                            className="user-username"
                            onClick={(e) => {
                              e.preventDefault();
                              const user = users.find(
                                (u) => u.userId === item.userId
                              );
                              if (user) {
                                setSelectedUser(user);
                                setShowUserPopup(true);
                              }
                            }}
                            style={{
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {item.username}
                          </a>
                        </div>
                      </div>
                    ))}
                    <div className="view-more">
                      <div
                        className="view-more-link"
                        style={{ cursor: "pointer", color: "#526d82" }}
                        onClick={() => setSection("users")}
                      >
                        View More →
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-watchlists">
                  <div className="content-title" data-testid="dashboard-watchlists">Watchlists</div>
                  <div className="watchlist-grid">
                    {watchlists.slice(0, 3).map((list) => (
                      
                      <div className="watchlist-card" key={list.listId}>
                        <Link to={`/watchlist/${list.listId}`}>
                        <img
                          src={
                            list.posterUrl ||
                            "/src/assets/Images/default-title-image.png"
                          }
                          alt={list.listName}
                          className="watchlist-thumbnail"
                        />
                         </Link>
                         <Link to={`/watchlist/${list.listId}`}>
                         <div className="watchlist-name">{list.listName}</div>
                         </Link>
                        
                        <div className="watchlist-username">
                          {list.username || "username"}
                        </div>
                      </div>
                     
                    ))}
                    <div className="view-more">
                      <div
                        className="view-more-link"
                        style={{ cursor: "pointer", color: "#526d82" }}
                        onClick={() => setSection("watchlists")}
                      >
                        View More →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-comments">
                <div className="content-title" data-testid="dashboard-comments">Comments</div>
                <div className="list-container">
                  {comments.slice(0, 4).map((item) => (
                    <div className="comment-item" key={item.commentId}>
                      <div className="comment--content">
                        <div className="comment--title">
                          {new Date(item.datePosted).toLocaleString()} by{" "}
                          <a
                            href="#"
                            className="user-username"
                            onClick={(e) => {
                              e.preventDefault();
                              const user = users.find(
                                (u) => u.userId === item.userId
                              );
                              if (user) {
                                setSelectedUser(user);
                                setShowUserPopup(true);
                              }
                            }}
                            style={{
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {item.username}
                          </a>{" "}
                          on <Link to={`/watchlist/${item.watchlistId}`}>{item.watchlistName}</Link>
                        </div>
                        <div className="comment--text">{item.comment}</div>
                      </div>
                      <div className="comment--buttons">
                        <DeleteForeverIcon
                          style={{
                            fontSize: 30,
                            marginRight: "4px",
                            color: "e74c3c",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this comment?"
                              )
                            ) {
                              handleDeleteComment(
                                item.watchlistId,
                                item.commentId
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="comment-view-more">
                    <div
                      className="view-more-link"
                      style={{ cursor: "pointer", color: "#526d82" }}
                      onClick={() => setSection("comments")}
                    >
                      View More →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "users" && (
            <div className="content-users-all">
              <div className="content-title">Users</div>
              {filteredUsers.length === 0 ? (
                <p style={{ marginTop: "2rem" }}>No users found.</p>
              ) : (
              <div className="users-list-all">
                {filteredUsers.map((item) => (
                  <div className="user-item" key={item.userId}>
                    <div className="user-display">
                      <img
                        src={
                          item.signedUrl ||
                          "/src/assets/Images/default-profile.jpg"
                        }
                        alt="user photo"
                        className="user-photo"
                      />
                    </div>
                    <div className="user-details">
                      <p>
                        <strong>Username:</strong>{" "}
                        <a
                          href="#"
                          className="user-username"
                          onClick={(e) => {
                            e.preventDefault();
                            const user = users.find(
                              (u) => u.userId === item.userId
                            );
                            if (user) {
                              setSelectedUser(user);
                              setShowUserPopup(true);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {item.username}
                        </a>
                      </p>
                      <p>
                        <strong>Email:</strong> {item.email}
                      </p>
                      <p>
                        <strong>Bio:</strong> {item.biography || "N/A"}
                      </p>
                      <p>
                        <strong>Genres:</strong>{" "}
                        {item.preferredGenres.length > 0
                          ? item.preferredGenres.join(", ")
                          : "None"}
                      </p>
                      <p>
                        <strong>Banned:</strong> {item.isBanned ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Friends:</strong>{" "}
                        {item.friends ? item.friends.length : "None"}
                      </p>
                    </div>
                    <div className="user-actions">
                      <button
                        hidden={item.isAdmin}
                        className={item.isBanned ? "unban-btn" : "ban-btn"}
                        onClick={() =>
                          handleBanToggle(item.userId, item.isBanned)
                        }
                      >
                        {item.isBanned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {section === "watchlists" && (
            <div className="content-watchlists-all">
              <div className="content-title">Watchlists</div>
              { filteredWatchlists.length === 0 ? (
                  <p style={{ marginTop: "2rem" }}>No watchlists found.</p>
                ) : (
                <div className="watchlist-list-all">
                {filteredWatchlists.map((wl) => (
                  <div key={wl.listId} className="watchlist-item">
                    {wl.posterUrl && (
                      <img src={wl.posterUrl} alt={`${wl.listName} Poster`} className="poster" />
                    )}
                    <div className="watchlist-info">
                      <Link to={`/watchlist/${wl.listId}`} className="watchlist-title">
                        <h3>{wl.listName}</h3>
                      </Link>
                      <p><strong>User:</strong> {wl.username}</p>
                      <p><strong>Likes:</strong> {wl.likes.length}</p>
                      <p><strong>Comments:</strong> {wl.comments.length}</p>
                      <p><strong>Titles:</strong> {wl.titles.length}</p>
                      <p><strong>Collaborators:</strong> {wl.collaborators.length}</p>
                      <p><strong>Visibility:</strong> {wl.isPublic ? "Public" : "Private"}</p>
                    </div>
                  </div>
                ))}
              </div> )}
            </div>
          )}

          {section === "comments" && (
            <div className="content-comments-all">
              <div className="content-title">Comments</div>
              { filteredComments.length === 0 ? (
                <p style={{ marginTop: "2rem" }}>No comments found.</p>
              ) : (
              <div className="comments-list-all">
                {filteredComments.map((item) => (
                  <div className="comment-item" key={item.commentId}>
                    <div className="comment--content">
                      <div className="comment--title">
                        {new Date(item.datePosted).toLocaleString()} by{" "}
                        <a
                          href="#"
                          className="user-username"
                          onClick={(e) => {
                            e.preventDefault();
                            const user = users.find(
                              (u) => u.userId === item.userId
                            );
                            if (user) {
                              setSelectedUser(user);
                              setShowUserPopup(true);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {item.username}
                        </a>{" "}
                        on <Link to={`/watchlist/${item.watchlistId}`}>{item.watchlistName}</Link>
                      </div>
                      <div className="comment--text">{item.comment}</div>
                    </div>
                    <div className="comment--buttons">
                      <DeleteForeverIcon
                        style={{
                          fontSize: 30,
                          marginRight: "4px",
                          color: "#e74c3c",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this comment?"
                            )
                          ) {
                            handleDeleteComment(
                              item.watchlistId,
                              item.commentId
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div> )}
            </div>
          )}
          {/* </div> */}
        </div>

        <div className="profile">
          <h2 className="profile-header header-title">Profile</h2>
          <div className="admin-profile">
            <div className="admin-detail">
              <img
                src={adminProfilePicture}
                alt=""
                className="w-12 h-12 rounded-full"
              />
              <h3 className="username">
                {admin?.username}
                
              </h3>
              <span className="role">Admin</span>
            </div>
          </div>
        </div>
      </div>
      {showUserPopup && selectedUser && (
        <div
          className="user-popup-overlay"
          onClick={() => setShowUserPopup(false)}
        >
          <div className="user-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setShowUserPopup(false)}
            >
              ✖
            </button>
            <img
              src={
                selectedUser.signedUrl ||
                "/src/assets/Images/default-profile.jpg"
              }
              alt="user profile"
              className="popup-user-photo"
            />
            <h3>{selectedUser.username}</h3>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>Bio:</strong> {selectedUser.biography || "N/A"}
            </p>
            <p>
              <strong>Genres:</strong>{" "}
              {selectedUser.preferredGenres.join(", ") || "None"}
            </p>
            <p>
              <strong>Friends:</strong> {selectedUser.friends.length}
            </p>
            <p>
              <strong>Banned:</strong> {selectedUser.isBanned ? "Yes" : "No"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default dashboard;
