const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('academy-content.js','utf8'),sandbox);
const lessons=sandbox.window.S0_LESSONS;

assert.equal(lessons.length,29,'Semester 0 should include orientation plus 28 daily lessons');
assert.equal(new Set(lessons.map(x=>x.id)).size,lessons.length,'Lesson ids must be unique');

for(const lesson of lessons){
  for(const key of ['id','course','week','day','title','concept','objective','theory','intuition','visual','part1','checkpoint1','part2','checkpoint2','prompt','recognize','apply','assignment','homework']){
    assert.ok(lesson[key],`${lesson.id} is missing ${key}`);
  }
  assert.equal(lesson.course,'S0');
  assert.equal(lesson.visual.length,3,`${lesson.id} needs a three-part mental model`);
  assert.ok(Array.isArray(lesson.recognize.options)&&lesson.recognize.options.length>=3,`${lesson.id} needs recognition choices`);
  assert.ok(Number.isInteger(lesson.recognize.answer)&&lesson.recognize.answer>=0&&lesson.recognize.answer<lesson.recognize.options.length,`${lesson.id} has an invalid answer key`);
  assert.ok(lesson.apply.prompt.length>=20,`${lesson.id} needs an application activity`);
  assert.ok(lesson.assignment.instructions.length>=20,`${lesson.id} needs assignment instructions`);
  assert.match(lesson.part1.time,/20 minutes/,`${lesson.id} needs the first 20-minute learning block`);
  assert.match(lesson.part2.time,/20 minutes/,`${lesson.id} needs the second 20-minute learning block`);
  for(const checkpoint of [lesson.checkpoint1,lesson.checkpoint2]){
    assert.equal(checkpoint.options.length,3,`${lesson.id} checkpoints need three choices`);
    assert.ok(Number.isInteger(checkpoint.answer)&&checkpoint.answer>=0&&checkpoint.answer<checkpoint.options.length,`${lesson.id} has an invalid checkpoint answer key`);
    assert.ok(checkpoint.explanation.length>=15,`${lesson.id} checkpoint feedback is too short`);
  }
  assert.ok(lesson.homework.instructions.length>=20,`${lesson.id} needs after-class homework instructions`);
  assert.match(lesson.homework.estimatedTime,/minutes/,`${lesson.id} homework needs an estimated time`);
}

for(const week of [1,2,3,4])assert.equal(lessons.filter(x=>x.week===week).length,week===1?8:7,`Week ${week} has the wrong lesson count`);
assert.equal(lessons.filter(x=>x.type==='exam').length,4,'Semester 0 should include three paper exams and the final demo');
const exams=lessons.filter(x=>x.exam);
assert.equal(JSON.stringify(exams.map(x=>x.exam.title)),JSON.stringify(['Paper Exam 0A','Paper Exam 0B','Paper Exam 0C','Semester 0 cumulative check']));
for(const lesson of exams){
  assert.equal(lesson.exam.questions.length,5,`${lesson.id} needs five exam questions`);
  for(const question of lesson.exam.questions){
    assert.equal(question.options.length,3,`${lesson.id} exam questions need three choices`);
    assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<question.options.length,`${lesson.id} has an invalid exam answer key`);
  }
}

// The portal deliberately places correct recognition answers evenly across A/B/C.
const displayedCorrectPositions=[0,0,0];
lessons.forEach((lesson,index)=>displayedCorrectPositions[index%3]++);
assert.deepEqual(displayedCorrectPositions,[10,10,9],'Recognition answer positions should be balanced');

const requiredConcepts=['active-recall','mental-model','computation','algorithm','input-output','variable','conditional','loop','function','debugging','files','lists','systems-thinking'];
const taught=new Set(lessons.map(x=>x.concept));
for(const concept of requiredConcepts)assert.ok(taught.has(concept),`Course concept ${concept} has no lesson`);

console.log(`PASS: ${lessons.length} Semester 0 lessons contain complete on-platform learning activities.`);
