const asyncHendler = (requestHendler) => {
    return (req, res, next) => {
        Promise.resolve (requestHendler(req, res, next))
        .catch((err) => next(err));
    };
}

export default asyncHendler ;




// const asyncHendler = () => {};
// const asyncHendler = () => () => {};
// const asyncHendler = (func) => async() => {};


// const asyncHendler = (fn) => async(req, res, next) => { 
//     try {
        
//     } catch (error) {
//         res.status(err.code || 404).json({
//             success: false,
//             message: error.message
//         })
//     }
//  }
