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
  
  // apply for a job [todo: test: done]
  router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
    const user = req.user;
    if (user.type != "applicant") {
      res.status(401).json({
        message: "You don't have permissions to apply for a job",
      });
      return;
    }
    const data = req.body;
    const jobId = req.params.id;
  
    // check whether applied previously
    // find job
    // check count of active applications < limit
    // check user had < 10 active applications && check if user is not having any accepted jobs (user id)
    // store the data in applications
  
    Application.findOne({
      userId: user._id,
      jobId: jobId,
      status: {
        $nin: ["deleted", "accepted", "cancelled"],
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
        res.json(400).json(err);
      });
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