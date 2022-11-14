const { prisma } = require('./index.js');
const topicModel = require('./topicModel.js');
const quizModel = require('./quizModel.js');
const userModel = require('./userModel.js');

const createSubject = async (req) => {
  const {
    title,
    description,
    isPublished,
    createdById,
    lastUpdatedById,
    type
  } = req;
  const subject = await prisma.subject.create({
    data: {
      title,
      description,
      isPublished,
      createdAt: new Date(Date.now()),
      lastUpdatedAt: new Date(Date.now()),
      createdById,
      lastUpdatedById,
      type
    },
    include: {
      topics: true,
      topics: {
        include: {
          steps: true
        }
      },
      quizzes: true,
      quizzes: {
        include: {
          questions: true
        }
      },
      createdBy: true,
      lastUpdatedBy: true,
      usersAssigned: true
    }
  });
  return subject;
};

const getAllSubjects = async () => {
  const subjects = await prisma.subject.findMany({
    include: {
      topics: true,
      topics: {
        include: {
          steps: true
        }
      },
      quizzes: true,
      quizzes: {
        include: {
          questions: true
        }
      },
      createdBy: true,
      lastUpdatedBy: true,
      usersAssigned: true,
      usersAssigned: {
        include: {
          user: true
        }
      }
    }
  });
  return subjects;
};

const getSubjectById = async (req) => {
  const { id } = req;
  const subject = await prisma.subject.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      topics: true,
      topics: {
        include: {
          steps: true
        }
      },
      quizzes: true,
      quizzes: {
        include: {
          questions: true
        }
      },
      createdBy: true,
      lastUpdatedBy: true,
      usersAssigned: true,
      usersAssigned: {
        include: {
          user: true
        }
      }
    }
  });
  subject.topics.sort((a, b) => {
    return a.subjectOrder - b.subjectOrder;
  });
  subject.quizzes.sort((a, b) => {
    return a.subjectOrder - b.subjectOrder;
  });
  return subject;
};

const getSubjectByTitle = async (req) => {
  const { title } = req;
  const subject = await prisma.subject.findUnique({
    where: {
      title
    }
  });
  return subject;
};

const updateSubject = async (req) => {
  const {
    id,
    title,
    description,
    isPublished,
    completionRate,
    lastUpdatedById,
    type
  } = req;
  const subject = await prisma.subject.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      isPublished,
      completionRate,
      lastUpdatedById,
      lastUpdatedAt: new Date(Date.now()),
      type
    },
    include: {
      topics: true,
      topics: {
        include: {
          steps: true
        }
      },
      quizzes: true,
      quizzes: {
        include: {
          questions: true
        }
      },
      createdBy: true,
      lastUpdatedBy: true,
      usersAssigned: true,
      usersAssigned: {
        include: {
          user: true
        }
      }
    }
  });
  return subject;
};

const deleteSubject = async (req) => {
  const { id } = req;
  const topicsUnderSubject = await topicModel.getAllTopicsBySubjectId({
    subjectId: id
  });
  for (let t of topicsUnderSubject) {
    topicModel.deleteTopic({ id: t.id });
  }
  const quizzesUnderSubject = await quizModel.getAllQuizzesBySubjectId({
    subjectId: id
  });
  for (let q of quizzesUnderSubject) {
    quizModel.deleteQuiz({ id: q.id });
  }
  await prisma.subject.update({
    where: {
      id: Number(id)
    },
    data: {
      topics: {
        deleteMany: {}
      },
      quizzes: {
        deleteMany: {}
      },
      usersAssigned: {
        deleteMany: {}
      }
    }
  });
  await prisma.subject.delete({
    where: {
      id: Number(id)
    }
  });
};

const connectOrCreateEmployeeSubjectRecord = async (req) => {
  const { subjectId, userId, completionRate } = req;
  const employeeSubjectRecord = await prisma.EmployeeSubjectRecord.upsert({
    where: {
      subjectId_userId: {
        subjectId,
        userId
      }
    },
    update: {
      completionRate
    },
    create: {
      subjectId,
      userId,
      completionRate
    },
    include: {
      subject: true,
      user: true
    }
  });
  return employeeSubjectRecord;
};

