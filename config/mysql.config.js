mysql={
  host:'localhost',
  port:3306,
  user:'root',
  password:'lx597162712',
  database:'toutiao',
  connectionLimit: 10000,
  multipleStatements:true //一次执行多个sql语句
}
module.exports = mysql