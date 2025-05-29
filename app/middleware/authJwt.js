const jwt = require("jsonwebtoken");
const config = require("../config/constants.js");
const db = require("../models");
const { Op } = require("sequelize");
const User = db.user;
verifyToken = (req, res, next) => {
  // if (req.headers["x-tracker-key"] === config.TRACKER_API_KEY) {
  //   next();
  //   return;
  // }

  let token = req.headers["x-access-token"];
  if (!token) {
    return res.status(config.HTTP_STATUS.FORBIDDEN.code).send({
      status: config.HTTP_STATUS.FORBIDDEN,
      response: {
        message: "No token provided!",
      },
    });
  }
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(config.HTTP_STATUS.NOT_AUTHENTICATED.code).send({
        status: config.HTTP_STATUS.NOT_AUTHENTICATED,
        response: {
          message: "You are not an authorized user!",
        },
      });
    }
    req.user_id = decoded.id;
    req.company_id = decoded.company;
    req.role = decoded.role;
    next();
  });
};
isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Admin Role!",
      });
      return;
    });
  });
};
isModerator = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Moderator Role!",
      });
    });
  });
};
isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Moderator or Admin Role!",
      });
    });
  });
};

//event auth
// async function eventAuth(req, res, next) {
// const Event = db.event
//   if (!req.params.id || !req.user_id) {
//     next();
//     return;
//   }

//   const event_id = req.params.id;
//   const user_id = req.user_id;

//   if (req.role === 'rde_admin') {

//     const event = await Event.findOne({
//       attributes: ['event_id', 'motus_user'],
//       where: {
//         event_id: event_id,
//       }
//     });

//     if (!event) {
//       return res.json(error1('Event not found'));
//     }
//     return next();
//   }

//   if (req.role === "client") {
//     const userData = await db.clientperson.findOne({
//       where: { user_id: req.user_id },
//     });

//     const eveidData = await db.clientpersonevent.findAll({
//       where: { client_person_id: userData.client_person_id },
//       attributes: ["event_id"],
//       raw: true,
//     });
//     const eventIds = eveidData.map(event => event.event_id);
//     console.log(eventIds,"ddddddddddddddddddddddddddddddddddddddddddd")

//     console.log("Allowed event IDs:", eventIds);
//     console.log("Requested event ID:", event_id);

//     if (!eventIds.includes(event_id)) {
//       return res.json(error2('Access denied'));
//     }

//     const event = await db.event.findOne({
//       attributes: ['event_id', 'motus_user'],
//       where: {
//         event_id: event_id,
//       }
//     });

//     if (!event) {
//       return res.json(error1('Event not found'));
//     }

//     if (!eventIds.includes(event_id)) {
//       return res.json(error2('Access denied'));
//     }

//     return next();
//   }

//   const event = await Event.findOne({
//     attributes: ['event_id', 'motus_user'],
//     where: {
//       event_id: event_id,
//     }
//   });

//   if (!event) {
//     return res.json(error1('Event not found'));
//   }

//   if (!event.motus_user || !event.motus_user.includes(user_id)) {
//     return res.json(error2('Access denied'));
//   }

//   return next();
// }

