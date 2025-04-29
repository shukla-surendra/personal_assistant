import decode from 'jwt-decode';
import ConfigService from '../utils/config'
import auth from '../utils/auth'
import { Select, Box } from '@chakra-ui/react';
import { FiChevronDown, FiLogOut } from 'react-icons/fi';

class AuthService {
	// retrieve data saved in token
	getProfile() {
		const userInfo = localStorage.getItem('user_info');
		return userInfo ? JSON.parse(userInfo) : null;
	}

	// check if the user is still logged in
	loggedIn() {
		// checks if there is a saved token and it's still valid
		const token = this.getToken();
		// use type coersion to check if the token is NOT undefined and the token is NOT expired
		return !!token && !this.isTokenExpired(token);
	}

	// Check if the token has expired
	isTokenExpired(token) {
		try {
			const decoded = decode(token);
			if (decoded.exp < Date.now() / 1000) {
				return true;
			} else {
				return false;
			}
		} catch (err) {
			return false;
		}
	}

	// Retrieve the token from localStorage
	getToken() {
		return localStorage.getItem('access_token');
	}

	// Set token to localStorage and reload page to the homepage
	login(loginResponse) {
		// Store the access token
		localStorage.setItem('access_token', loginResponse.access_token);
		
		// Store user info
		const userInfo = {
			user_id: loginResponse.user.user_id,
			email: loginResponse.user.email,
			first_name: loginResponse.user.first_name,
			last_name: loginResponse.user.last_name,
			role: loginResponse.user.role
		};
		localStorage.setItem('user_info', JSON.stringify(userInfo));
		
		// Set default workspace
		const default_workspace = {
			workspace_id: loginResponse.user.default_workspace.workspace_id,
			name: loginResponse.user.default_workspace.name
		};
		ConfigService.setDefaultWorkspace(default_workspace);
		ConfigService.setUserId(loginResponse.user.user_id);
		
		window.location.assign('/');
	}

	// lear token from localstorage and force logout with reload
	logout() {
		localStorage.removeItem('access_token');
		ConfigService.removeDefaultWorkspace()
		// reload the page and reset the state of the app
		window.location.assign('/');
	}
}
const authService = new AuthService();
export default authService;
