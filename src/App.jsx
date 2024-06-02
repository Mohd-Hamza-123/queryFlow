import { useEffect, useRef, useState } from "react";
import { AskProvider } from "./context/AskContext";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "./store/authSlice";
import { useNavigate } from "react-router-dom";
import Overlay from "./components/Overlay/Overlay";
import "./App.css";
import { Loader, NotificationPop, SideBar } from "./components";
import appwriteService from "./appwrite/config";
import profile from "./appwrite/profile";
import { getUserProfile } from "./store/profileSlice";
import { Feedback } from "./components";
import authService from "./appwrite/auth";
import { getInitialPost } from "./store/postsSlice";
import Setting from "./components/Setting/Setting";
import notification from "./appwrite/notification";


function App() {


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);


  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOverlayBoolean, setisOverlayBoolean] = useState(false)
  const [feedbackPopUp, setfeedbackPopUp] = useState(false);
  const [SettingPopUp, SetSettingPopUp] = useState(false);
  const [notificationPopUp, setnotificationPopUp] = useState(false);
  const [myUserProfile, setMyUserProfile] = useState(null)
  const [notificationShow, setNotificationShow] = useState(null)
  const [hasMorePostsInHome, sethasMorePostsInHome] = useState(true)
  const [hasMoreComments, sethasMoreComments] = useState(true)
  const [hasMorePostsInBrowseQuestions, sethasMorePostsInBrowseQuestions] = useState(true)
  const [hasMorePostsInProfileFilterQuestions, sethasMorePostsInProfileFilterQuestions] = useState(true)
  const [hasMorePostsInProfileFilterOpinions, sethasMorePostsInProfileFilterOpinions] = useState(true)
  const [hasMorePostsInProfileFilterBookmark, sethasMorePostsInProfileFilterBookmark] = useState(true)
  const [hasMorePostInTrustedPost, sethasMorePostInTrustedPost] = useState(true);
  const [queries, setQueries] = useState([]);

  //For Notification Pop
  const [notificationPopMsg, setnotificationPopMsg] = useState('')
  const [notificationPopMsgNature, setNotificationPopMsgNature] = useState(false);

  // For notification bell icon
  const [isUnreadNotificationExist, setIsUnreadNotificationExist] = useState(true);
 
  // To my Profile Posts
  const [savedMyProfilePosts, setSavedMyProfilePosts] = useState(null);

  // To save my Comments
  const [savedMyProfileComments, setsavedMyProfileComments] = useState(null)


  const [mainResponder, setmainResponder] = useState(null);

  const indicator = useRef(true);


  const urlParams = new URLSearchParams(window.location.search);
  const secret = urlParams.get('secret');
  const userId = urlParams.get('userId');

  const body = document.getElementsByTagName('body');

  const [isDarkModeOn, setisDarkModeOn] = useState(localStorage.getItem("isDarkModeOn") === 'true');


  const fetchData = async () => {
    try {
      const userData = await authService.getCurrentUser();

      if (userData) {
        dispatch(login({ userData }))
        const userProfile = await profile.listProfile({ slug: userData?.$id });
        if (userProfile?.documents?.length === 0 || userProfile?.total === 0) {

          const userProfile = await profile.createProfile({
            name: userData?.name,
            userIdAuth: userData?.$id,
            profileImgID: null,
            profileImgURL: "https://i.pinimg.com/736x/d2/98/4e/d2984ec4b65a8568eab3dc2b640fc58e.jpg",
          });
          setMyUserProfile((prev) => userProfile);
          dispatch(getUserProfile({ userProfile }));
          if (userProfile) {
            navigate("/");
          } else {
            navigate("/signup");
          }


        } else {

          setMyUserProfile(prev => userProfile?.documents[0]);

          const profileImageID = userProfile?.documents[0]?.profileImgID
          const URL = await profile.getStoragePreview(profileImageID);

          if (URL) {
            dispatch(getUserProfile({ userProfile: userProfile?.documents[0], userProfileImgURL: URL?.href }));
          } else {
            dispatch(getUserProfile({ userProfile: userProfile?.documents[0], userProfileImgURL: '' }));
          }
          navigate("/");
        }

      }
    } catch (err) {
      setnotificationPopMsg((prev) => false)
      setnotificationPopMsg((prev) => "Oops ! Error");
      navigate("/signup")

    } finally {
      setLoading(false);
    }
  }

  // getting notifications
  const [notifications, setnotifications] = useState(null);


  const deleteNotication = async () => {
    const listdocumentstoDelete = await notification.getNotification({ userID: userData?.$id });

    for (let i = 0; i < listdocumentstoDelete.documents.length; i++) {
      let notificationID = listdocumentstoDelete?.documents[i]?.$id;
      if (!notificationID) return;
      notification.deleteNotication({ notificationID });
    }
  }

  const increaseViews = async (PostId) => {
    try {
      const previesViews = await appwriteService.getPost(PostId)
      const updateViews = await appwriteService.updatePostViews(PostId, previesViews.views + 1, previesViews.commentCount);
      dispatch(getInitialPost({ initialPosts: [updateViews] }))
    } catch (error) {

    }
  }

  const verifyEmail = () => {
    if (userId && secret) {
      authService.verifyWithUserId_secret(userId, secret)
        .then((res) => {
     
          if (res) {
            setNotificationPopMsgNature((prev) => true);
            setnotificationPopMsg((prev) => "You Email is Verified");
          }
        })
        .catch((err) => {
        })
    }
  }

  async function getNotification() {
    try {
      const userData = await authService.getCurrentUser();
      const res = await notification.getNotification({ userID: userData?.$id });

      setnotifications((prev) => res?.documents)

      if (res?.total > 25) {
        const totalItemsToDelete = res?.total - 25;

        const limitToDelete = Math.min(totalItemsToDelete, 50);
        const listdocumentstoDelete = await notification.getNotification({ userID: userData?.$id, limit: limitToDelete });

        for (let i = 0; i < limitToDelete; i++) {
          let notificationID = listdocumentstoDelete?.documents[i]?.$id;
          if (!notificationID) return;
          notification.deleteNotication({ notificationID });
        }
      }

    } catch (error) {
      setnotifications((prev) => [])
    }


  }

  async function getData() {
    try {
      const userProfile = await profile.listProfile({ slug: userData?.$id });
      setMyUserProfile(prev => userProfile?.documents[0]);
    } catch (error) {
      setMyUserProfile((prev) => null);
      dispatch(logout());
    }
  }

  const [appInstallPrompt, setAppInstallPrompt] = useState(null);
  const [isAppInstalled, setisAppInstalled] = useState(true);
  const onInstallApp = async () => {
    if (appInstallPrompt) {
   
      appInstallPrompt.prompt()
      appInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          // User accepted the install prompt
          setisAppInstalled((prev) => true)
        } else {
          // User dismissed the install prompt
          setisAppInstalled((prev) => false)
        }
      });
    }
  }

  
  useEffect(() => {
    const installApp = (e) => {
      e.preventDefault();
      setAppInstallPrompt((prev) => e)

      // Optionally, you can check if the app is already installed as standalone
      if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
        setisAppInstalled((prev) => true)
      } else {
        setisAppInstalled((prev) => false)
      }
    };

    window.addEventListener("beforeinstallprompt", installApp);

    return () => {
      window.removeEventListener("beforeinstallprompt", installApp);
    };
  }, []);

  useEffect(() => {
    if (!body) return
    if (isDarkModeOn) {
      localStorage.setItem("isDarkModeOn", true);
      body[0].classList.add("darkMode")
    } else {

      localStorage.setItem("isDarkModeOn", false)
      body[0].classList.remove("darkMode")
    }
  }, [isDarkModeOn])

  useEffect(() => {

    if (indicator.current) {
      fetchData();
      indicator.current = false
    }

    verifyEmail();

    getNotification();

  }, [])

  useEffect(() => {
    if (!myUserProfile && userData) {
      getData()
    }

  }, [userData])

  return !loading ? (
    <>
      <AskProvider
        value={{
          isAppInstalled,
          onInstallApp,
          queries, setQueries,
          hasMorePostsInProfileFilterBookmark,
          sethasMorePostsInProfileFilterBookmark,
          hasMorePostsInProfileFilterOpinions, sethasMorePostsInProfileFilterOpinions,
          hasMorePostsInProfileFilterQuestions,
          sethasMorePostsInProfileFilterQuestions,
          hasMorePostsInBrowseQuestions,
          sethasMorePostsInBrowseQuestions,
          hasMorePostInTrustedPost, sethasMorePostInTrustedPost,
          hasMoreComments,
          sethasMoreComments,
          hasMorePostsInHome,
          sethasMorePostsInHome,
          myUserProfile,
          setMyUserProfile,
          notificationPopUp,
          setnotificationPopUp,
          notificationShow,
          setNotificationShow,
          increaseViews,
          feedbackPopUp,
          setfeedbackPopUp,
          SettingPopUp, SetSettingPopUp,
          isOverlayBoolean, setisOverlayBoolean,
          isOpen,
          setIsOpen,
          notificationPopMsg, setnotificationPopMsg,
          notificationPopMsgNature, setNotificationPopMsgNature,
          notifications, setnotifications,
          deleteNotication,
          isUnreadNotificationExist, setIsUnreadNotificationExist,
          isDarkModeOn, setisDarkModeOn,
          mainResponder, setmainResponder,
          savedMyProfilePosts, setSavedMyProfilePosts,
          savedMyProfileComments, setsavedMyProfileComments,
        }}
      >

        <NotificationPop notificationPopMsg={notificationPopMsg} notificationPopMsgNature={notificationPopMsgNature} />
        <Feedback />
        <Setting />
        <Outlet />
        <SideBar />
        <Overlay />

      </AskProvider>
    </>
  ) : <Loader />;
}

export default App;
