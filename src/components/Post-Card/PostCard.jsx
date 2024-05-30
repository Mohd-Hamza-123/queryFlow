import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./PostCard.css";
import profile from "../../appwrite/profile";
import appwriteService from "../../appwrite/config";
import NoProfile from '../../assets/NoProfile.png'
import NoImage from '../../assets/NoImage.jpg'
import { useSelector, useDispatch } from 'react-redux'
import { getpostUploaderProfilePic } from "../../store/postsSlice";
import { useAskContext } from "../../context/AskContext";


const PostCard = ({
  $id,
  title = "Title",
  queImage,
  name = "Name",
  userId,
  category,
  queImageID,
  $createdAt,
  views,
  commentCount,
  pollQuestion,
  opinionsFrom,
  trustedResponderPost
}) => {

  const dispatch = useDispatch();
  const postProfilesPic = useSelector((state) => state.postsSlice?.postUploaderProfilePic);

  const { myUserProfile, isDarkModeOn } = useAskContext()

  const [profileImgURL, setprofileImgURL] = useState('')
  const [thumbnailURL, setthumbnailURL] = useState('')


  const getPostData = async () => {

    appwriteService.getThumbnailPreview(queImageID)
      .then((res) => {
        setthumbnailURL(res.href)
      })
  }

  const profileData = async () => {

    const isProfilePicAlreadyInReduxIndex = postProfilesPic?.findIndex((profile) => profile?.userId === userId)

    if (isProfilePicAlreadyInReduxIndex === -1) {

      const gettinProfiles = await profile.listProfile({ slug: userId })

      const gettingProfileImgURL = await profile.getStoragePreview(gettinProfiles?.documents[0]?.profileImgID)
      setprofileImgURL(gettingProfileImgURL?.href)

      if (postProfilesPic.length !== 0) {
        for (let i = 0; i < postProfilesPic?.length; i++) {
          if (postProfilesPic[i].profilePic !== gettingProfileImgURL?.href) {
            dispatch(getpostUploaderProfilePic({ userId, profilePic: gettingProfileImgURL?.href }))
          }
        }
      } else {
        dispatch(getpostUploaderProfilePic({ userId, profilePic: gettingProfileImgURL?.href }))
      }
    } else {
      if (userId === myUserProfile?.userIdAuth) {
        setprofileImgURL((prev) => myUserProfile?.profileImgURL)
      } else {
        setprofileImgURL((prev) => postProfilesPic[isProfilePicAlreadyInReduxIndex].profilePic)
      }

    }

  }

  useEffect(() => {
    if (userId) {
      profileData()
    }
  }, [])

  useEffect(() => {

    if (!queImage && queImageID) {
      getPostData()
    }

  }, [queImageID, category]);


  function countTitle(title) {
    let str = `${title}`;
    str = str.trim();
    const words = str.split(/\s+/).filter((word) => word !== "");
    const numberOfWords = words.length;

    if (numberOfWords < 30) {
      return title;
    } else {
      const words = str.split(/\s+/).filter((word) => word !== "");
      const limitedWordsArray = words.slice(0, 30);
      const limitedWordsString = limitedWordsArray.join(" ");
      return `${limitedWordsString} ...`;
    }
  }

  return (
    <>
      <div className={`PostCard ${isDarkModeOn ? 'darkMode' : ''}`}>
        <div id="PostCard_left" className="" >
          <Link to={`/post/${$id}/${null}`}>
            {queImage ? (
              <img
                id="Post-Card-img"
                src={`${queImage}`}
                alt="Image"
                className="w-full"
              />
            ) : (
              <img
                id="Post-Card-img"
                src={`${thumbnailURL ? thumbnailURL : `https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg`}`}
                onError={(e) => { e.target.src = NoImage }}
                className="w-full"
                loading="lazy"
              />
            )}
          </Link>
        </div>

        <div
          id="PostCard_right"
          className="flex flex-col w-full justify-left align-center mb-4 px-3 pt-2"
        >
          <div>
            <div className="flex gap-2">
              <Link to={`/profile/${userId}`}>
                <div className="rounded-full">
                  <img
                    src={`${profileImgURL ? profileImgURL : NoProfile}`}
                    id="PostCard-profile-pic"
                    className="rounded-full"
                  />
                </div>
              </Link>
              <Link to={`/profile/${userId}`}>
                <h4 id="PostCard-profile-name" className={`${isDarkModeOn ? "text-white" : 'text-black'}`}>
                  {name}
                </h4>
              </Link>
              {trustedResponderPost && <div>
                <span className="PostCard_category">{'Responder'}</span>
              </div>}
            </div>
            <Link to={`/post/${$id}/${null}`}>
              <h3
                id="PostCard_title"
                className={`${isDarkModeOn ? 'darkMode' : ''}`}
              >{countTitle(title) ? countTitle(title) : pollQuestion}</h3>
            </Link>
          </div>
          <div className="PostCard_Details flex gap-4 items-center my-1">
            <span className="PostCard_Date">{new Date($createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="PostCard_category">{category}</span>
            <span className="PostCard_category">{opinionsFrom}</span>
            <span className="PostCard_Views flex gap-2 items-center">
              <span>{views}</span>
              <i className=" fa-solid fa-eye"></i>
            </span>
          </div>
          <div id="PostCard_Comments_Icon" className="flex gap-2  items-center">
            <p id='PostCard_MaleComments_p' className={`${isDarkModeOn ? "text-white" : 'text-black'}`} >{commentCount}</p>
            <svg className={`${isDarkModeOn ? "darkMode" : ''}`} id='PostCard_MaleComments' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l0 0 0 0 0 0 0 0 .3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z" /></svg>

          </div>
        </div>
      </div>


    </>
  );
};

export default PostCard;
