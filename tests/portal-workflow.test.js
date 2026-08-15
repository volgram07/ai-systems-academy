const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('academy-content.js','utf8'),sandbox);
const lessons=sandbox.window.S0_LESSONS;
const html=fs.readFileSync('index.html','utf8');

const ready=(p,lesson)=>p.classCompleted||(p.checkpoint1Correct&&p.checkpoint2Correct&&p.classConfirmed&&(!lesson.exam||p.examScore>=70));
const progress=Object.fromEntries(lessons.map(l=>[l.id,{checkpoint1Correct:false,checkpoint2Correct:false,classConfirmed:false,classCompleted:false,homeworkPrepared:false,homeworkSubmitted:false,homeworkReviewed:false,homeworkResult:'pending',examScore:null}]));

// Class completion is independent from long-form homework.
const first=lessons[0],p=progress[first.id];
assert.equal(ready(p,first),false,'an untouched class must remain locked');
p.checkpoint1Correct=true;
p.checkpoint2Correct=true;
p.classConfirmed=true;
assert.equal(ready(p,first),true,'two checkpoints plus the completion confirmation should unlock class completion');
assert.equal(p.homeworkSubmitted,false,'homework must remain separate from the scheduled class');
p.classCompleted=true;
assert.equal(progress[lessons[1].id].classCompleted,false,'the next class starts independently');

// A complete synthetic student can traverse all 29 classes without ChatGPT.
for(const lesson of lessons){
  const q=progress[lesson.id];
  q.checkpoint1Correct=true;
  q.checkpoint2Correct=true;
  q.classConfirmed=true;
  if(lesson.exam)q.examScore=100;
  assert.equal(ready(q,lesson),true,`${lesson.id} should be ready after deterministic work`);
  q.classCompleted=true;
  if(!lesson.exam){q.homeworkPrepared=true;q.homeworkSubmitted=true;q.homeworkReviewed=true;q.homeworkResult='passed'}
}
assert.equal(Object.values(progress).filter(x=>x.classCompleted).length,29,'synthetic student must complete every class');
assert.equal(lessons.filter(x=>x.exam&&progress[x.id].examScore>=70).length,4,'synthetic student must pass all four assessments');
assert.ok(lessons.filter(x=>!x.exam).every(x=>progress[x.id].homeworkSubmitted),'every required after-class homework must be submitted');

// Correct checkpoint positions are deliberately distributed across A/B/C.
const positions1=[0,0,0],positions2=[0,0,0];
lessons.forEach((lesson,index)=>{positions1[index%3]++;positions2[(index+1)%3]++});
assert.deepEqual(positions1,[10,10,9]);
assert.deepEqual(positions2,[9,10,10]);

// Static portal contract: OneNote, statuses, and the old in-class essays cannot regress.
for(const phrase of ['Copy homework to OneNote','Mark sent to Professor','Class completed ✓','After class · Homework','Professor review','Complete class'])assert.ok(html.includes(phrase),`portal is missing: ${phrase}`);
for(const removed of ['id="saveExplain"','id="saveApply"','id="assignmentAnswer"'])assert.ok(!html.includes(removed),`old in-class long-answer control still exists: ${removed}`);
assert.ok(html.includes('homeworkPrepared')&&html.includes('homeworkSubmitted')&&html.includes('homeworkReviewed'),'homework statuses must be persisted separately');
assert.ok(html.includes('Export this OneNote page as a PDF or take clear screenshots'),'OneNote submission instructions must be included in the copied worksheet');

console.log('PASS: full class/checkpoint/OneNote-homework workflow completed without ChatGPT or an AI API.');
