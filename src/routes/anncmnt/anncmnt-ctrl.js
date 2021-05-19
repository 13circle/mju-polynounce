const anncmntCtrl = {};

anncmntCtrl.lmsCourseAnncmnt = (req, res) => {
  const { kjkey } = req.params;
  res.status(200).send("GET .../anncmnt/lms-course/" + kjkey);
};

anncmntCtrl.lmsAnncmnt = (req, res) => {
  res.status(200).send("GET .../anncmnt/lms");
};

anncmntCtrl.eclassCourseAnncmnt = (req, res) => {
  const { courseNum } = req.params;
  res.status(200).send("GET .../anncmnt/eclass-course/" + courseNum);
};

anncmntCtrl.eclassAnncmnt = (req, res) => {
  res.status(200).send("GET .../anncmnt/eclass");
};

module.exports = anncmntCtrl;
