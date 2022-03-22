const experss = require('express');
const multer = require('multer');
const Router = experss.Router()
const path = require('path')

let OptPool = require('./model/Optpool.js')
Router.use('/uploads', experss.static(path.join(__dirname, 'uploads')))

//上传设置
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')

  },
  filename: function (req, file, cb) {
    //console.log(file.fieldname+'-'+Date.now()+path.extname(file.originalname),"******")
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

let upload = multer({ storage: storage })


//创建线程池
let optpool = new OptPool();

let pool = optpool.getPool();

//解决跨域
Router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');//允许所有源
  res.header('Access-Control-Allow-Methods', 'OPTIONS,PATCH,PUT,GET,PUT,DELETE');//复杂请求  简单请求
  res.header('Access-Control-Allow-Headers', 'Content-type,authorization');//添加请求头
  res.header('Access-Control-Allow-Credentials', true);//是否将请求暴露给网页
  next();
})

//登录
Router.post('/authorizations', (req, res) => {
  let { mobile, code } = req.body

  if (code) {
    pool.getConnection(function (err, conn) {
      let sql = `select * from users where mobile = '${mobile}'`
      conn.query(sql, (err, result) => {
        if (err) {
          res.json(err)
        } else {
          if (result && result[0].password == code) {
            res.json({
              message: 'ok',
              data: {
                id: result[0].id,
                name: result[0].name,
                mobile: result[0].mobile,
                ptoto: result[0].ptoto,
                token: result[0].token,
                quanxian: result[0].quanxian
              }
            })
          }
          else {
            res.status(999).json({
              message: '密码错误'
            })
          }
        }
        conn.release();
      })

    })

  }
  else {
    res.status(400).json({
      message: '密码错误'
    })
  }
})

//注册
Router.post('/registers', (req, res) => {
  //获取前台发来的数据
  var { name, mobile, quanxian, token } = req.body;
  pool.getConnection(function (err, conn) {
    let sql = `insert into users (name, mobile, quanxian, token, password) values ('${name}', '${mobile}', '${quanxian}', '${token}', '123456')`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '添加成功'
        })
      }

    });
    conn.release();
  })
})

//获取个人的信息
Router.get('/user/profile', (req, res) => {
  const { token } = req.query;
  //验证token
  let Bearer = `Bearer ${token}`;
  if (Bearer) {
    let token = Bearer.substring(7);
    pool.getConnection(function (err, conn) {
      let sql = `select *from users where token = '${token}'`;

      conn.query(sql, (err, result) => {
        if (err) {
          res.json(err)
        } else {
          if (result.length !== 0) {
            res.json({
              status: 200,
              message: '用户信息',
              data: {
                id: result[0].id,
                name: result[0].name,
                photo: result[0].photo,
                mobile: result[0].mobile,
                intro: result[0].intro,
                email: result[0].email,
                quanxian: result[0].quanxian
              }
            })
          } else {
            res.status(403).json({
              message: '查无此人'
            })
          }
        }
      })
    })
  } else {
    res.status(403).json({
      message: 'token未传, 非法访问'
    })
  }
})

//评论
// Router.get('/comments',(req,res)=>{
//   let query = req.query
//   let page = query.page //当前页
//   let per_page=query.per_page//每页几条
//   let response_type=query.response_type//类型

//   let start = (page-1)*per_page

//   if(response_type ==='comment' && per_page==='4'){
//         pool.getConnection(function(err,conn){
//           let sql=`select count(*) from comment; select *from comment limit ${start},${per_page} `
//           conn.query(sql,(err,result)=>{
//             if(err){
//               res.json(err)
//             }else{

//               let total_count = result[0][0]['count(*)']
//               res.json({
//                 message:'ok',
//                 data:{
//                   total_count:total_count,
//                   page:page,
//                   per_page:per_page,
//                   results:result[1]
//                 }
//               })

//             }
//           })


//         })
//   }else{
//     res.status(400).json({
//       message:'请求参数错误'
//     })
//   }
// })

//修改评论状态
// Router.put('/comments/status',(req,res)=>{
//   let id=req.query.article_id
//   let status=req.body.allow_comment

//   pool.getConnection(function(err,conn){
//     let sql =`update comment set comment_status=${status} where id=${id}`
//     if(err){
//       res.json(err)
//     }else{
//         conn.query(sql,(err,result)=>{
//           if(err){
//             res.json(err)
//           }else{
//             res.json({

