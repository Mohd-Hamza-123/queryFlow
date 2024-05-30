import React, { useRef } from "react";
import { useEffect } from "react"
import { useState } from "react"
import { PostCard, UpperNavigationBar, LowerNavigationBar, HorizontalLine, HomeRight, SecondLoader, Button } from "../components/index";
import { useSelector, useDispatch } from "react-redux";
import "./Home.css";
import appwriteService from "../appwrite/config";
import { useAskContext } from "../context/AskContext";
import { getInitialPost } from "../store/postsSlice";


const Home = () => {
  
  const dispatch = useDispatch()
  const initialPost = useSelector((state) => state.postsSlice?.initialPosts)


  const {
    increaseViews,
    hasMorePostsInHome,
    sethasMorePostsInHome,
    isDarkModeOn } = useAskContext();

  const [posts, setPosts] = useState([]);
 
  const [isLoading, setIsLoading] = useState(false)
  const [lastPostID, setLastPostID] = useState(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  let spinnerRef = useRef();
  const homeRight = useRef();
  const homeLeft = useRef()

  const getAllPosts = async () => {
    setIsLoading((prev) => true)
    try {
      if (initialPost?.length === 0) {
        const posts = await appwriteService.getPosts({ lastPostID })
      
        if (posts === false) {
          setPosts((prev) => false)
        }

        if (initialPost?.length < posts.total) {
          sethasMorePostsInHome((prev) => true)
        } else {
          sethasMorePostsInHome((prev) => false)
        }
        if (posts) {
          setPosts((prev) => posts?.documents)
          let lastID = posts?.documents[posts?.documents.length - 1]?.$id
          setLastPostID((prev) => lastID)
          dispatch(getInitialPost({ initialPosts: posts?.documents }))
        }
      } else {
        setPosts((prev) => [...initialPost])
      }
    } catch (error) {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getAllPosts();
  }, []);

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

  }, [spinnerRef.current, posts])

  useEffect(() => {

    if (isIntersecting && hasMorePostsInHome) {
      const getAllPosts = async () => {

        let LastID = initialPost[initialPost?.length - 1]?.$id;
        const posts = await appwriteService.getPosts({ lastPostID: LastID })

        if (initialPost.length < posts?.total) {
          sethasMorePostsInHome((prev) => true)
        } else {
          sethasMorePostsInHome((prev) => false)
        }

        if (posts?.documents?.length === 0) {
          setIsLoading((prev) => false)
          return
        }
        let lastID = posts?.documents[posts?.documents?.length - 1]?.$id
        setLastPostID((prev) => lastID)
        dispatch(getInitialPost({ initialPosts: posts?.documents }))
      }
      getAllPosts()
    }

  }, [isIntersecting, hasMorePostsInHome])

  useEffect(() => {
    if (initialPost?.length !== 0) {
      setPosts((prev) => initialPost)
    } else {
      setPosts((prev) => [])
    }
  }, [initialPost])


  const HomePageRef = useRef()
  const lastScrollY = useRef(window.scrollY);
  const [isNavbarHidden, setisNavbarHidden] = useState(false)

  const handleScroll = (e) => {
    let position = e.target.scrollTop;

    sessionStorage.setItem('scrollPosition', position.toString());
    if (lastScrollY.current < position) {

      setisNavbarHidden(true)
    } else {

      setisNavbarHidden(false)
    }

    lastScrollY.current = position
  }


  useEffect(() => {

    if (HomePageRef.current) {

      const storedScrollPosition = sessionStorage.getItem('scrollPosition');
      const parsedScrollPosition = parseInt(storedScrollPosition, 10);

      HomePageRef.current.scrollTop = parsedScrollPosition
    }
  }, [HomePageRef.current, posts]);


  if (posts?.length > 0) {
    return <div
      id="Home"
      ref={HomePageRef}
      className={`${isDarkModeOn ? "darkMode" : ''}`}
      onScroll={handleScroll}
    >
      <section>
        <nav
          className={`Home_Nav_Container ${isNavbarHidden ? 'active' : ''} ${isDarkModeOn ? "darkMode" : ''}`}>
          <UpperNavigationBar />
          <HorizontalLine />
          <LowerNavigationBar />
        </nav>

        <div id="Home_RIGHT_LEFT" className={`relative flex gap-5 px-8 py-5 w-full ${isDarkModeOn ? "darkMode" : ''}`}>
          <div
            onClick={() => {
              if (homeLeft.current && homeRight.current) {
                homeLeft.current.classList.toggle("none");
              }
            }}
            className="Home_RIGHT_LEFT_Grid_div">
            <button
              className="flex justify-center items-center">
              <i className='bx bxs-grid-alt'></i>
            </button>
          </div>
          <div
            ref={homeLeft}
            className="Home_Left">
            {posts?.map((post) => (
              <div key={post?.$id} onClick={() => increaseViews(post?.$id)}>
                <PostCard {...post} />
              </div>
            ))}

            {(isLoading && hasMorePostsInHome) && <div ref={spinnerRef} className="flex justify-center">
              <span className="Home_loader"></span>
            </div>}

          </div>
          <div
            ref={homeRight}
            className={`Home_Right ${isNavbarHidden ? '' : 'active'}`}>
            <HomeRight />
          </div>
        </div>
      </section>

    </div>
  } else if (posts === false) {
    return <div
      id="Home"
      ref={HomePageRef}
      className="w-full relative"
      onScroll={handleScroll}
    >

      <section>
        <nav className={`Home_Nav_Container w-full text-center ${isNavbarHidden ? 'active' : ''}`}>
          <UpperNavigationBar />
          <HorizontalLine />
          <LowerNavigationBar />
        </nav>

        <div id="Home_RIGHT_LEFT" className={`flex gap-5 px-8 py-5 w-full`}>
          <div className="Home_Left flex flex-col gap-6 justify-center items-center font-semibold">
            <p className={`text-center select-none ${isDarkModeOn ? 'text-white' : 'text-black'}`}>Internet Connection Error</p>
            <Button onClick={() => {
              location.reload()
            }} className="Reload_Page_Btn">Reload Page</Button>
          </div>
          <div className={`Home_Right ${isNavbarHidden ? '' : 'active'}`}>
            <HomeRight />
          </div>
        </div>
      </section>

    </div>
  } else {
    return <div
      id="Home"
      ref={HomePageRef}
      className="w-full relative"
      onScroll={handleScroll}
    >
      <nav className={`Home_Nav_Container w-full text-center ${isNavbarHidden ? 'active' : ''}`}>
        <UpperNavigationBar className='' />
        <HorizontalLine />
        <LowerNavigationBar />
      </nav>

      <div id="Home_RIGHT_LEFT" className={`flex gap-5 px-8 py-5 w-full`}>
        <div className="Home_Left flex flex-col gap-6 justify-center items-center font-semibold">
          {initialPost?.length === 0 && <SecondLoader />}
        </div>
        <div className={`Home_Right ${isNavbarHidden ? '' : 'active'}`}>
          <HomeRight />
        </div>
      </div>

    </div>
  }


};

export default Home;
