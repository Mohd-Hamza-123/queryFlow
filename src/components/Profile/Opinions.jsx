import React, { useRef, useState, useEffect } from 'react'
import realTime from '../../appwrite/realTime.js'
import { Input, Button, Spinner } from '../'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { categoriesArr } from '../AskQue/Category'
import { useAskContext } from '../../context/AskContext'
import parse from "html-react-parser";
import './Opinions.css'

const Opinions = ({ visitedProfileUserID }) => {

  const dispatch = useDispatch()

  const spinnerRef = useRef()
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setcomments] = useState([])
  console.log(comments)
  const [lastPostID, setLastPostID] = useState(null)
  const [isPostAvailable, setisPostAvailable] = useState(true)
  const [totalFilteredcomments, settotalFilteredcomments] = useState(0)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const { hasMorePostsInProfileFilterOpinions,
    sethasMorePostsInProfileFilterOpinions, } = useAskContext()
  const userData = useSelector((state) => state.auth.userData);
  const { register, handleSubmit, setValue, reset, getValues } = useForm({})
  const [totalNumberofPosts, settotalNumberofPosts] = useState(0)

  const submit = async (data) => {
    // console.log(data)


    if (visitedProfileUserID === userData.$id) {
      data.UserID = visitedProfileUserID
      // console.log(data)

      // return
      sethasMorePostsInProfileFilterOpinions(true)
      const filteredOpinions = await realTime.getCommentsWithQueries({ ...data })
      // console.log(filteredOpinions)
      const isArray = Array.isArray(filteredOpinions)
      if (isArray) {
        sethasMorePostsInProfileFilterOpinions(false)
        setIsLoading(false)
        settotalFilteredcomments(0)
        setLastPostID(null)
        setisPostAvailable(false)
      } else {
        setIsLoading(true)
        setisPostAvailable(true)
        if (filteredOpinions.documents.length > 0) {
          settotalFilteredcomments(filteredOpinions.total)
          setcomments((prev) => filteredOpinions.documents)
        } else {
          settotalFilteredcomments(0)
          setcomments((prev) => [])
          setisPostAvailable(false)
        }
      }
    } else {
      return
    }
  }

  useEffect(() => {
    if (comments.length >= totalFilteredcomments) {
      setIsLoading(false)
      sethasMorePostsInProfileFilterOpinions(false)
      setLastPostID((prev) => null)
    } else {
      setLastPostID((prev) => comments[comments.length - 1]?.$id)
      setIsLoading(true)
      sethasMorePostsInProfileFilterOpinions(true)
    }
  }, [comments, isIntersecting, isLoading])

  useEffect(() => {
    // console.log("bye")
    const getMorecomments = async () => {
      const data = getValues()
      const filteredOpinions = await realTime.getCommentsWithQueries({ ...data, lastPostID })
      console.log(filteredOpinions)
      if (filteredOpinions.length !== 0) {
        setcomments((prev) => [...prev, ...filteredOpinions.documents])
      }

    }

    if (isIntersecting) {
      if (lastPostID !== null) {
        getMorecomments()
      }
    }
  }, [isIntersecting])
  useEffect(() => {
    const ref = spinnerRef.current;
    if (ref) {
      const observer = new IntersectionObserver(([entry]) => {

        setIsIntersecting((prev) => entry.isIntersecting)
      }, {
        root: null,
        rootMargin: '0px',
        threshold: 1
      })

      observer.observe(ref)
      return () => ref && observer.unobserve(ref)
    }

  }, [spinnerRef.current, comments, lastPostID, totalFilteredcomments])
  // getting total posts

  return (
    <div id='Profile_Opinions_Filter' className='flex'>

      <form id='Profile_Filter_Opinions_Form' className='w-full flex flex-col gap-5 p-3 relative' onSubmit={handleSubmit(submit)}>

        <div>
          <p>Filter By Post Age :</p>
          <div className='flex flex-col gap-1'>
            <div className='flex gap-2'>
              <input  {...register("PostAge")} id="Profile_Opinions_PostAge_Recent" type="radio" name="PostAge" value={'Recent'} />
              <label className="cursor-pointer" htmlFor='Profile_Opinions_PostAge_Recent'>Recent</label>
            </div>
            <div className='flex gap-2'>
              <input {...register("PostAge")} id="Profile_Opinions_PostAge_Oldest" type="radio" name="PostAge" value={'Oldest'} />
              <label className="cursor-pointer" htmlFor='Profile_Opinions_PostAge_Oldest'>Oldest</label>
            </div>
          </div>
        </div>



        <div>
          <p>Filter By Category : </p>
          <div id='Profile_Opinions_Category' className='flex gap-2'>
            <label htmlFor="">Category : </label>
            <select name="category" {...register("category")} id="" className='outline-none'>
              <option defaultChecked value={'All Category'}>All Category</option>
              {categoriesArr?.map((category, index) => (
                <option key={category.category + index}>{category.category}</option>
              ))}
            </select>
          </div>
        </div>

        <div id='Profile_Opinions_FilterByDate'>
          <p>Filter By Date : </p>
          <div className='flex flex-col gap-3'>


            <div className='flex gap-1'>
              <label className='' htmlFor="AfterDate">After Date :</label>
              <input {...register("AfterDate", {
                required: false
              })} type="date" name="AfterDate" id="AfterDate" />
            </div>

            <div className='flex gap-1'>
              <label className='' htmlFor="BeforeDate">Before Date :</label>
              <input type="date" name="BeforeDate" id="BeforeDate" {...register("BeforeDate")} />
            </div>
          </div>
        </div>

        <Button type='Submit' className='Profile_Opinions_ApplyFilter'>Apply Filter</Button>
        <input type='reset' onClick={() => {
          reset()
          // sethasMorePostsInProfile_Questionss(false)
        }} value={'Reset Filter'} className='Profile_Opinions_ResentFilter' />
      </form>


      <div id='Profile_Opinions_Filtered_Questions'>

        {!isPostAvailable && <p className='text-center'>No Posts Available</p>}
        {comments?.map((comment, index) => {
          if (isPostAvailable !== true) {
            return
          }
          return <div key={comment?.$id}>
            <span className={`${comment?.gender === 'female' ? 'text-pink-600' : 'text-blue-900'}`}>{comment?.name}</span>

            <Link to={`/post/${comment?.postid}/${comment?.$id}`}>
              <article>{parse(comment?.commentContent)}</article>
              <div id='BrowseQuestions_created_category_views' className='flex gap-3'>
                <span>{new Date(comment?.$createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>{comment?.category}</span>

                <div>
                  <i className="fa-solid fa-comments"></i>
                  <span>{comment?.subComment?.length}</span>
                </div>

              </div>
            </Link>
          </div>
        })}

        {(isLoading && hasMorePostsInProfileFilterOpinions) && <section ref={spinnerRef} className='flex justify-center'>
          <Spinner />
        </section>}
      </div>

    </div>
  )
}

export default Opinions