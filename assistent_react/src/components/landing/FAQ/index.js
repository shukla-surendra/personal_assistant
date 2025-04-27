import Accordion from 'react-bootstrap/Accordion';
import appData from '../../../config.json';

const FAQ = () => {

    return (
        <>
            <section className="faq">
                <div className="container">
                    <div className="row">
                        <div className="col-md-5">
                            <h2>
                                {" "}
                                <span>FAQ's</span>Frequently <br />
                                Asked <br /> Questions
                            </h2>
                            <h6>Or drop email at</h6>
                            <div className="email">{appData.support_email}</div>
                        </div>
                        <div className="col-md-7 advantage-left ">
                            
                            <Accordion defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header > What if i had multiple members i want to add to my
                                        workspace?</Accordion.Header>
                                    <Accordion.Body>
                                        No worries even if you have multiple members to add. just copy
                                        the link from User settings and share, or you could add them
                                        with their email id.
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>
                                        Can i use google account to create FOKII account?
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        No worries even if you have multiple members to add. just copy
                                        the link from User settings and share, or you could add them
                                        with their email id.
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="2" >
                                    <Accordion.Header>
                                        Can i use google account to create FOKII account?
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        No worries even if you have multiple members to add. just copy
                                        the link from User settings and share, or you could add them
                                        with their email id.
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );

}

export default FAQ;