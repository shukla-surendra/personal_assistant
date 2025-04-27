import axios from "axios";
import Auth from './utils/auth'
import Config from './utils/config'

const access_token = Auth.getToken()
const workspace = Config.getDefaultWorkspace()

function getBackendUrl() {
  if (process.env.REACT_APP_ENV === 'production') {
    return process.env.REACT_APP_BACKEND_PROD_URL;
  } else {
    return process.env.REACT_APP_BACKEND_DEV_URL;
  }
}


export default axios.create({
  baseURL: getBackendUrl(),
  headers: {
    "Content-type": "application/json",
    Authorization: `Bearer ${access_token}`,
    "Workspace-Id": `${workspace.workspace_id}`
  }
});