//               message:'ok'
//             })
//           }
//         })
//     }
//   })

// })

//素材管理  图片上传
// Router.post('/user/images',upload.single('image'),(req,res)=>{

//       pool.getConnection(function(err,conn){
//         let sql=`insert into material(url) values("http://localhost:3000/${req.file.path.replace('\\','/')}")`

//         if(err){
//           res.json(err)
//         }else{
//             conn.query(sql,(err,result)=>{
//               if(err){
//                 res.json(err)
//               }else{
//                 res.json({

//                   message:'ok',
//                   data:{
//                     id:result.insertId,
//                     url:`http://localhost:3000/${req.file.path}`
//                   }
//                 })
//               }
//             })
//         }
//       })
// })

// //获取素材
// Router.get('/user/images',(req,res)=>{
//   let query=req.query;
//   let page=query.page;
//   let per_page=query.per_page;

//   let collect = eval(query.collect.toLowerCase()) ? 1 : 0
//   let start =(page -1)* per_page
//   if(per_page === '4'){

//        let sql='';
//        if(collect){

//          sql=`select count(*) from material where is_collected=${collect};select *from material where is_collect=${collect} order by id desc limit ${start},${per_page}`
//        }else{

//          sql=`select count(*) from material ; select * from material order by id desc limit ${start},${per_page}`
//        }
//        pool.getConnection(function(err,conn){
//           conn.query(sql,(err,result)=>{
//             if(err){
//               res.json(err)
//             }else{
//               let total_count =result[0][0]['count(*)']
//               res.json({
//                 message:'ok',
//                 data:{
//                   total_count:total_count,
//                   page:page,
//                   per_page:per_page,
//                   result:result[1]

//                 }
//               })
//             }
//             conn.release()
//        })
//        })

//   }else{
//     res.status(400).json({
//       message:'请求参数错误'
//     })
//   }

// })

// //删除图
// Router.delete('/user/images/:target',(req,res)=>{
//   let target=req.params.target
//   pool.getConnection(function(err,conn){
//     let sql=`delete from material where id=${target}`
//     if(err){
//       res.json(err)
//     }
//       conn.query(sql,(err,result)=>{
//           if(err){
//             res.json(err)
//           }else{
//             res.json({
//               messagel:'ok'
//             })
//           }
//       })
//       conn.release()

//   })
// })

// //修改图
// Router.put('/user/images/:target',(req,res)=>{
//           let target=req.params.target
//           let collect = req.body.collect ? 1 : 0
//           pool.getConnection(function(err,conn){
//             let sql =`update material set is_collected=${collect} where id=${target}`
//             conn.query(sql,(err,result)=>{
//                 if(err){
//                   res.json(err)
//                 }else{
//                   res.json({
//                     message:'ok'
//                   })
//                 }
//             })
//             conn.release()
//           })
// })

//个人信息修改
Router.patch('/user/profile', (req, res) => {
  let { id, name, mobile, intro, email } = req.body
  pool.getConnection(function (err, conn) {
    let sql = `update users set name='${name}',mobile='${mobile}',intro='${intro}',email='${email}' where id=${id}`
    conn.query(sql, (err, conn) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: 'OK'
        })
      }
    })
    conn.release()

  })
})

Router.patch('/user/photo', upload.single('photo'), (req, res) => {
  pool.getConnection(function (err, conn) {
    let sql = `update users set photo='http://localhost:3000/${req.file.path.replace('\\', '/')}' where id=1`
    conn.query(sql, (err) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: 'ok'
        })
      }
    })
    conn.release()
  })
})


Router.get('/banjichaxun', (req, res) => {
  const { token } = req.query
  let sql = `select * from banji where token = '${token}'`;
  pool.getConnection(function (err, conn) {
    conn.query(sql, (err, result) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: 'ok',
          data: result
        })
      }
    })
    conn.release();
  })
})

Router.post('/banjia/add', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { inputtime, inputbanji, inputxueke, token } = message;
  // if(user.code === '123456'){
  console.log(token)
  pool.getConnection(function (err, conn) {
    let sql = `insert into banji (time, name, address, token) values('${inputtime}', '${inputbanji}', '${inputxueke}','${token}')`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '添加成功'
        })
      }
    });
    conn.release();
  })

})