async function eventAuth(req, res, next) {
  const Event = db.event;

  if (!req.params.id || !req.user_id) {
    next();
    return;
  }

  const event_id = parseInt(req.params.id);
  const user_id = req.user_id;

  if (req.role === "rde_admin") {
    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }
    return next();
  }

  if (
    req.role === "project_manager" ||
    req.role === "dispatch_manager" ||
    req.role === "dispatch_member"
  ) {
    // const userEvents = await Event.findAll({
    //   where: {
    //     motus_user: {
    //       [Op.contains]: [req.user_id],
    //      // is_commission:true
    //     }
    //   },
    //   attributes: ['event_id'],
    //   raw: true,
    // });

    const userData = req.user_id;
    const userId = userData.motus_user;
    const eveidData = await Event.findAll({
      where: {
        motus_user: {
          [Op.contains]: [req.user_id],
        },
      },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((result) => result.event_id);

    // const eventIds = userEvents.map(event => event.event_id.toString());
    // const event = await Event.findOne({
    //   attributes: ['event_id', 'motus_user'],
    //   where: {
    //     event_id: event_id,
    //   }
    // });

    if (!eveidData) {
      return res.json(error1("Event not found"));
    }
    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "client") {
    const userData = await db.clientperson.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.clientpersonevent.findAll({
      where: { client_person_id: userData.client_person_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);
    console.log("Allowed event IDs:", eventIds);
    console.log("Requested event ID:", event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "supplier") {
    const userData = await db.suppliercontact.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.supplierpersonevent.findAll({
      where: { supplier_persons_id: userData.supplier_persons_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  const event = await Event.findOne({
    attributes: ["event_id", "motus_user"],
    where: {
      event_id: event_id,
    },
  });

  if (!event) {
    return res.json(error1("Event not found"));
  }

  if (!event.motus_user || !event.motus_user.includes(user_id)) {
    return res.json(error2("Access denied"));
  }

  return next();
}

//for post api
async function eventAuth1(req, res, next) {
  const Event = db.event;

  if (!req.body.event_id || !req.user_id) {
    next();
    return;
  }

  const event_id = parseInt(req.body.event_id);
  const user_id = req.user_id;

  if (req.role === "rde_admin") {
    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }
    return next();
  }

  if (req.role === "client") {
    const userData = await db.clientperson.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.clientpersonevent.findAll({
      where: { client_person_id: userData.client_person_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);
    console.log("Allowed event IDs:", eventIds);
    console.log("Requested event ID:", event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "supplier") {
    const userData = await db.suppliercontact.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.supplierpersonevent.findAll({
      where: { supplier_persons_id: userData.supplier_persons_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  const event = await Event.findOne({
    attributes: ["event_id", "motus_user"],
    where: {
      event_id: event_id,
    },
  });

  if (!event) {
    return res.json(error1("Event not found"));
  }

  if (!event.motus_user || !event.motus_user.includes(user_id)) {
    return res.json(error2("Access denied"));
  }

  return next();
}

//validtin booking list
async function eventAuth2(req, res, next) {
  let booking_id = req.params.id;

  if (req.role === "rde_admin") {
    const booking = await db.booking.findOne({
      where: {
        booking_id: booking_id,
      },
      attributes: ["event_id"],
    });
    if (!booking) {
      res.json(error1("Booking not found"));
    }

    return next();
  }

  const booking = await db.booking.findOne({
    where: {
      booking_id: booking_id,
    },
  });
  if (!booking) {
    res.json(error1("Booking not found"));
  }

  const event_id = parseInt(booking.event_id);
  const user_id = req.user_id;

  if (req.role === "client") {
    const userData = await db.clientperson.findOne({
      where: { user_id: req.user_id },
    });
    const eveidData = await db.clientpersonevent.findAll({
      where: { client_person_id: userData.client_person_id },
      attributes: ["event_id"],
      raw: true,
    });
    const eventIds = eveidData.map((result) => result.event_id);

    const booking = await db.booking.findOne({
      where: {
        booking_id: booking_id,
        event_id: event_id,
      },
    });
    if (!booking) {
      res.json(error1("Booking not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "supplier") {
    const userData = await db.suppliercontact.findOne({
      where: { user_id: req.user_id },
    });
    const eveidData = await db.supplierpersonevent.findAll({
      where: { supplier_persons_id: userData.supplier_persons_id },
      attributes: ["event_id"],
      raw: true,
    });
    const eventIds = eveidData.map((result) => result.event_id);

    const booking = await db.booking.findOne({
      where: {
        booking_id: booking_id,
        event_id: event_id,
      },
    });
    if (!booking) {
      res.json(error1("Booking not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  const event = await Event.findOne({
    attributes: ["event_id", "motus_user"],
    where: {
      event_id: event_id,
    },
  });

  if (!event) {
    return res.json(error1("Event not found"));
  }

  if (!event.motus_user || !event.motus_user.includes(user_id)) {
    return res.json(error2("Access denied"));
  }

  return next();
}

async function eventAuth3(req, res, next) {
  const Event = db.event;

  if (!req.params.eventId || !req.user_id) {
    next();
    return;
  }

  const event_id = parseInt(req.params.eventId);
  const user_id = req.user_id;

  if (req.role === "rde_admin") {
    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }
    return next();
  }

  if (req.role === "client") {
    const userData = await db.clientperson.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.clientpersonevent.findAll({
      where: { client_person_id: userData.client_person_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);
    console.log("Allowed event IDs:", eventIds);
    console.log("Requested event ID:", event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "supplier") {
    const userData = await db.suppliercontact.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.supplierpersonevent.findAll({
      where: { supplier_persons_id: userData.supplier_persons_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  const event = await Event.findOne({
    attributes: ["event_id", "motus_user"],
    where: {
      event_id: event_id,
    },
  });

  if (!event) {
    return res.json(error1("Event not found"));
  }

  if (!event.motus_user || !event.motus_user.includes(user_id)) {
    return res.json(error2("Access denied"));
  }

  return next();
}

async function eventAuth4(req, res, next) {
  const Event = db.event;

  if (!req.params.id || !req.user_id) {
    next();
    return;
  }

  const event_id = parseInt(req.params.id);
  const user_id = req.user_id;

  if (req.role === "rde_admin") {
    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }
    return next();
  }

  if (req.role === "client") {
    const userData = await db.clientperson.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.clientpersonevent.findAll({
      where: { client_person_id: userData.client_person_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);
    console.log("Allowed event IDs:", eventIds);
    console.log("Requested event ID:", event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  if (req.role === "supplier") {
    const userData = await db.suppliercontact.findOne({
      where: { user_id: user_id },
    });

    if (!userData) {
      return res.json(error2("User not found"));
    }

    const eveidData = await db.supplierpersonevent.findAll({
      where: { supplier_persons_id: userData.supplier_persons_id },
      attributes: ["event_id"],
      raw: true,
    });

    const eventIds = eveidData.map((event) => event.event_id);

    const event = await Event.findOne({
      attributes: ["event_id", "motus_user"],
      where: {
        event_id: event_id,
      },
    });

    if (!event) {
      return res.json(error1("Event not found"));
    }

    if (!eventIds.includes(event_id)) {
      return res.json(error2("Access denied"));
    }

    return next();
  }

  const event = await Event.findOne({
    attributes: ["event_id", "motus_user"],
    where: {
      event_id: event_id,
    },
  });

  if (!event) {
    return res.json(error1("Event not found"));
  }

  if (!event.motus_user || !event.motus_user.includes(user_id)) {
    return res.json(error2("Access denied"));
  }

  return next();
}

const authJwt = {
  verifyToken: verifyToken,
  //   isAdmin: isAdmin,
  //   isModerator: isModerator,
  //   isModeratorOrAdmin: isModeratorOrAdmin
  eventAuth,
  eventAuth1,
  eventAuth2,
  eventAuth3,
  eventAuth4,
};
module.exports = authJwt;