const disconnectOrRemoveEmployeeSubjectRecord = async (req) => {
  const { subjectId, userId } = req;
  const employeeSubjectRecord = await prisma.EmployeeSubjectRecord.delete({
    where: {
      subjectId_userId: {
        subjectId,
        userId
      }
    }
  });
  return employeeSubjectRecord;
};

const assignUsersToSubject = async (req) => {
  const { id, users } = req;
  for (let u of users) {
    const user = await userModel.findUserById({ id: u.id });
    if (user) {
      await connectOrCreateEmployeeSubjectRecord({
        subjectId: id,
        userId: u.id,
        completionRate: 0
      });
    }
  }
  const subject = await getSubjectById({ id });
  return subject;
};

const unassignUsersToSubject = async (req) => {
  const { id, users } = req;
  for (let u of users) {
    const record = await getSubjectRecordBySubjectAndUser({
      subjectId: id,
      userId: u.id
    });
    if (record) {
      await disconnectOrRemoveEmployeeSubjectRecord({
        subjectId: id,
        userId: u.id
      });
    } else {
      continue;
    }
  }
  const subject = await getSubjectById({ id });
  subject.createdBy.password = '';
  subject.lastUpdatedBy.password = '';
  for (let u of subject.usersAssigned) {
    u.user.password = '';
  }
  return subject;
};

const updateSubjectCompletionRateBySubjectByEmployee = async (req) => {
  const { subjectId, userId, completionRate } = req;
  const employeeSubjectRecord = await connectOrCreateEmployeeSubjectRecord({
    subjectId,
    userId,
    completionRate
  });
  return employeeSubjectRecord;
};

const getSubjectRecordBySubjectAndUser = async (req) => {
  const { subjectId, userId } = req;
  const employeeSubjectRecord = await prisma.EmployeeSubjectRecord.findUnique({
    where: {
      subjectId_userId: {
        subjectId: Number(subjectId),
        userId: Number(userId)
      }
    },
    include: {
      subject: true,
      user: true
    }
  });
  return employeeSubjectRecord;
};

const getSubjectsAssignedByUserId = async (req) => {
  const { id } = req;
  const subjects = [];
  const { assignedSubjects } = await prisma.user.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      assignedSubjects: true,
      assignedSubjects: {
        include: {
          subject: true,
          subject: {
            include: {
              topics: true,
              topics: {
                include: {
                  steps: true
                }
              },
              quizzes: true,
              quizzes: {
                include: {
                  questions: true
                }
              }
            }
          }
        }
      }
    }
  });
  for (let s of assignedSubjects) {
    subjects.push(s.subject);
  }
  return subjects;
};

const getUsersAssignedBySubjectId = async (req) => {
  const { id } = req;
  let users = [];
  const { usersAssigned } = await prisma.subject.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      usersAssigned: true,
      usersAssigned: {
        include: {
          user: true
        }
      }
    }
  });
  for (let u of usersAssigned) {
    u.user.password = '';
    users.push(u.user);
  }
  return users;
};

exports.createSubject = createSubject;
exports.getAllSubjects = getAllSubjects;
exports.getSubjectById = getSubjectById;
exports.getSubjectByTitle = getSubjectByTitle;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
exports.assignUsersToSubject = assignUsersToSubject;
exports.unassignUsersToSubject = unassignUsersToSubject;
exports.updateSubjectCompletionRateBySubjectByEmployee =
  updateSubjectCompletionRateBySubjectByEmployee;
exports.getSubjectRecordBySubjectAndUser = getSubjectRecordBySubjectAndUser;
exports.getSubjectsAssignedByUserId = getSubjectsAssignedByUserId;
exports.getUsersAssignedBySubjectId = getUsersAssignedBySubjectId;
