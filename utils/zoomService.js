const axios = require('axios');
const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = require('./config');


const zoomService = {
/**
 * Fetches an access token from Zoom using account credentials.
 *
 * @async
 * @function
 * @returns {Promise<string>} The access token to be used in API requests.
 * @throws Will throw an error if the request to Zoom fails.
 */

  getZoomAccessToken: async (req, res) => {
    try {
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'account_credentials',
          account_id: ZOOM_ACCOUNT_ID,
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      });

      const { access_token, refresh_token } = response.data;

      return access_token; // Return the token to use in the API requests.
    } catch (error) {
      console.error('Error getting Zoom access token:', error.response?.data || error.message);
      throw error;
    }
  },

/**
 * Refreshes the Zoom access token using the provided refresh token.
 *
 * @async
 * @function
 * @param {string} refreshToken - The refresh token used to obtain a new access token.
 * @returns {Promise<string>} The new access token to be used in API requests.
 * @throws Will throw an error if the request to Zoom fails.
 */

  refreshZoomAccessToken: async (refreshToken) => {
    try {
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      });

      const { access_token, refresh_token } = response.data;

      // Save the new access token and refresh token in your DB or secure storage.
      return access_token;
    } catch (error) {
      console.error('Error refreshing Zoom access token:', error.response?.data || error.message);
      throw error;
    }
  },
};

module.exports = zoomService;
