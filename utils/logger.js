
const logger = async (req, res, next) => {
    console.log(`Request Method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log(`Request Params: ${JSON.stringify(req.params)}`);
    console.log(`Request Query: ${JSON.stringify(req.query)}`);
    console.log(`Request Cookies: ${JSON.stringify(req.cookies)}`);
    console.log(`Request Time: ${new Date().toISOString()}`);
    console.log(`----------------------`)

    next();
}

module.exports = logger;
