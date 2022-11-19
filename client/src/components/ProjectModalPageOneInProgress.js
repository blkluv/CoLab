import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faTiktok,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faAngleDown,
  faAngleUp,
  faSquareMinus,
} from "@fortawesome/free-solid-svg-icons";
import greyCircle from "../assets/greycircle.jpg";
import axios from "../api/axios";

const moment = require("moment");
const ADD_PROJECT_IMAGES_URL = "/api/addprojectimage";

const ProjectModalPageOneInProgress = ({
  id,
  reviewDeadline,
  deadline,
  tiktokTask,
  youtubeTask,
  instagramTask,
  status,
  handleSubmit,
}) => {
  // Page One - 2 - In Progress - Task Dropdowns
  const [showSubmitDraft, setShowSubmitDraft] = useState(false);
  const [showReviseDraft, setShowReviseDraft] = useState(false);

  const [instagramBtnTxt, setInstagramBtnTxt] = useState("Upload");
  const [tiktokBtnTxt, setTiktokBtnTxt] = useState("Upload");
  const [youtubeBtnTxt, setYoutubeBtnTxt] = useState("Upload");
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Copy and Pasta from Create Project Modal BEGIN - upload image
  const [socialExample, setSocialExample] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [awsImage, setAwsImage] = useState("");
  // holds the new project ID after succesful project creation
  const [project, setProject] = useState("");

  const uploadImgFileHandler = (e) => {
    console.log("file was chosen", e.target.files[0]);
    setSelectedFile(e.target.files[0]);
    setIsFilePicked(true);
  };

  const handleAwsUpload = async (e, type) => {
    e.preventDefault();
    let amazonURL;
    let file;
    let contentType;
    // get secure url from server
    if (type === "image") {
      file = selectedFile;
      contentType = "multipart/form-data";
    }
    try {
      const res = await axios.get("/api/s3");
      amazonURL = res.data.url;
      console.log("got the secure url from S3", amazonURL);
    } catch (error) {
      console.log(error);
    }

    // post the image to S3
    await fetch(amazonURL, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // withCredentials: true,
      body: file,
    });

    if (type === "image") {
      const imageURL = amazonURL.split("?")[0];
      console.log(imageURL);

      setAwsImage(imageURL);

      updateProjectExamples(imageURL);
    }
  };

  const updateProjectExamples = async (imageID, social, type) => {
    console.log("Image ID", imageID);
    console.log("Project ID", project._id);
    console.log("Adding an example to:", socialExample);

    try {
      const payload = JSON.stringify({
        projectID: id,
        imageURL: imageID,
        social: socialExample,
        type: "Submission",
      });
      console.log("Update Profile Payload", payload);
      const response = await axios.post(ADD_PROJECT_IMAGES_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      setUploadSuccessMsg(
        `Submission for  ${
          socialExample[0].toUpperCase() + socialExample.slice(1)
        } was succesfully uploaded! You may add more files for other submissions.`
      );
      console.log(
        "The example image was added to the project",
        response.data.project
      );

      // reset
      setSocialExample("");

      if (response.status === 200) {
      } else {
        alert(response.status);
      }
    } catch (err) {
      console.log(err);
    }
  };
  // Copy and Pasta from CreateProjectModal END

  return (
    <>
      <h1 className="form__text form__text--subheader-large">Deadlines</h1>
      <p className="form__text form__text--subheader">
        Upload first draft by:{" "}
        {moment(reviewDeadline).format("MMMM Do YYYY, h:mm:ss a")}
      </p>

      <p className="form__text form__text--subheader">
        Post to social media by:{" "}
        {moment(deadline).format("MMMM Do YYYY, h:mm:ss a")}
      </p>
      {!showUploadSuccess && status !== "brand reviewing" ? (
        <div className="project-modal-container">
          <h1 className="form__text form__text--subheader-large">Tasks</h1>
          {instagramTask ? (
            <>
              <p>
                <FontAwesomeIcon icon={faInstagram} className="icon-left" />
                {instagramTask} on Instagram.
              </p>
            </>
          ) : (
            ""
          )}
          {tiktokTask ? (
            <p>
              <FontAwesomeIcon icon={faTiktok} className="icon-left" />
              {tiktokTask} on Tik Tok.
            </p>
          ) : (
            ""
          )}
          {youtubeTask ? (
            <p>
              <FontAwesomeIcon icon={faYoutube} className="icon-left" />
              {youtubeTask} on YouTube.
            </p>
          ) : (
            " "
          )}

          <div className="guidelines-card">
            <div className="guidelines-card__header">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="icon-highlight guidelines-card__flex-one"
              />
              <div className="guidelines-card__flex-two">
                <h4>Next Step: Submit Draft</h4>
                <p className="deadline-text">
                  By {moment(reviewDeadline).format("MMMM Do YYYY, h:mm:ss a")}
                </p>
              </div>
              <button
                type="button"
                className="guidelines-card__flex-three guidelines-card__btn-expand"
                onClick={() => {
                  setShowSubmitDraft(!showSubmitDraft);
                }}
              >
                {showSubmitDraft ? (
                  <>
                    <FontAwesomeIcon icon={faAngleUp} />
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faAngleDown} />
                  </>
                )}
              </button>
            </div>
            {showSubmitDraft ? (
              <div className="project-modal-tasks-expand-container">
                {/* replaced by form */}
                {/* {instagramTask ? (
                  <div className="project-task">
                    <p className="">
                      <FontAwesomeIcon
                        icon={faInstagram}
                        className="icon-left"
                      />
                      {instagramTask}
                    </p>
                    <button
                      type="button"
                      className={
                        instagramBtnTxt === "Submitted"
                          ? "form__btn-dotted form__btn-dotted--success"
                          : "form__btn-dotted"
                      }
                      onClick={() => {
                        setInstagramBtnTxt("Submitted");
                      }}
                    >
                      {instagramBtnTxt}
                    </button>
                  </div>
                ) : (
                  ""
                )}

                {tiktokTask ? (
                  <div className="project-task">
                    <p className="">
                      <FontAwesomeIcon icon={faTiktok} className="icon-left" />
                      {tiktokTask}
                    </p>
                    <button
                      type="button"
                      className={
                        tiktokBtnTxt === "Submitted"
                          ? "form__btn-dotted form__btn-dotted--success"
                          : "form__btn-dotted"
                      }
                      onClick={() => {
                        setTiktokBtnTxt("Submitted");
                      }}
                    >
                      {tiktokBtnTxt}
                    </button>
                  </div>
                ) : (
                  ""
                )}
                {youtubeTask ? (
                  <div className="project-task">
                    <p className="">
                      <FontAwesomeIcon icon={faYoutube} className="icon-left" />
                      {youtubeTask}
                    </p>
                    <button
                      type="button"
                      className={
                        youtubeBtnTxt === "Submitted"
                          ? "form__btn-dotted form__btn-dotted--success"
                          : "form__btn-dotted"
                      }
                      onClick={() => {
                        setYoutubeBtnTxt("Submitted");
                      }}
                    >
                      {youtubeBtnTxt}
                    </button>
                  </div>
                ) : (
                  ""
                )} */}

                <form
                  className="form form--small"
                  encType="multipart/form-data"
                >
                  <label htmlFor="avatar" className="form__label">
                    File Upload
                  </label>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    onChange={uploadImgFileHandler}
                    required
                    className="create-project-form__input create-project-form__input--file"
                  />
                  <p id="uidnote" className="form__instructions">
                    Max 2MB, .png only
                  </p>
                  <label htmlFor="social">
                    Which deliverable is this an example for?
                  </label>
                  <select
                    name="social"
                    id="social"
                    onChange={(e) => {
                      console.log(e.target.value);
                      setSocialExample(e.target.value);
                    }}
                    value={socialExample}
                    className="form__input form__input--select "
                  >
                    <option value="none" className="form__social">
                      Select Platform
                    </option>
                    <option
                      value="instagram"
                      className="create-project-form__social"
                    >
                      Instagram
                    </option>
                    <option
                      value="tiktok"
                      className="create-project-form__social"
                    >
                      Tik Tok
                    </option>
                    <option
                      value="youtube"
                      className="create-project-form__social"
                    >
                      Youtube
                    </option>
                  </select>

                  <div className="flex-col-center">
                    {awsImage ? (
                      <img
                        className="form__profile-pic"
                        src={awsImage}
                        alt="aws avatar"
                      />
                    ) : (
                      <img
                        className="form__profile-pic"
                        src={greyCircle}
                        alt="blank avatar"
                      />
                    )}
                    {uploadSuccessMsg ? (
                      <p className="form__text form__text--success">
                        {uploadSuccessMsg}
                      </p>
                    ) : (
                      " "
                    )}
                    <button
                      type="submit"
                      onClick={(e) => handleAwsUpload(e, "image")}
                      className="update-profile__btn-cta"
                    >
                      Upload Photo
                    </button>

                    {/* {errMsg ? (
                  <p aria-live="assertive" className="update-profile__error">
                    {errMsg}
                  </p>
                ) : (
                  ""
                )} */}
                  </div>
                </form>

                <button
                  className="form__btn-dotted form__btn-dotted--large"
                  style={{ margin: "0 auto", marginTop: "1rem" }}
                  onClick={(e) => {
                    handleSubmit("influencer submit draft", e);
                    setShowSubmitDraft(false);
                    setShowUploadSuccess(true);
                  }}
                >
                  Finished Uploading? Request review.
                </button>
              </div>
            ) : (
              " "
            )}
          </div>
        </div>
      ) : (
        ""
      )}

      {showUploadSuccess ? (
        <>
          <p>
            Successfully submitted draft. Please wait for the brand to review.
          </p>
        </>
      ) : (
        ""
      )}
    </>
  );
};

export default ProjectModalPageOneInProgress;