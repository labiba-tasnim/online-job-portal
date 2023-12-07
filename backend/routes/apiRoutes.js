const express = require("express");
const jwtAuth = require("../lib/jwtAuth");
const mongoose = require("mongoose");
// const socketIO = require('socket.io')

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Connection = require("../db/Connection");
const Conversations = require("../db/Conversation");
const Message = require("../db/Message");
const router = express.Router();

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;

  let job = new Job({
    userId: user._id,
    title: data.title,
    maxApplicants: data.maxApplicants,
    maxPositions: data.maxPositions,
    dateOfPosting: data.dateOfPosting,
    deadline: data.deadline,
    skillsets: data.skillsets,
    jobType: data.jobType,
    duration: data.duration,
    salary: data.salary,
  });

  job
    .save()
    .then(() => {
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  let user = req.user;

  let findParams = {};
  let sortParams = {};

  // to list down jobs posted by a particular recruiter
  if (user.type === "recruiter" && req.query.myjobs) {
    findParams = {
      ...findParams,
      userId: user._id,
    };
  }

  if (req.query.q) {
    findParams = {
      ...findParams,
      title: {
        $regex: new RegExp(req.query.q, "i"),
      },
    };
  }

  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    console.log(jobTypes);
    findParams = {
      ...findParams,
      jobType: {
        $in: jobTypes,
      },
    };
  }

  if (req.query.salaryMin && req.query.salaryMax) {
    findParams = {
      ...findParams,
      $and: [
        {
          salary: {
            $gte: parseInt(req.query.salaryMin),
          },
        },
        {
          salary: {
            $lte: parseInt(req.query.salaryMax),
          },
        },
      ],
    };
  } else if (req.query.salaryMin) {
    findParams = {
      ...findParams,
      salary: {
        $gte: parseInt(req.query.salaryMin),
      },
    };
  } else if (req.query.salaryMax) {
    findParams = {
      ...findParams,
      salary: {
        $lte: parseInt(req.query.salaryMax),
      },
    };
  }

  if (req.query.duration) {
    findParams = {
      ...findParams,
      duration: {
        $lt: parseInt(req.query.duration),
      },
    };
  }

  if (req.query.asc) {
    if (Array.isArray(req.query.asc)) {
      req.query.asc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: 1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.asc]: 1,
      };
    }
  }

  if (req.query.desc) {
    if (Array.isArray(req.query.desc)) {
      req.query.desc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: -1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.desc]: -1,
      };
    }
  }

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  let arr = [
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "userId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    { $match: findParams },
  ];

  if (Object.keys(sortParams).length > 0) {
    arr = [
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "userId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      { $match: findParams },
      {
        $sort: sortParams,
      },
    ];
  }

  arr.push(
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  const aggregator = [
    {
      $facet: {
        results: arr,
        totalCount: [
          { $match: findParams },
          { $count: "count" },
        ],
      }
    },
    {
      $project: {
        results: 1,
        totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
      }
    }
  ]

  Job.aggregate(aggregator)
  .then((result) => {
    const { results, totalCount } = result[0];
    
    if (results.length === 0) {
      res.status(404).json({
        message: "No job found",
      });
      return;
    }

    res.json({
      results,
      totalCount,
      hasNextPage: (page * limit) < totalCount,
    });
  })
  .catch((err) => {
    console.log('err is', err);
    res.status(400).json(err);
  });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      res.json(job);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      if (data.maxApplicants) {
        job.maxApplicants = data.maxApplicants;
      }
      if (data.maxPositions) {
        job.maxPositions = data.maxPositions;
      }
      if (data.deadline) {
        job.deadline = data.deadline;
      }
      job
        .save()
        .then(() => {
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});


// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
    const user = req.user;
    if (user.type === "recruiter") { 
      Recruiter.findOne({ userId: user._id })
        .then((recruiter) => {    
          if (recruiter == null) {
            res.status(404).json({
              message: "User does not exist",
            });
            return;
          }
          res.json(recruiter);
        })
        .catch((err) => {
          res.status(400).json(err);
        });

    } else {
      JobApplicant.findOne({ userId: user._id })
        .then((jobApplicant) => {
          if (jobApplicant == null) {
            res.status(404).json({
              message: "User does not exist",
            });
            return;
          }
          res.json(jobApplicant);
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    }
  });
  
  // get user details from id
  router.get("/user/:id", jwtAuth, (req, res) => {
    User.findOne({ _id: req.params.id })
      .then((userData) => {
        if (userData === null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
  
        if (userData.type === "recruiter") {
          Recruiter.findOne({ userId: userData._id })
            .then((recruiter) => {
              if (recruiter === null) {
                res.status(404).json({
                  message: "User does not exist",
                });
                return;
              }
              res.json(recruiter);
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          JobApplicant.findOne({ userId: userData._id })
            .then((jobApplicant) => {
              if (jobApplicant === null) {
                res.status(404).json({
                  message: "User does not exist",
                });
                return;
              }
              res.json(jobApplicant);
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  });
  
  // update user details
  router.put("/user", jwtAuth, (req, res) => {
    const user = req.user;
    const data = req.body;
    if (user.type == "recruiter") {
      Recruiter.findOne({ userId: user._id })
        .then((recruiter) => {
          if (recruiter == null) {
            res.status(404).json({
              message: "User does not exist",
            });
            return;
          }
          if (data.name) {
            recruiter.name = data.name;
          }
          if (data.contactNumber) {
            recruiter.contactNumber = data.contactNumber;
          }
          if (data.bio) {
            recruiter.bio = data.bio;
          }
          recruiter
            .save()
            .then(() => {
              res.json({
                message: "User information updated successfully",
              });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      JobApplicant.findOne({ userId: user._id })
        .then((jobApplicant) => {
          if (jobApplicant == null) {
            res.status(404).json({
              message: "User does not exist",
            });
            return;
          }
          if (data.name) {
            jobApplicant.name = data.name;
          }
          if (data.education) {
            jobApplicant.education = data.education;
          }
          if (data.skills) {
            jobApplicant.skills = data.skills;
          }
          if (data.resume) {
            jobApplicant.resume = data.resume;
          }
          if (data.profile) {   
            jobApplicant.profile = data.profile;
          }
          console.log(jobApplicant);
          jobApplicant
            .save()  
            .then(() => {
              res.json({
                message: "User information updated successfully",
              });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          res.status(400).json(err);  
        });
    }
  });

  // Connection
  router.post('/user/me/connections/:id', jwtAuth, async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const myId = user._id.toString();

    if (myId === id) {
      return res.status(400).send('Cannot connect with self');
    }

    const existingConnection = await Connection.findOne({ 
      $or: [
        { userA: id, userB: myId },
        { userA: myId, userB: id }
      ]
    }).lean().exec();

    if (existingConnection) {
      return res.send(existingConnection);
    }

    const connection = new Connection({
      userA: myId,
      userB: id
    });

    await connection.save();

    res.send(connection);
  });

  router.get('/user/me/connections', jwtAuth, async (req, res) => {
    const user = req.user;
    const myId = user._id.toString();
    console.log('idsd', myId);

    const results = await Connection.aggregate([
      {
          $match: {
              $or: [
                  { userA: mongoose.Types.ObjectId(myId) },
                  { userB: mongoose.Types.ObjectId(myId) },
              ],
          },
      },
      {
          $project: {
              user: {
                  $cond: {
                      if: { $eq: ['$userA', mongoose.Types.ObjectId(myId)] },
                      then: '$userB',
                      else: '$userA',
                  },
              },
          },
      },
      {
          $lookup: {
              from: 'recruiterinfos',
              localField: 'user',
              foreignField: 'userId',
              as: 'recruiter',
          },
      },
      {
          $lookup: {
              from: 'jobapplicantinfos',
              localField: 'user',
              foreignField: 'userId',
              as: 'applicant',
          },
      },
      {
          $lookup: {
              from: 'userauths',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
          },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
      {
          $project: {
              user: 1,
              recruiter: 1,
              applicant: 1,
          },
      },
      {
          $match: {
              'user._id': { $ne: mongoose.Types.ObjectId(myId) },
          },
      },
  ]);
    

    res.send(results);
  });

  router.delete('/user/me/connections/:id', jwtAuth, async (req, res) => {
    const myId = req.user._id;
    const connId = req.params.id;

    const op = await Connection.findOneAndDelete({
      $or: [
        { userA: myId, userB: connId },
        { userA: connId, userB: myId },

      ]
    })

    res.send({ op });
  });



  // Search
  router.get('/search/user', jwtAuth, async (req, res) => {
    const { query } = req.query;
    const results = await User.aggregate([
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "_id",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "_id",
          foreignField: "userId",
          as: "applicant",
        },
      },
      { $unwind: {
        path: '$applicant',
        preserveNullAndEmptyArrays: true,
      }, },
      { $unwind: {
        path: '$recruiter',
        preserveNullAndEmptyArrays: true,
      }, },
      {
        $match: {
          $or: [
            { 'applicant.name': { $regex: new RegExp(query, 'i') } },
            { 'recruiter.name': { $regex: new RegExp(query, 'i') } },
          ],
          _id: { $ne: req.user._id }
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          type: 1,
          name: {
            $cond: {
              if: { $eq: ['$type', 'applicant'] },
              then: '$applicant.name',
              else: '$recruiter.name',
            },
          },
        },
      },
    ]);

    res.send({ results });
  });


  // apply for a job [todo: test: done]

  router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
    const user = req.user;

    if (user.type === "recruiter") {
      Recruiter.findOne({ userId: user._id })
        .then((recruiter) => {
          if (recruiter) {
            recruiter.notifications.push({
              message: "New job application received",
            });
            return recruiter.save();
          }
        })
        .then(() => {
          res.json({
            message: "Job application successful",
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      const data = req.body;
      const jobId = req.params.id;

      // check whether applied previously
      // find job
      // check count of active applications < limit
      // check user had < 10 active applications && check if the user is not having any accepted jobs (user id)
      // store the data in applications

      Application.findOne({
        userId: user._id,
        jobId: jobId,
        status: {
          $nin: ["deleted", "accepted", "cancelled", "finished"],
        },
      })
        .then((appliedApplication) => {
          console.log(appliedApplication);
          if (appliedApplication !== null) {
            res.status(400).json({
              message: "You have already applied for this job",
            });
            return;
          }

          Job.findOne({ _id: jobId })
            .then((job) => {
              if (job === null) {
                res.status(404).json({
                  message: "Job does not exist",
                });
                return;
              }
              Application.countDocuments({
                jobId: jobId,
                status: {
                  $nin: ["rejected", "deleted", "cancelled", "finished"],
                },
              })
                .then((activeApplicationCount) => {
                  if (activeApplicationCount < job.maxApplicants) {
                    Application.countDocuments({
                      userId: user._id,
                      status: {
                        $nin: ["rejected", "deleted", "cancelled", "finished"],
                      },
                    })
                      .then((myActiveApplicationCount) => {
                        if (myActiveApplicationCount < 10) {
                          Application.countDocuments({
                            userId: user._id,
                            status: "accepted",
                          }).then((acceptedJobs) => {
                            if (acceptedJobs === 0) {
                              const application = new Application({
                                userId: user._id,
                                recruiterId: job.userId,
                                jobId: job._id,
                                status: "applied",
                                sop: data.sop,
                              });

                              application
                                .save()
                                .then(() => {
                                  res.json({
                                    message: "Job application successful",
                                  });
                                })
                                .catch((err) => {
                                  res.status(400).json(err);
                                });
                            } else {
                              res.status(400).json({
                                message:
                                  "You already have an accepted job. Hence you cannot apply.",
                              });
                            }
                          });
                        } else {
                          res.status(400).json({
                            message:
                              "You have 10 active applications. Hence you cannot apply.",
                          });
                        }
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  } else {
                    res.status(400).json({
                      message: "Application limit reached",
                    });
                  }
                })
                .catch((err) => {
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    }
  });

  
  // recruiter gets applications for a particular job [pagination] [todo: test: done]
  router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
    const user = req.user;
    if (user.type != "recruiter") {
      res.status(401).json({
        message: "You don't have permissions to view job applications",
      });
      return;
    }
    const jobId = req.params.id;
  
    // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
    // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
    // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;
  
    let findParams = {
      jobId: jobId,
      recruiterId: user._id,
    };
  
    let sortParams = {};
  
    if (req.query.status) {
      findParams = {
        ...findParams,
        status: req.query.status,
      };
    }
  
    Application.find(findParams)
      .collation({ locale: "en" })
      .sort(sortParams)
      // .skip(skip)
      // .limit(limit)
      .then((applications) => {
        res.json(applications);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  });
  
  // recruiter/applicant gets all his applications [pagination]
  router.get("/applications", jwtAuth, (req, res) => {
    const user = req.user;
  
    // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
    // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
    // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;
  
    Application.aggregate([
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "recruiterId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      {
        $match: {
          [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
        },
      },
      {
        $sort: {
          dateOfApplication: -1,
        },
      },
    ])
      .then((applications) => {
        res.json(applications);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  });

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put("/applications/:id", jwtAuth, (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;

  // "applied", // when a applicant is applied
  // "shortlisted", // when a applicant is shortlisted
  // "accepted", // when a applicant is accepted
  // "rejected", // when a applicant is rejected
  // "deleted", // when any job is deleted
  // "cancelled", // an application is cancelled by its author or when other application is accepted
  // "finished", // when job is over

  if (user.type === "recruiter") {
    if (status === "accepted") {
      // get job id from application
      // get job info for maxPositions count
      // count applications that are already accepted
      // compare and if condition is satisfied, then save

      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            res.status(404).json({
              message: "Application not found",
            });
            return;
          }

          Job.findOne({
            _id: application.jobId,
            userId: user._id,
          }).then((job) => {
            if (job === null) {
              res.status(404).json({
                message: "Job does not exist",
              });
              return;
            }

            Application.countDocuments({
              recruiterId: user._id,
              jobId: job._id,
              status: "accepted",
            }).then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxPositions) {
                // accepted
                application.status = status;
                application.dateOfJoining = req.body.dateOfJoining;
                application
                  .save()
                  .then(() => {
                    Application.updateMany(
                      {
                        _id: {
                          $ne: application._id,
                        },
                        userId: application.userId,
                        status: {
                          $nin: [
                            "rejected",
                            "deleted",
                            "cancelled",
                            "accepted",
                            "finished",
                          ],
                        },
                      },
                      {
                        $set: {
                          status: "cancelled",
                        },
                      },
                      { multi: true }
                    )
                      .then(() => {
                        if (status === "accepted") {
                          Job.findOneAndUpdate(
                            {
                              _id: job._id,
                              userId: user._id,
                            },
                            {
                              $set: {
                                acceptedCandidates: activeApplicationCount + 1,
                              },
                            }
                          )
                            .then(() => {
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              res.status(400).json(err);
                            });
                        } else {
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      Application.findOneAndUpdate(
        {
          _id: id,
          recruiterId: user._id,
          status: {
            $nin: ["rejected", "deleted", "cancelled"],
          },
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((application) => {
          if (application === null) {
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      console.log(id);
      console.log(user._id);
      Application.findOneAndUpdate(
        {
          _id: id,
          userId: user._id,
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((tmp) => {
          console.log(tmp);
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
router.get("/applicants", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type === "recruiter") {
    let findParams = {
      recruiterId: user._id,
    };
    if (req.query.jobId) {
      findParams = {
        ...findParams,
        jobId: new mongoose.Types.ObjectId(req.query.jobId),
      };
    }
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        findParams = {
          ...findParams,
          status: { $in: req.query.status },
        };
      } else {
        findParams = {
          ...findParams,
          status: req.query.status,
        };
      }
    }
    let sortParams = {};

    if (!req.query.asc && !req.query.desc) {
      sortParams = { _id: 1 };
    }

    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        req.query.asc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: 1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.asc]: 1,
        };
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        req.query.desc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: -1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.desc]: -1,
        };
      }
    }

    Application.aggregate([
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: findParams },
      { $sort: sortParams },
    ])
      .then((applications) => {
        if (applications.length === 0) {
          res.status(404).json({
            message: "No applicants found",
          });
          return;
        }
        res.json(applications);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

router.post("/applications/:id/comments", jwtAuth, (req, res) => {
  const user = req.user;
  const applicationId = req.params.id;
  const commentText = req.body.text;

  // Validate input...

  Application.findOneAndUpdate(
    { _id: applicationId, userId: user._id },
    {
      $push: {
        comments: {
          userId: user._id,
          text: commentText,
        },
      },
    },
    { new: true }
  )
    .then((updatedApplication) => {
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updatedApplication.comments);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.get("/applications/:id/comments", jwtAuth, (req, res) => {
  const applicationId = req.params.id;

  Application.findById(applicationId)
    .select("comments")
    .populate({
      path: "comments.userId",
      model: "User",
      select: "name", // Customize fields to retrieve from the User model
    })
    .then((application) => {
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application.comments);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});



// cancelling chat
// conversations
// router.post('/', async (req,res) => {
//   const newConversation = new Conversation({
//       members: [req.body.senderId , req.body.receiverId]
//   });

//   try{
//       const savedConversation = await newConversation.save()
//       res.status(200).json(savedConversation)
//   }catch(err){
//       res.status(500).json(err)
//   }
// });

// // get conv of a user

// router.get('/:userId',async (req,res) => {
//   try{
//       const conversation = await Conversation.find({
//         members: { $all: [senderId, receiverId]},
//       });
//       res.status(200).json(conversation);
//   }catch(err){
//     res.status(500).json(err);
//   }
// });

// // add

// router.post("/", async (req,res) => {
//   const newMessage = new Message(req.body)

//   try{
//       const savedMessage = await newMessage.save()
//       res.status(200).json(savedMessage)
//   }catch(err){
//     res.status(500).json(err)
//   }
// });

// // get

// router.get("/:conversationId",async(req,res) => {
//   try{
//     const messages = await Message.find({
//       conversationId:req.params.conversationId, 
//     });
//     res.status(200).json(messages);
//   }catch(err){
//     res.status(500).json(err);
//   }
// })

module.exports = router;