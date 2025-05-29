const request = require("request");
const config = require("../config/constants.js");

exports.sendMail = async (user_email, subject, htmlToSend) => {
  try {
    let sync_url =
      "https://sestrack.technoalliance.in/v1/bmclinic_notification";

    let bodyData = {
      instituion: "NIMS_DXB",
      subject: subject,
      message: htmlToSend,
      mail_data: [
        {
          parent_name: "",
          parent_email: user_email,
        },
      ],
    };

    return new Promise(function (resolve, reject) {
      request.post(
        {
          headers: {
            "content-type": "application/json",
          },
          url: sync_url,
          body: JSON.stringify(bodyData),
        },
        (err, res, body) => {
          try {
            if (err) {
              console.log("err:::::", err);
              return resolve(false);
            }

            let parseBody = JSON.parse(body);
            console.log("__________________", parseBody, "__________________");
            if (parseBody) {
              return resolve(parseBody);
            } else {
              return resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};
