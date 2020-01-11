import axios from 'axios'

const url = 'api/posts/'

class PostService {
    //Get Posts
    static getPosts() {
        return new Promise(async (resolve, reject) => {
            try{
                const res = await axios.get(url)
                const data = res.data
                resolve(
                    data.map(post => ( {
                        ...post,
                        createdAt: new Date(post.createdAt)
                    }))
                )
            } catch(err) {
                reject(err)
            }
        })
    }

    // Create Post
    static insertPost(pv_v, grid_v) {
        return axios.post(url, {
            pv : pv_v, 
            grid : grid_v
        })
    }

    // Delete Post
    static deletePost(id) {
        return axios.delete(`${url}${id}`)
    }
}

export default PostService