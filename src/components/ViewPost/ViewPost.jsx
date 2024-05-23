import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import appwriteService from "../../appwrite/config";
import { Button, Chat, HorizontalLine, UpperNavigationBar, LowerNavigationBar } from "../index";
import parse from "html-react-parser";
import { useSelector, useDispatch } from "react-redux";
import NoProfile from '../../assets/NoProfile.png'
import { useAskContext } from "../../context/AskContext";
import "./ViewPost.css";
import '../../index.css'
import profile from "../../appwrite/profile";
import { getAllVisitedQuestionsInViewPost } from "../../store/ViewPostsSlice";
import { getInitialPost, getResponderInitialPosts } from "../../store/postsSlice";
import realTime from "../../appwrite/realTime";
import { getCommentsInRedux } from "../../store/commentsSlice";
import notification from "../../appwrite/notification";
import conf from "../../conf/conf";
import { Client } from "appwrite";

const ViewPost = () => {
  let client = new Client()
    .setEndpoint(conf.appwriteURL)
    .setProject(conf.appwriteProjectId)


  const [post, setPost] = useState(null);

  const dispatch = useDispatch()
  const { slug, filterCommentID } = useParams();
  const navigate = useNavigate();
  const ellipsis_Vertical = useRef();
  const ViewPost_ellipsis_Vertical = useRef();
  const viewPostLeft = useRef()
  const viewPostRight = useRef()


  //Data from Redux
  const postProfilesPic = useSelector((state) => state.postsSlice?.postUploaderProfilePic)
  const commentsInRedux = useSelector((state) => state.commentsSlice.comments)
  const userData = useSelector((state) => state?.auth?.userData);
  const userAuthStatus = useSelector((state) => state?.auth?.status)
  const initialPost = useSelector((state) => state.postsSlice.initialPosts);
  const initialTrustedPosts = useSelector((state) => state.postsSlice.initialResponderPosts)

  const { myUserProfile,
    setMyUserProfile,
    setnotificationPopMsg,
    setNotificationPopMsgNature
  } = useAskContext()

  const isAuther = post && userData ? post.userId === userData.$id : false;

  const [isBookMarked, setIsBookMarked] = useState(false)

  const [profileImgURL, setprofileImgURL] = useState('')

  // useState for views,comments,date
  const [postdate, setpostdate] = useState('')
  const [postViews, setpostViews] = useState(0)
  const [postCommentCount, setpostCommentCount] = useState(0)
  // poll 
  const [totalPollVotes, setTotalPollVotes] = useState(0)
  const [pollVotersAuthIDsAndVote, setpollVotersAuthIDsAndVote] = useState([])
  const [isPollOpinionVisible, setIsPollOpinionVisible] = useState(false)
  const [filteredComment, setfilteredComment] = useState(null)

  // update UI for Pole Percentage
  const [selectedIndex, setselectedIndex] = useState(0)
  // update LikeDislike UI
  const [Like_Dislike, setLike_Dislike] = useState(null)
  const [likeCount, setlikeCount] = useState(0);
  const [disLikeCount, setdisLikeCount] = useState(0)

  const navigateToRelatedPost = (postId) => {
    navigate(`/post/${postId}/${null}`);
  }
  const deleteComments = async (documentid) => {

    realTime
      .deleteComment(documentid)
      .then(() => {

        let commentsAfterDeletion = commentsInRedux.filter((comment) => comment.$id !== documentid)

        dispatch(getCommentsInRedux({ comments: commentsAfterDeletion, isMerge: false }))
      }).catch((err) => { })


    appwriteService
      .updatePostViews(post?.$id, post.views, post.commentCount - 1)
      .then((res) => {
        dispatch(getInitialPost({ initialPosts: [res] }))

        setpostCommentCount((prev) => post.commentCount - 1)
      })
      .catch((error) => { })

    setfilteredComment((prev) => null)
  }

  useEffect(() => {
    if (filterCommentID !== 'null') {
      realTime
        .getSingleComment(filterCommentID)
        .then((res) => {
          setfilteredComment(res)
        })
        .catch((res) => null)
    }
  }, [filterCommentID])

  useEffect(() => {
    if ((initialPost?.some(obj => obj?.$id === slug)) === false) {
      appwriteService
        .getPost(slug)
        .then((post) => {
          if (post) {
            setPost((prev) => post)

            setTotalPollVotes((prev) => post?.totalPollVotes)
          }
          dispatch(getAllVisitedQuestionsInViewPost({ questions: post }))
        })
        .catch(() => {
          return null
        });
    } else {
      let postObject = initialPost.find(obj => obj.$id === slug)
      setPost((prev) => postObject)
    }
  }, [slug, initialPost]);


  useEffect(() => {

    if (post) {
      const ProfileURLIndex = postProfilesPic?.findIndex((obj) => (
        obj?.userId === post?.userId
      ))
      setprofileImgURL(postProfilesPic[ProfileURLIndex]?.profilePic)
    }
  }, [post])
  
  useEffect(() => {

    if (post) {
      setTotalPollVotes((prev) => post?.totalPollVotes)
      setpollVotersAuthIDsAndVote((prev) => {
        return post?.pollVotersID?.filter((obj) => {
          if (JSON.parse(obj)?.pollVoterID === userData?.$id) {
            setIsPollOpinionVisible(true)
            return obj
          }
        })
      })
    }

  }, [post])
  // UseEffect For bookMark
  useEffect(() => {
    if ((myUserProfile?.bookmarks)?.includes(post?.$id)) {
      setIsBookMarked(true);
    } else {
      setIsBookMarked(false);
    }

    if (post) {
      if (post?.pollVotersID.length === 0) {
        setselectedIndex((prev) => null)
      } else {
        let parseArr = post?.pollVotersID?.map((obj) => JSON.parse(obj));
        let myPollIndex = parseArr?.filter((obj) => obj?.pollVoterID === userData?.$id);
        if (myPollIndex?.length === 0) {
          setselectedIndex(null)
        } else {
          setselectedIndex((prev) => myPollIndex[0]?.optionNum)
        }

      }

      setlikeCount((prev) => post?.like)
      setdisLikeCount((prev) => post?.dislike)
    }

    if (post === undefined) {
      let postObject = initialPost.find(obj => obj.$id === slug)
      setPost((prev) => postObject)
    }
  }, [post]);+
  // UseEffect For bookMark
  useEffect(() => {

    if (myUserProfile?.bookmarks?.includes(post?.$id)) {
      setIsBookMarked(true)
    } else {
      setIsBookMarked(false)
    }

    if (myUserProfile) {
      if (myUserProfile?.likedQuestions?.includes(slug)) {
        setLike_Dislike((prev) => "liked")
      } else if (myUserProfile?.dislikedQuestions?.includes(slug)) {
        setLike_Dislike((prev) => 'disliked')
      }
      else {
        setLike_Dislike((prev) => 'none')
      }
    }
  }, [myUserProfile])
  // Update Post in RealTime
  useEffect(() => {
    const realtime = client.subscribe(`databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteCollectionId}.documents.${slug}`, (response) => {

      if (response.events.includes("databases.*.collections.*.documents.*.update")) {

        setPost((prev) => response?.payload)
      }
    })

    return () => realtime()
  }, [])

  const [isRelatedQueriesExist, setisRelatedQueriesExist] = useState(false)
  const [relatedQueriesArr, setRelatedQueriesArr] = useState([])

  useEffect(() => {

    const getRelatedQueries = () => {

      let relatedArr = initialPost?.filter((initialPostObj) => {

        if (initialPostObj?.category
          === post?.category && post?.$id !== initialPostObj?.$id) {
          return initialPostObj
        }
      })
      if (relatedArr.length > 0) {
        setRelatedQueriesArr((prev) => relatedArr)
        setisRelatedQueriesExist(true)
      } else {
        setisRelatedQueriesExist(false)
        setRelatedQueriesArr((prev) => [])
      }

    }
    const getDate_Views_Comments_Details = () => {
      let x = initialPost?.find((postinRedux) => postinRedux?.$id === post?.$id)

      if (x) {
        setpostCommentCount(x.commentCount)
        setpostViews(x.views)
        setpostdate(x.$createdAt)
      }
    }
    if (initialPost.length > 0) getRelatedQueries()
    if (initialPost.length > 0) getDate_Views_Comments_Details()
  }, [post, initialPost])
  const deletePost = () => {
    if (!userAuthStatus) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Please Login')
      return
    }

    appwriteService
      .deletePost(post.$id)
      .then(() => {
        setNotificationPopMsgNature((prev) => true);
        setnotificationPopMsg((prev) => 'Post Deleted');

        const newInitialPost = initialPost?.filter((prevPosts) => prevPosts?.$id !== post?.$id)
        dispatch(getInitialPost({ initialPosts: [...newInitialPost], initialPostsFlag: false }));

        const newRespondersPost = initialTrustedPosts?.filter((prevPosts) => prevPosts?.$id !== post?.$id);
        dispatch(getResponderInitialPosts({ initialResponderPosts: [...newRespondersPost], initialPostsFlag: false }));
      })
      .catch(() => {
        setNotificationPopMsgNature((prev) => false);
        setnotificationPopMsg((prev) => 'Post is not Deleted');
      })
    navigate("/");
  };
  const deleteThumbnail = async () => {

    if (post.queImageID) {
      let deletedImg = await appwriteService.deleteThumbnail(post.queImageID)
    }
  }
  const updatePoll = async (postId, index, option, vote, pollVoterID) => {
    if (!userAuthStatus) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Please Login')
      return
    }
    let totalPollVotes = post.totalPollVotes;
    let pollOptions = post.pollOptions.map(obj => JSON.parse(obj));
    let pollVotersID = [...post.pollVotersID].map((obj) => JSON.parse(obj))


    // checking whether user is first time giving vote or he has already done
    let indexOfVotedOption = pollVotersID.findIndex((obj) => obj.pollVoterID === pollVoterID)
    // if index === -1 voter not exist.
    if (indexOfVotedOption === -1) {

      totalPollVotes = post.totalPollVotes + 1;
      pollVotersID = [...pollVotersID, { pollVoterID, optionNum: index }]
      pollOptions[index].vote = pollOptions[index].vote + 1

    } else {

      totalPollVotes = post.totalPollVotes
      pollVotersID = [...pollVotersID]

      let myPollVoterID = pollVotersID.filter((obj) => obj.pollVoterID === userData.$id)

      if (index === myPollVoterID[0].optionNum) {

        let remainingObject = pollVotersID.filter((obj) => obj.pollVoterID !== userData.$id)
        pollVotersID = remainingObject

        pollOptions[index].vote = pollOptions[index].vote - 1
        totalPollVotes = post.totalPollVotes - 1;
      } else {

        let previousSelectedOptionIndex = myPollVoterID[0].optionNum;

        const desiredIndex = pollVotersID.findIndex((obj) => obj.pollVoterID === userData.$id)

        pollVotersID[desiredIndex].optionNum = index
        pollOptions[index].vote = pollOptions[index].vote + 1
        pollOptions[previousSelectedOptionIndex].vote = pollOptions[previousSelectedOptionIndex].vote - 1

      }
    }

    for (let i = 0; i < pollOptions.length; i++) {
      if (pollOptions[i].vote < 0) {
        return
      }
    }
    pollVotersID = pollVotersID.map((obj) => JSON.stringify(obj))
    pollOptions = pollOptions.map(obj => JSON.stringify(obj));

    const update = await appwriteService.updatePostWithQueries({ pollOptions, postId, totalPollVotes, pollVotersID })

    setPost((prev) => update)
    dispatch(getAllVisitedQuestionsInViewPost({ questions: update }))
    setTotalPollVotes((prev) => update.totalPollVotes)
    let myPollVoterID = pollVotersID.filter((obj) => obj.pollVoterID === userData.$id)
    if (myPollVoterID !== -1) {
      setIsPollOpinionVisible(true)
    }
  }

  const [pauseLikeDisLike, setpauseLikeDisLike] = useState(false)
  // console.log(pauseLikeDisLike)
  const like_dislike_BookMark = async (flag) => {

    if (pauseLikeDisLike === true) return
    if (!userAuthStatus) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Please Login')
      return
    }
    setpauseLikeDisLike((prev) => true)
    const likedQuestionsInContext = myUserProfile?.likedQuestions
    const dislikedQuestionsInContext = myUserProfile?.dislikedQuestions
    const bookmarksInContext = myUserProfile?.bookmarks
    const myProfileID_In_Context = myUserProfile?.$id

    const previousLike = post?.like
    const previousDislike = post?.dislike

    if (flag === 'Like') {
      try {

        if (likedQuestionsInContext.includes(post?.$id)) {
          // update in Query
          const increaseLike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike - 1, dislike: previousDislike })
          setPost((prev) => increaseLike)
          dispatch(getAllVisitedQuestionsInViewPost({ questions: increaseLike }))

          //Update In Profile
          let likedQuestions = likedQuestionsInContext.filter((likedPostIDs) => likedPostIDs !== post?.$id)

          const updateLikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestions, dislikedQuestions: dislikedQuestionsInContext, bookmarks: bookmarksInContext })

          setMyUserProfile((prev) => updateLikeArr_In_MyProfile)

        } else {


          if (dislikedQuestionsInContext.includes(post?.$id)) {
            // Update in Query
            const increaseLike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike + 1, dislike: previousDislike - 1 })
            dispatch(getAllVisitedQuestionsInViewPost({ questions: increaseLike }))
            setPost((prev) => increaseLike)

            //Update In Profile
            let likedQuestions = [...likedQuestionsInContext]
            likedQuestions.push(post?.$id)

            let dislikedQuestions = dislikedQuestionsInContext.filter((dislikedPostIDs) => dislikedPostIDs !== post?.$id)
            const updateLikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestions, dislikedQuestions, bookmarks: bookmarksInContext })

            setMyUserProfile((prev) => updateLikeArr_In_MyProfile)
          } else {

            // Update in Query
            const increaseLike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike + 1, dislike: previousDislike })

            dispatch(getAllVisitedQuestionsInViewPost({ questions: increaseLike }))
            setPost((prev) => increaseLike)

            //Update In Profile
            let likedQuestions = [...likedQuestionsInContext]
            likedQuestions.push(post?.$id)

            const updateLikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestions, dislikedQuestions: dislikedQuestionsInContext, bookmarks: bookmarksInContext })

            setMyUserProfile((prev) => updateLikeArr_In_MyProfile)
          }

          try {

            if (userData?.$id !== post?.userId) {
              // Getting Post Uploader profile to know whether he follows you or not.
              const getPostUploaderProfile = await profile?.listProfile({ slug: post?.userId });

              let followersArr = getPostUploaderProfile?.documents[0]?.followers
              followersArr = followersArr?.map((obj) => JSON.parse(obj))

              const isNotificationSend = followersArr?.findIndex((profile) => profile?.profileID === userData?.$id);

              if (isNotificationSend !== -1) {
                const createNotification = await notification.createNotification({ content: `${userData.name} has liked your post`, isRead: false, slug: `/post/${slug}/null`, name: userData?.name, userID: userData.$id, userIDofReceiver: post.userId, userProfilePic: myUserProfile?.profileImgURL });

              }
            }
          } catch (error) {
            return null
          }

        }
      } catch (error) {
        return null
      }
    } else if (flag === 'Dislike') {
      try {
        if (dislikedQuestionsInContext.includes(post?.$id)) {
          // update in Query
          const decreaseDislike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike, dislike: previousDislike - 1 })
          setPost((prev) => decreaseDislike)
          dispatch(getAllVisitedQuestionsInViewPost({ questions: decreaseDislike }))

          //Update In Profile
          let dislikedQuestions = dislikedQuestionsInContext.filter((dislikedPostIDs) => dislikedPostIDs !== post?.$id)

          const updateDislikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestionsInContext, dislikedQuestions: dislikedQuestions, bookmarks: bookmarksInContext })

          setMyUserProfile((prev) => updateDislikeArr_In_MyProfile)
        } else {

          if (likedQuestionsInContext?.includes(post?.$id)) {
            // Update in Query
            const increaseDislike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike - 1, dislike: previousDislike + 1 })
            dispatch(getAllVisitedQuestionsInViewPost({ questions: increaseDislike }))
            setPost((prev) => increaseDislike)



            //Update In Profile
            let dislikedQuestions = [...dislikedQuestionsInContext]
            dislikedQuestions?.push(post?.$id)

            let likedQuestions = likedQuestionsInContext?.filter((likedPostIDs) => likedPostIDs !== post?.$id)
            const updateLikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestions, dislikedQuestions, bookmarks: bookmarksInContext })

            setMyUserProfile((prev) => updateLikeArr_In_MyProfile)
          } else {

            const increaseDisLike = await appwriteService.updatePost_Like_DisLike({ postId: post?.$id, like: previousLike, dislike: previousDislike + 1 })

            dispatch(getAllVisitedQuestionsInViewPost({ questions: increaseDisLike }))
            setPost((prev) => increaseDisLike)

            //Update In Profile
            let dislikedQuestions = [...dislikedQuestionsInContext]
            dislikedQuestions.push(post?.$id)

            const updateLikeArr_In_MyProfile = await profile.updateProfileWithQueries({ profileID: myUserProfile?.$id, likedQuestionsInContext, dislikedQuestions: dislikedQuestions, bookmarks: bookmarksInContext })

            setMyUserProfile((prev) => updateLikeArr_In_MyProfile)
          }
        }
      } catch (error) {
        return null
      }

    } else {

      if (bookmarksInContext?.includes(post?.$id)) {
        const removeBookmark = bookmarksInContext?.filter((bookmarkPostID) => bookmarkPostID !== post?.$id);

        const updateBookMarkInProfile = await profile.updateProfileWithQueries({ profileID: myProfileID_In_Context, likedQuestions: likedQuestionsInContext, dislikedQuestions: dislikedQuestionsInContext, bookmarks: removeBookmark })
        setMyUserProfile((prev) => updateBookMarkInProfile)

      } else {
        let addBookmark = [...bookmarksInContext]
        addBookmark?.push(post?.$id)


        const updateBookMarkInProfile = await profile.updateProfileWithQueries({ profileID: myProfileID_In_Context, likedQuestions: likedQuestionsInContext, dislikedQuestions: dislikedQuestionsInContext, bookmarks: addBookmark })
        setMyUserProfile((prev) => updateBookMarkInProfile)
      }
    }

    setpauseLikeDisLike((prev) => false)
  }

  const ViewPostRef = useRef()
  const lastScrollY = useRef(window.scrollY);

  const [isNavbarHidden, setisNavbarHidden] = useState(false)

  const handleScroll = (e) => {

    let position = e.target.scrollTop;

    sessionStorage.setItem('scrollPositionofViewPost', position.toString());
    if (lastScrollY.current < position) {

      setisNavbarHidden(true)
    } else {

      setisNavbarHidden(false)
    }

    lastScrollY.current = position
  }
  const deletePostComments = async () => {
    if (!userAuthStatus) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Please Login')
      return
    }
    try {
      const listComments = await realTime.listComment(post?.$id);

      let totalCommentsToDelete = listComments?.total;
      while (totalCommentsToDelete > 0) {
        const listComments = await realTime.listComment(post?.$id);
        totalCommentsToDelete = listComments?.total;
        for (let i = 0; i < listComments?.documents?.length; i++) {
          realTime.deleteComment(listComments.documents[i].$id)
        }
      }
    } catch (error) {
      return null
    }
  }

  useEffect(() => {

    if (ViewPostRef.current) {

      const storedScrollPosition = sessionStorage.getItem('scrollPositionofViewPost');
      const parsedScrollPosition = parseInt(storedScrollPosition, 10);

      ViewPostRef.current.scrollTop = parsedScrollPosition
    }
  }, [ViewPostRef.current]);
  return post ? (
    <div
      id="ViewPost_Scroll_Div"
      ref={ViewPostRef}
      className="w-full relative"
      onScroll={handleScroll}
    >
      <nav className={`Home_Nav_Container w-full text-center ${isNavbarHidden ? 'active' : ''}`}>
        <UpperNavigationBar className='' />
        <HorizontalLine />
        <LowerNavigationBar />
      </nav>
      <HorizontalLine />
      <div id="ViewPost_ViewPost_RecentQuestions_Container" className="flex">

        <div
          onClick={() => {
            if (viewPostLeft.current && viewPostRight.current) {
              viewPostLeft.current.classList.toggle("none");
            }
          }}
          className="Home_RIGHT_LEFT_Grid_div">
          <button
            className="flex justify-center items-center">
            <i className='bx bxs-grid-alt'></i>
          </button>
        </div>
        <div
          ref={viewPostLeft}
          id="ViewPost"
          className="p-3">
          <div id="ViewPost-Question-Container" className="w-4/6 p-2">
            <div id="ViewPost_Details" className="mb-3 flex justify-between mx-3 mt-1 relative items-center">

              <div className="flex">
                <div>
                  <span className="ViewPost-Category">{post?.category}</span>
                </div>
                <div id="ViewPost_Date_Views_comments" className="flex">
                  <div>
                    <span className="">{new Date(postdate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>{postViews}</span>
                    <i className=" fa-solid fa-eye"></i>
                  </div>
                  <div className="flex gap-2">
                    <span>{postCommentCount}</span>
                    <i className="fa-solid fa-comment"></i>
                  </div>

                </div>
              </div>

              <div
                id="ViewPost_Edit_Delete"
                onMouseOver={() => {
                  ellipsis_Vertical.current.classList.add("fa-flip");
                }}
                onMouseOut={() => {
                  ellipsis_Vertical.current.classList.remove("fa-flip");
                }}
                onClick={() => {
                  ViewPost_ellipsis_Vertical.current.classList.toggle("block");
                }}
              >
                {(isAuther || userData?.$id === conf?.myPrivateUserID) && <div id="ViewPost_edit_Delete" className="relative">

                  <div>
                    <div
                      className="ViewPost-ellipsis-Vertical"
                      ref={ViewPost_ellipsis_Vertical}
                    >
                      <ul>
                        {(isAuther || userData?.$id === conf?.myPrivateUserID) && (
                          <li
                            onClick={() => { navigate(`/EditQuestion/${post?.$id}`) }}
                          >
                            <Button
                            >
                              <i className="fa-regular fa-pen-to-square"></i>
                            </Button>
                          </li>
                        )}
                        {(isAuther || userData?.$id === conf?.myPrivateUserID) && (
                          <li>
                            <Button
                              onClick={() => {
                                deletePost();
                                deleteThumbnail();
                                deletePostComments();
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </Button>
                          </li>
                        )}

                      </ul>
                    </div>
                    <Button>
                      <i
                        id="ViewPost_fa-ellipsis"
                        ref={ellipsis_Vertical}
                        className="fa-solid fa-ellipsis-vertical text-xl"
                      ></i>
                    </Button>
                  </div>
                </div>}
              </div>

            </div>
            <div id="ViewPost-Question" className="mt-3">

              <div onClick={() => {
                navigate(`/profile/${post?.userId}`)
              }} className="flex gap-2 items-center cursor-pointer">
                <div className="rounded-full">
                  <img
                    src={`${profileImgURL ? profileImgURL : NoProfile}`}
                    id="PostCard-profile-pic"
                    className="rounded-full"
                  />
                </div>
                <div id='ViewPostName'>
                  <h5>{post?.name}</h5>
                </div>
                {post?.trustedResponderPost && <div>
                  <span className="ViewPost-Category">Responder</span>
                </div>}
              </div>

              <div className="mt-3 mb-2">
                <h2 id="ViewPost-Title" className="text-3xl font-bold">
                  {post?.title}
                </h2>
              </div>

              <div id="ViewPost-parse">
                {parse(post?.content)}
              </div>

              {post?.pollQuestion && <div id="ViewPost_Poll_Div">
                <h5>Poll </h5>
                <p>{post?.pollQuestion}</p>
                <ul>
                  {post?.pollOptions?.map((option, index) => {
                    let parsedOption = JSON.parse(option).option
                    let parsedVote = JSON.parse(option).vote
                    let individualPollVote = Math.floor(Number((JSON.parse(option)).vote))

                    let percentage = (individualPollVote / totalPollVotes) * 100;
                    percentage = percentage.toFixed(0)
                    if (isNaN(percentage)) {
                      percentage = 0
                    }


                    return <li className={`${index === selectedIndex ? "active" : ''} cursor-pointer`} onClick={() => {

                      updatePoll(post.$id, index, parsedOption, parsedVote, userData.$id)

                      setselectedIndex((prev) => index)

                    }} key={parsedOption}>
                      <div className="ViewPost_Poll_Option">{parsedOption}</div>
                      <div className="ViewPost_Overlay_Poll" >
                        {percentage}%
                      </div>
                      <div style={{
                        width: `${percentage}%`
                      }} className={`${index === selectedIndex ? `PollPercentageMeter active` : 'PollPercentageMeter'}`}>

                      </div>
                    </li>
                  })}
                </ul>


                {isPollOpinionVisible && <div id="ViewPost_Poll_Answer">
                  <span>{post?.pollAnswer}</span>
                </div>}
                <div className="flex gap-3 ViewPost_Total_Poll_Votes">
                  <span>Total Votes :</span>
                  <span>{totalPollVotes}</span>
                </div>

              </div>}
            </div>
          </div>

          <section id="ViewPost_Like_Dislike_BookMark">
            <div onClick={() => {

              if (pauseLikeDisLike) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'wait...')
                return
              }

              if (!userAuthStatus) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'Please Login')
                return
              }

              like_dislike_BookMark('Like')
              setLike_Dislike((prev) => 'liked');
              if (myUserProfile?.likedQuestions?.includes(slug)) {
                setlikeCount((prev) => {
                  if (prev === 0) return prev
                  return prev - 1
                });
              } else {
                setlikeCount((prev) => prev + 1);
                if (myUserProfile?.dislikedQuestions?.includes(slug)) {
                  setdisLikeCount((prev) => {
                    if (prev === 0) return prev
                    return prev - 1
                  })
                }
              }


            }} className="ViewPost_Like_Dislike_BookMark_Div cursor-pointer">
              <Button>
                <span>{likeCount}</span>
                <i className={`fa-${Like_Dislike === 'liked' ? 'solid' : 'regular'} fa-thumbs-up`}></i>
              </Button>
            </div>

            <div onClick={() => {

              if (pauseLikeDisLike) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'wait...')
                return
              }
              if (!userAuthStatus) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'Please Login')
                return
              }

              like_dislike_BookMark('Dislike')
              setLike_Dislike((prev) => 'disliked');
              if (myUserProfile?.dislikedQuestions?.includes(slug)) {
                setdisLikeCount((prev) => {
                  if (prev === 0) return prev
                  return prev - 1
                })
              } else {
                setdisLikeCount((prev) => prev + 1);

                if (myUserProfile?.likedQuestions?.includes(slug)) {
                  setlikeCount((prev) => {
                    if (prev === 0) return prev
                    return prev - 1
                  })
                }
              }

            }} className="ViewPost_Like_Dislike_BookMark_Div cursor-pointer">
              <Button>
                <span>{disLikeCount}</span>
                <i className={`fa-${Like_Dislike === 'disliked' ? 'solid' : 'regular'} fa-thumbs-down`}></i>
              </Button>
            </div>

            <div onClick={() => {
              if (pauseLikeDisLike) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'wait...')
                return
              }

              if (!userAuthStatus) {
                setNotificationPopMsgNature((prev) => false)
                setnotificationPopMsg((prev) => 'Please Login')
                return
              }
              like_dislike_BookMark('BooKMark');
              setIsBookMarked((prev) => !prev)
            }} className="ViewPost_Like_Dislike_BookMark_Div cursor-pointer">
              <Button><i className={`fa-${isBookMarked ? 'solid' : 'regular'} fa-bookmark`}></i></Button>
            </div>

          </section>
          <div className="Chat w-4/6 mt-6">
            <Chat post={post} navigateToRelatedPost={navigateToRelatedPost} slug={slug} />
          </div>
        </div>
        <div
          ref={viewPostRight}
          className={`ViewPost_Related_Filter_Comment_Questions ${isNavbarHidden ? '' : 'active'}`}>
          <div id="ViewPost_RelatedQuestions">
            <p>{post?.category} Related :</p>
            {!isRelatedQueriesExist && <span className="">No Related Post is Available of {post?.category}</span>}

            {isRelatedQueriesExist && <ul>
              {relatedQueriesArr?.map((QuestionObj, index) => {
                return <li
                  key={QuestionObj?.$id}
                  onClick={() => {
                    navigateToRelatedPost(QuestionObj?.$id);
                    if (viewPostLeft.current && viewPostRight.current) {
                      if (!window.screen.width <= 500) return
                      viewPostLeft.current.classList.toggle("none");
                    }
                  }}
                  className="cursor-pointer">{QuestionObj?.title ? QuestionObj?.title : QuestionObj?.pollQuestion
                  }</li>
              })}
            </ul>}
          </div>

          {(filterCommentID !== 'null' && filteredComment) && <div className={`ViewPost_Filtered_Comments`}>
            <p>Comment :</p>
            <div>
              <div className="flex justify-between ViewPost_Filtered_Comments_Name_Delete">
                <p>{filteredComment?.name}</p>
                {filteredComment?.authid === userData?.$id && <i onClick={() => {
                  deleteComments(filterCommentID)
                }} className="fa-solid fa-trash cursor-pointer"></i>}
              </div>
              <article>
                {parse(filteredComment?.commentContent)}
              </article>
            </div>
          </div>}
        </div>
      </div>
    </div >
  ) : <div className="">
    <nav className={`Home_Nav_Container w-full text-center ${isNavbarHidden ? 'active' : ''}`}>
      <UpperNavigationBar className='' />
      <HorizontalLine />
      <LowerNavigationBar />
    </nav>
    <p className="text-3xl text-black">Post is Not Available</p>
  </div>;
};

export default ViewPost;