Router.post('/banjia/delete', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id } = message;
  pool.getConnection(function (err, conn) {
    let sql = `delete from banji where id = '${id}'`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功'
        })
      }
    });
    conn.release();
  })

})

Router.post('/banjia/update/get', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id } = message;
  pool.getConnection(function (err, conn) {
    let sql = `select * from banji where id = '${id}'`
    conn.query(sql, (err, result) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
          data: result
        })
      }
    });
    conn.release();
  })
})
Router.post('/banjia/update', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id, time, name, address } = message;
  pool.getConnection(function (err, conn) {
    let sql = `update banji set time='${time}',name='${name}',address='${address}' where id='${id}'`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
        })
      }
    });
    conn.release();
  })
})

// 业绩信息 
Router.get('/yejishow', (req, res) => {
  const { token } = req.query
  console.log(token)
  let sql = `select * from students where token = '${token}'`;
  pool.getConnection(function (err, conn) {
    conn.query(sql, (err, result) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: 'ok',
          data: result
        })
      }
    })
    conn.release();
  })
})

// 申诉业绩查询
Router.get('/yejishengfu/get', (req, res) => {

  let sql = `select * from students where shensu = 1`;
  pool.getConnection(function (err, conn) {
    conn.query(sql, (err, result) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: 'ok',
          data: result
        })
      }
    })
    conn.release();
  })
})

// 获取所有教师的角色 
Router.get('/user/ALL', (req, res) => {

  let sql = `select * from users where quanxian = 0`;
  pool.getConnection(function (err, conn) {
    conn.query(sql, (err, result) => {
      if (err) {
        res.json(err)
      } else {
        res.json({
          message: '成功',
          data: result
        })
      }
    })
    conn.release();
  })
})

Router.post('/user/deletejiaoshi', (req, res) => {

  var message = req.body;
  const { id } = message;
  pool.getConnection(function (err, conn) {
    let sql = `delete from users where id = '${id}'`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功'
        })
      }
    });
    conn.release();
  })
})
Router.post('/yejishow/add', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { name, phone, xueke, Xid, banji, token } = message;
  pool.getConnection(function (err, conn) {
    let sql = `insert into students (name, phone, xueke, Xid, banji, token) values('${name}', '${phone}', '${xueke}', '${Xid}','${banji}', '${token}')`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '添加成功'
        })
      }
    });
    conn.release();
  })

})
Router.post('/yejishow/delete', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id } = message;
  pool.getConnection(function (err, conn) {
    let sql = `delete from students where id = '${id}'`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功'
        })
      }
    });
    conn.release();
  })

})
Router.post('/yejishow/update', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id, phone, name, banji } = message;
  pool.getConnection(function (err, conn) {
    let sql = `update students set phone='${phone}',name='${name}',banji='${banji}' where id='${id}'`;
    conn.query(sql, (err) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
        })
      }
    });
    conn.release();
  })
})
Router.post('/yejishow/update/get', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { id } = message;
  console.log(id)
  pool.getConnection(function (err, conn) {
    let sql = `select * from students where id = '${id}'`
    conn.query(sql, (err, result) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
          data: result
        })
      }
    });
    conn.release();
  })
})

// 同意申诉
Router.post('/yeji/agree', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const {id ,sstoken} = message;
  pool.getConnection(function (err, conn) {
    let sql = `update students set token='${sstoken}', shensu=0 where id = '${id}'`
    conn.query(sql, (err, result) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
          data: result
        })
      }
    });
    conn.release();
  })
})
// 精准查询
Router.post('/yijifind/find', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { name } = message;
  console.log(name)
  pool.getConnection(function (err, conn) {
    let sql = `select * from students where name = '${name}'`
    conn.query(sql, (err, result) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
          data: result
        })
      }
    });
    conn.release();
  })
})

Router.post('/yijifind/shensu', (req, res) => {

  //获取前台发来的数据
  var message = req.body;
  const { 0: { name, yuanyin, token}, sstoken } = message;
  console.log(message)
  pool.getConnection(function (err, conn) {
    let sql = `update students set shensu=${1}, yuanyin= '${yuanyin}', sstoken='${sstoken}' where name = '${name}'`;
    conn.query(sql, (err, result) => {
      if (err) {
        res.json({
          message: '我是' + err
        })
      } else {
        res.status(200).json({
          message: '成功',
          data: result
        })
      }
    });
    conn.release();
  })

})
module.exports = Router;