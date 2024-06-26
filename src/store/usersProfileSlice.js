import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    userProfileArr: [],
    flag: false,
};

const userProfileSlice = createSlice({
    name: "userProfileSlice",
    initialState,
    reducers: {
        getOtherUserProfile: (state, action) => {
            let arr = []
            arr = [...action.payload.userProfileArr, ...state.userProfileArr]
            let uniqueArray = Array.from(new Map(arr.map(obj => [obj?.$id, obj])).values());
            state.userProfileArr = uniqueArray
        },
    },
});

export const { getOtherUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;