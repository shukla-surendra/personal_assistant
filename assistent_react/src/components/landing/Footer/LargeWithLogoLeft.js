import appData from '../../../config.json';
import { Text } from '@chakra-ui/react';


export default function LargeWithLogoLeft() {
    return (
        <>
            <footer className="footer">
                <div className="container">
                    <div className="row">
                        <div className="col-md-4">
                            <img src={appData.logo} />
                            <p>
                                {appData.office_address}
                            </p>
                            <a href="">{appData.support_email}</a>
                        </div>
                        <div className="col-md-8">
                            <div className="row">
                                <div className="col-md-3">
                                    <h3> Product</h3>
                                    <ul>
                                        <li>
                                            <a href="">Wikis</a>
                                        </li>
                                        <li>
                                            <a href="">Projects</a>
                                        </li>
                                        <li>
                                            <a href="">Docs</a>
                                        </li>
                                        <li>
                                            <a href="">What's New</a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="col-md-3">
                                    <h3> Get Started</h3>
                                    <ul>
                                        <li>
                                            <a href="">Sign Up</a>
                                        </li>
                                        <li>
                                            <a href="">What's New</a>Login
                                        </li>
                                    </ul>
                                </div>
                                <div className="col-md-3">
                                    <h3> Solutions</h3>
                                    <ul>
                                        <li>
                                            <a href="">Small business</a>
                                        </li>
                                        <li>
                                            <a href="">Personal use</a>
                                        </li>
                                        <li>
                                            <a href="">Remote work</a>
                                        </li>
                                        <li>
                                            <a href="">Startups</a>
                                        </li>
                                        <li>
                                            <a href="">Manager</a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="col-md-3">
                                    <h3> Resource</h3>
                                    <ul>
                                        <li>
                                            <a href="">About us</a>
                                        </li>
                                        <li>
                                            <a href="">Pricing</a>
                                        </li>
                                        <li>
                                            <a href="">Email us</a>
                                        </li>
                                        <li>
                                            <a href="">Security</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row social-foot">
                        <div className="col">
                            <ul>
                                <li>
                                    <a href={appData.twitter_link}>
                                        <i className="fa fa-twitter" aria-hidden="true" />
                                    </a>
                                </li>
                                <li>
                                    <a href={appData.linkedin_link}>
                                        <i className="fa fa-linkedin" aria-hidden="true" />
                                    </a>
                                </li>
                                <li>
                                    <a href={appData.instagram_link}>
                                        <i className="fa fa-instagram" aria-hidden="true" />
                                    </a>
                                </li>
                                {/* <li>
                        <a href="">
                            <i className="fa fa-facebook-square" aria-hidden="true" />
                        </a>
                    </li> */}


                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
            <div className="foot-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col">
                            <h6>
                                <i className="fa fa-copyright" aria-hidden="true" /> 2023 Copyright
                                - {appData.project_name}.
                            </h6>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}