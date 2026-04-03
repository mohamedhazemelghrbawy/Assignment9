export const emailTemplate = (userName, otp, message = "on Saraha App") => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Saraha Message</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: Arial, sans-serif;
    }
    table {
      border-spacing: 0;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: #6c63ff;
      color: white;
      text-align: center;
      padding: 20px;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 25px;
      color: #333;
      line-height: 1.6;
    }
    .message-box {
      background: #f1f1f1;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-style: italic;
    }
    .button {
      display: inline-block;
      padding: 12px 20px;
      background: #6c63ff;
      color: #fff;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888;
      padding: 15px;
    }
  </style>
</head>
<body>
  <table width="100%">
    <tr>
      <td>
        <table class="container">
          <tr>
            <td class="header">
              📩 New otp code Message
            </td>
          </tr>

          <tr>
            <td class="content">
              
              <h3>Hello {${userName}} , Welcome to sarahaApp</h3>

              <p>You have received a new  otp  <strong>${message}</strong> 👀</p>

              <div class="message-box">
                Code: ${otp}
              </div>

              <p>Want to reply or check more messages?</p>

              <a href="{{profileLink}}" class="button">View Profile</a>

              <p style="margin-top:20px; font-size:13px; color:#666;">
                Note: This message was sent anonymously. You cannot see the sender.
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              &copy; 2026 Saraha App — All rights reserved
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
