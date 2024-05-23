import React, { useCallback, useEffect, useRef, useState } from "react";
import "./AskQue.css";
import { useAskContext } from "../../context/AskContext";
import { RTE, Input, Button, TextArea, HorizontalLine } from "../";
import conf from "../../conf/conf";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import appwriteService from "../../appwrite/config";
import { categoriesArr } from "./Category";
import profile from "../../appwrite/profile";
import { getInitialPost, getResponderInitialPosts } from "../../store/postsSlice";


const AskQue = ({ post }) => {

  const UserAuthStatus = useSelector((state) => state.auth.status)

  const { handleSubmit, register, control, watch, setValue, getValues } =
    useForm({
      defaultValues: {
        title: post?.title || "",
        slug: post?.slug || "slug",
        content: post?.content || "",
        pollAnswer: post?.pollAnswer || '',
        opinionsFrom: post?.opinionsFrom || '',
      },
    });

  const navigate = useNavigate();
  const dispatch = useDispatch()
  const userData = useSelector((state) => state.auth.userData);
  const { setnotificationPopMsg, setNotificationPopMsgNature, isDarkModeOn } = useAskContext()

  // Thumbnail 
  const [thumbnailFile, setthumbnailFile] = useState(null)
  const [thumbailURL, setThumbailURL] = useState('')

  // Category State
  const [selectCategoryVisible, setselectCategoryVisible] = useState(false)
  const [categoryValue, setcategoryValue] = useState('');

  // Poll State
  const [TotalPollOptions, setTotalPollOptions] = useState([]);

  const [pollQuestion, setPollQuestion] = useState('')
  const [options, setoptions] = useState('')

  const [pollTextAreaEmpty, setpollTextAreaEmpty] = useState(true)
  const slugForNotification = useRef(null)
  //
  const [isUploading, setIsUploading] = useState(false)


  const selectThumbnail = async (e) => {

    const file = e.currentTarget.files[0]

    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setnotificationPopMsg((prev) => "Image Must be Less then and Equal to 1 MB ")
      e.currentTarget.value = ''
      return
    }
    setthumbnailFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setThumbailURL(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (data) => {
    if (!UserAuthStatus) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'You are not logged In');
      return
    }

    const pollOptions = TotalPollOptions.map((obj) => JSON.stringify(obj))
    data.pollQuestion = pollQuestion

    let date = new Date()
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}`


    if (pollQuestion && TotalPollOptions.length <= 1) {

      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'There must be 2 Poll options')
      return
    }

    if (!categoryValue) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Select a Category. Choose General If not Specific')
      return
    }

    if (!data.title && !pollQuestion) {
      setNotificationPopMsgNature((prev) => false)
      setnotificationPopMsg((prev) => 'Title is Empty')
      return
    }

    setIsUploading((prev) => true)
    if (post) {

      if (thumbnailFile) {
        try {
          const deleteprevThumbnail = await appwriteService.deleteThumbnail(post?.queImageID)
          const dbThumbnail = await appwriteService.createThumbnail({ file: thumbnailFile });

          const dbPost = await appwriteService.updatePost(post.$id, {
            ...data,
            queImageID: dbThumbnail.$id,
            queImage: null,
            pollQuestion,
            pollOptions
          }, categoryValue);

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))

          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Updated')
        } catch (error) {
          setNotificationPopMsgNature((prev) => false)
          setnotificationPopMsg((prev) => 'Post is Not Updated')
        }

      } else if (thumbailURL && !post?.queImageID) {

        try {
          const dbPost = await appwriteService.updatePost(post?.$id, {
            ...data,
            queImage: thumbailURL,
            queImageID: null,
            pollQuestion,
            pollOptions
          }, categoryValue);

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))
          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Updated')
        } catch (error) {
          setNotificationPopMsgNature((prev) => false)
          setnotificationPopMsg((prev) => 'Post is Not Updated')
        }


      } else if (thumbailURL && post?.queImageID) {

        try {
          const dbPost = await appwriteService.updatePost(post?.$id, {
            ...data,
            queImage: null,
            queImageID: post?.queImageID,
            pollQuestion,
            pollOptions
          }, categoryValue);

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))
          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Updated')
        } catch (error) {
          setNotificationPopMsgNature((prev) => false)
          setnotificationPopMsg((prev) => 'Post is Not Updated')
        }

      } else {

        try {
          const unsplashImg = await fetch(`https://api.unsplash.com/search/photos?query=${categoryValue}&per_page=10&client_id=${conf.unsplashApiKey}`)

          const UnsplashRes = await unsplashImg.json();
          const ImgArrUnsplash = UnsplashRes.results

          const randomIndex = Math.floor(Math.random() * 10);

          const ImgURL = ImgArrUnsplash[randomIndex].urls.full

          const dbPost = await appwriteService.updatePost(post?.$id, {
            ...data,
            queImage: ImgURL,
            queImageID: null,
            pollQuestion,
            pollOptions,
          }, categoryValue);

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))
          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Updated')
        } catch (error) {

          const dbPost = await appwriteService.updatePost(post.$id, {
            ...data,
            userId: userData.$id,
            queImage: null,
            queImageID: null,
            pollQuestion,
            pollOptions,
          }, categoryValue);
          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))
        }

      }

      navigate("/");
    } else {
      const UploaderResponder = await profile.listProfile({ slug: userData?.$id });

      const trustedResponderPost = UploaderResponder?.documents[0].trustedResponder;

      if (thumbnailFile) {
        try {
          const dbThumbnail = await appwriteService.createThumbnail({ file: thumbnailFile })

          const dbPost = await appwriteService.createPost({
            ...data,
            queImageID: dbThumbnail?.$id,
            userId: userData?.$id,
            pollQuestion,
            queImage: null,
            pollOptions,
            name: userData?.name,
            date: formattedDate,
            trustedResponderPost,
          }, categoryValue);

          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Created')

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))
          slugForNotification.current = `post/${dbPost?.$id}/null`
          if (trustedResponderPost) dispatch(getResponderInitialPosts({ initialResponderPosts: [dbPost], initialPostsFlag: true }))
        } catch (error) {
          setNotificationPopMsgNature((prev) => false)
          setnotificationPopMsg((prev) => 'Post is not Created')
        }




      } else {

        try {
          const unsplashImg = await fetch(`https://api.unsplash.com/search/photos?query=${categoryValue}&per_page=10&client_id=${conf.unsplashApiKey}`)
          const UnsplashRes = await unsplashImg.json();
          const ImgArrUnsplash = UnsplashRes.results
          const randomIndex = Math.floor(Math.random() * 10);
          const ImgURL = ImgArrUnsplash[randomIndex].urls.full

          const dbPost = await appwriteService.createPost({
            ...data,
            userId: userData.$id,
            queImage: ImgURL,
            queImageID: null,
            pollQuestion,
            pollOptions,
            name: userData?.name,
            date: formattedDate,
            trustedResponderPost
          }, categoryValue);

          setNotificationPopMsgNature((prev) => true)
          setnotificationPopMsg((prev) => 'Post Created')

          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }))

          if (trustedResponderPost) dispatch(getResponderInitialPosts({ initialResponderPosts: [dbPost], initialPostsFlag: true }))

          slugForNotification.current = `post/${dbPost?.$id}/null`
        } catch (error) {
          const dbPost = await appwriteService.createPost({
            ...data,
            userId: userData.$id,
            queImage: null,
            queImageID: null,
            pollQuestion,
            pollOptions,
            name: userData?.name,
            date: formattedDate,
            trustedResponderPost
          }, categoryValue);
          dispatch(getInitialPost({ initialPosts: [dbPost], initialPostsFlag: true }));

          if (trustedResponderPost) dispatch(getResponderInitialPosts({ initialResponderPosts: [dbPost], initialPostsFlag: true }))

          slugForNotification.current = `post/${dbPost?.$id}/null`
        }
        navigate("/");
      }
    }

    navigate("/")
    setIsUploading((prev) => false)
  }

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string") {
      return value
        .toLowerCase()
        .trim()
        .replace(/[^a-zA-Z\d\s]+/g, "-")
        .replace(/\s/g, "-");
    }
    return "";
  }, []);

  useEffect(() => {
    if (post) {

      setcategoryValue(post.category)

      if (post.pollQuestion) {
        setPollQuestion(post.pollQuestion)
        setpollTextAreaEmpty(false)
      }
      const pollOptionsArray = post.pollOptions.map((option) => JSON.parse(option))
      setTotalPollOptions((prev) => pollOptionsArray)

      if (post.queImageID) {
        appwriteService.getThumbnailPreview(post.queImageID)
          .then((res) => {
            setThumbailURL(res.href)
          })
      } else {
        setThumbailURL((prev) => post.queImage)
      }

    }
  }, [])
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [slugTransform, setValue, watch])

  return (
    <>
      <HorizontalLine />
      <div
        className={`ask_Que_Container ${isDarkModeOn ? 'darkMode' : ''}`}
      >
        <h3 className={`AskQue_Heading text-center text-4xl ${isDarkModeOn ? 'text-white' : 'text-black'}`}>"Got a Question? Ask Away!"</h3>

        <form id="AskQue_Form" onSubmit={handleSubmit(submit)} className="flex">
          <div id="AskQue_InsideFormLeft">
            <div className="Question_Title flex gap-3">
              <h4 className={`my-4 text-xl ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Title</h4>
              <TextArea
                className={`${isDarkModeOn ? 'darkMode' : ''}`}
                maxLength="250"
                id="Que_Title"
                placeholder="A Catchy , Title will get more attention. Max 250 Characters are Allowed."
                {...register("title", {
                  required: false,
                })}
              />
              <Input
                className="text-black hidden"
                placeholder="slug"
                {...register("slug", {
                  required: false,
                })}
                onInput={(e) => {
                  setValue("slug", slugTransform(e.current.target.value), {
                    shouldValidate: true,
                  });
                }}
              />
            </div>
            <div className="Descripton flex flex-col gap-3">
              <h4 className={`my-3 text-xl ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Additional Details (Optional)</h4>
              <div className="Description_div">
                <RTE
                  name="content"
                  defaultValue={getValues("content")}
                  control={control}
                />
              </div>
            </div>
            <div className="Opinions">
              <h4 className={`my-4 mb-6 mt-5 text-xl ${isDarkModeOn ? 'text-white' : 'text-black'}`}>
                Whom Opinion are You interested ?
              </h4>
              <div className="AskQue_Opinions_From_Div flex justify-between items-center ">
                <div className="w-1/5  text-center text-xl">
                  <span className={`my-4 mb-6 mt-5 text-xl ${isDarkModeOn ? 'text-white' : 'text-black'}`} >Opinions From :</span>
                </div>


                <div className="flex pl-6 justify-around w-4/5 text-xl">
                  <div className="flex-1 flex gap-3 items-center">
                    <Input
                      {...register("opinionsFrom", {
                        required: false
                      })}

                      defaultChecked={post && post?.opinionsFrom === 'Everyone' ? true : post ? false : true}
                      type="radio"
                      value="Everyone"
                      name='opinionsFrom'
                      id="Id1"
                      className='cursor-pointer'
                    />
                    <label htmlFor="Id1" className={`cursor-pointer ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Everyone</label>
                  </div>


                  <div className="flex-1 flex gap-3 items-center text-xl">
                    <Input
                      {...register('opinionsFrom')}
                      type="radio"
                      value="Responders"
                      defaultChecked={post && post?.opinionsFrom === 'Responders' ? true : false}
                      id="Id3"
                      name='opinionsFrom'
                      className='cursor-pointer'
                    />
                    <label htmlFor="Id3" className={`cursor-pointer ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Responders</label>
                    <i className="fa-solid fa-mars-stroke text-red-600"></i>
                  </div>
                </div>
              </div>
            </div>

            <hr className="mt-5" />

          </div>

          <div id="AskQue_insideForm_right">

            <div id="AskQue_Thumbnail_preview">
              <div id="AskQue_Thumbnail" className={`${isDarkModeOn ? 'text-white border-white' : 'text-black border-black'}`}>
                {!thumbailURL && <p className="text-center">Add Thumbail for Your Question
                  <br />
                  or thumbnail will be set according to category
                </p>}
                {thumbailURL && <div>
                  <img src={thumbailURL} alt="" />
                </div>}
              </div>

              <div id="AskQue_Thumbnail_label" className="flex justify-around items-center gap-5">
                <label className={`AskQue_BrowseThumbnail ${isDarkModeOn ? 'text-white' : 'text-black'}`} htmlFor="BrowseThumbnail">{thumbailURL ? `Change Image` : 'Browse Image'}</label>
                <input className="hidden" type="file"
                  name="thumbnailImage"
                  accept="image/*"
                  id="BrowseThumbnail"
                  onChange={selectThumbnail}
                />
                {thumbailURL && <span onClick={async () => {
                  setThumbailURL('')
                  setthumbnailFile(null)
                  try {
                    const deleteprevThumbnail = await appwriteService.deleteThumbnail(post.queImageID)
                  } catch (error) {
                    console.log("AskQue delete Img error.")
                  }

                }}>Remove Image</span>}
              </div>
            </div>


            <div id="AskQue_PostType" className={`${isDarkModeOn ? 'darkMode' : ''}`}>
              <p className={`cursor-pointer ${isDarkModeOn ? 'text-white' : 'text-black'}`} >Select Post Type:</p>
              <div className="flex justify-start gap-6">
                <div>
                  <label className={`cursor-pointer ${isDarkModeOn ? 'text-white' : 'text-black'}`} htmlFor="public">Public</label>
                  <input
                    className="cursor-pointer"
                    {...register("status")}
                    type="radio"
                    name='status'
                    value={'Public'}
                    id="public"
                    defaultChecked={post ? (post?.status === 'Public' ? true : false) : true}
                  />
                </div>
                <div>
                  <label className={`cursor-pointer ${isDarkModeOn ? 'text-white' : 'text-black'}`} htmlFor="private">Private</label>
                  <input
                    className="cursor-pointer"
                    {...register("status", {
                      required: false
                    })}
                    type="radio"
                    name="status"
                    id="private"
                    value={'Private'}
                    defaultChecked={post && post?.status === "Private" ? true : false}
                  />
                </div>
              </div>
            </div>


            <div id="AskQue_SelectCategory" className={`${isDarkModeOn ? 'darkMode' : ''}`}>
              <p className={`mb-3 ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Select Category : </p>
              <div className="dropdown">
                <div
                  className="dropdown-header flex items-center justify-between"
                  onClick={() => {
                    setselectCategoryVisible((prev) => !prev)
                  }}
                >
                  < span className={`${isDarkModeOn ? 'text-white' : 'text-black'}`}>{categoryValue ? categoryValue : `Select Item`}</span>
                  <i className="fa-solid fa-caret-down"></i>
                </div>

                {selectCategoryVisible && <ul className={`AskQue-dropdown-list flex flex-col ${isDarkModeOn ? 'darkMode' : ''}`}>
                  {categoriesArr?.map((object, index) => (
                    <li key={object.category + index} className="dropdown-item" onClick={
                      () => {
                        setselectCategoryVisible(false)
                        setcategoryValue(object.category)
                      }
                    }>{object.category}</li>
                  ))}
                </ul>}
              </div>

            </div>

            {<div id="AskQue_Pole" className={`mt-6 ${post && post.pollQuestion === '' ? 'invisible' : " "}`}>
              <p className={`${isDarkModeOn ? 'text-white' : 'text-black'}`}>Add Pole : (Optional) </p>

              <div id="AskQue_Pole_Options">
                <TextArea
                  placeholder='Ask Pole' className={`AskQue_Pole_TextArea ${isDarkModeOn ? 'darkMode' : ''}`}
                  maxLength={110}
                  value={`${post ? post.pollQuestion : pollQuestion}`}
                  onChange={(e) => {
                    if (e.currentTarget.value !== '') {
                      setpollTextAreaEmpty(false)
                      setPollQuestion(e.currentTarget.value)
                    } else {
                      setpollTextAreaEmpty(true)
                      setTotalPollOptions((prev) => [])
                      setPollQuestion('')
                    }
                  }}
                >
                </TextArea>

                <div>

                  <div className="w-full flex flex-col gap-1 mt-1">

                    <div className="flex gap-3 h-8">
                      <input type="text" name="" id="" className="border outline-none px-2 text-sm w-3/5"
                        value={options}
                        placeholder="options"
                        onChange={(e) => {
                          setoptions((e.currentTarget.value))
                        }} />
                      <Button
                        onClick={() => {
                          if (post) {
                            setNotificationPopMsgNature((prev) => false)
                            setnotificationPopMsg((prev) => "You cannot edit Poll")
                            setoptions("")
                            return
                          }

                          for (let i = 0; i < TotalPollOptions.length; i++) {
                            if (TotalPollOptions[i].option === options) {
                              setoptions("")
                              return
                            }
                          }
                          if (TotalPollOptions.length <= 3 && pollTextAreaEmpty === false && options !== '') {
                            setTotalPollOptions((prev) => {
                              let arr = [...prev, { option: options, vote: 0 }]

                              return [...arr]
                            })
                          } else {
                            if (!pollQuestion) {
                              setNotificationPopMsgNature((prev) => false)
                              setnotificationPopMsg((prev) => "Write a Poll")
                              setoptions("")
                              return
                            }
                            setNotificationPopMsgNature((prev) => false)
                            setnotificationPopMsg((prev) => "Maximum 4 Options Allowed")
                          }
                          setoptions("")
                        }}

                        className={`AskQue_AddOption_btn border text-sm p-1 ${isDarkModeOn ? 'darkMode' : ''}`}>
                        Add options
                      </Button>
                    </div>

                    {TotalPollOptions?.map((options, index) => {
                      // console.log(options)
                      return <div className="w-full flex justify-start items-center" key={options.option}>

                        <span className={`w-3/4 ${isDarkModeOn ? 'text-white' : 'text-black'}`} >{`${index + 1} ) ${options.option}`}</span>

                        <span className={`${post ? 'hidden' : ''}`}><i className={`fa-regular fa-trash-can cursor-pointer`} onClick={
                          () => {
                            setTotalPollOptions((prev) => {
                              let arr = [...prev]
                              arr.splice(index, 1)
                              return [...arr]
                            })
                          }}></i></span>
                      </div>
                    })}
                    <span className={`${isDarkModeOn ? 'text-white' : 'text-black'} text - gray - 500 ${TotalPollOptions.length >= 2 ? null : 'hidden'} ${`${post ? 'hidden' : ''}`}`}>Maximum 4 Options Allowed</span>
                    {!(TotalPollOptions.length >= 2) && <span className={`${isDarkModeOn ? 'text-white' : 'text-black'} text - gray - 500 ${TotalPollOptions.length < 2 && !pollTextAreaEmpty ? null : 'invisible'} `}>Add Minimum 2 Options</span>}
                  </div>

                  <div className="flex gap-3 h-8 mt-3 items-center">
                    <label className={`${isDarkModeOn ? 'text-white' : 'text-black'}`} htmlFor="">Opinion : </label>
                    <input type="text" name="" id="" className="border outline-none px-2 py-1 text-sm w-4/6" placeholder="Poll Answer /  Opinion"
                      {...register('pollAnswer', {
                        required: false
                      })}
                    />
                  </div>

                </div>

              </div>

            </div>}
            <div className={`buttons flex justify - end items - center mt - 14`}>

              {!isUploading && <Button type="submit" className={`askque_btn ${isDarkModeOn ? 'darkMode' : ''}`}>
                {post ? "Update Your Question" : "Post Question"}
              </Button>}
              {isUploading && <Button type="submit" className={`askque_btn ${isDarkModeOn ? 'darkMode' : ''}`}>
                {post ? "Updating..." : "Uploading..."}
              </Button>}

            </div>
          </div>

        </form >
      </div >
    </>
  );
};

export default AskQue;
