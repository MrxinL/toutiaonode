const experss =require('express');
const multer = require('multer');
const Router =experss.Router()
const path =require('path')

let OptPool =require('./model/Optpool.js')
Router.use('/uploads',experss.static(path.join(__dirname,'uploads')))

//上传设置
let storage = multer.diskStorage({
  destination:function (req,file,cb) {
    cb(null,'./uploads/')
    
  },
  filename: function(req,file,cb){
            //console.log(file.fieldname+'-'+Date.now()+path.extname(file.originalname),"******")
    cb(null,file.fieldname+'-'+Date.now()+path.extname(file.originalname))
  }
})

let upload =multer({storage:storage})





//创建线程池
let optpool = new OptPool();

let pool = optpool.getPool();

//解决跨域
Router.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');//允许所有源
  res.header('Access-Control-Allow-Methods','OPTIONS,PATCH,PUT,GET,PUT,DELETE');//复杂请求  简单请求
  res.header('Access-Control-Allow-Headers','Content-type,authorization');//添加请求头
  res.header('Access-Control-Allow-Credentials',true);//是否将请求暴露给网页
  next();
})

//登录
Router.post('/authorizations',(req,res)=>{
  let {mobile , code}=req.body
  
  if( code ==='123456'){
 // console.log(mobile,code)
      pool.getConnection(function(err,conn){
        let sql=`select *from users where mobile = ${mobile}`
        conn.query(sql,(err,result)=>{
          if(err){
            res.json(err)
          }else{
            if(result.length != 0){
                  res.json({
                    message:'ok',
                    data:{
                      id:result[0].id,
                      name:result[0].name,
                      mobile:result[0].mobile,
                      ptoto:result[0].ptoto,
                      token:result[0].token
                    }
                  })
            }
            else{
              res.status(999).json({
                message : '无此用户'
              }
                
              )
            }
          }
            conn.release();
        })
           
      })





  }else{
    res.status(400).json({
      message:'验证码错误'
    })
  }
})

//注册
Router.post('/registers',(req,res)=>{
        //获取前台发来的数据
        var user=req.body;
         
       
        if(user.code === '123456'){
             
              pool.getConnection(function(err,conn){
                let sql=`insert into users  values ('${user}')`;
                console.log(sql)
                conn.query(sql,(err)=>{
                  if(err){
                      res.json({
                        message:'我是'+err
                      })
                  }else{
                    res.status(200).json({
                    message:'添加成功'
                  })
                  }
                  
                });
                conn.release();

              })

        }else{
              res.status(400).json({
                message:'验证码输入错误或失效'
              })
        }
       
})

//获取个人的信息
Router.get('/user/profile',(req,res)=>{

  //验证token
  let Bearer ='Bearer ey9.mLitrKsn4E4KdtC8jU';
  if(Bearer){
    let token= Bearer.substring(7);
   
    pool.getConnection(function(err,conn){
       let sql = `select *from users where token = '${token}'`;
       
          conn.query(sql,(err,result)=>{
            if(err){
              res.json(err)
            }else{
              if(result.length !==0){
                res.json({
                      status:200,
                      message:'用户信息',
                      data:{
                        id:result[0].id,
                        name:result[0].name,
                        photo:result[0].photo,
                        mobile:result[0].mobile,
                        intro:result[0].intro,
                        email:result[0].email
                    
                      }
                })
              }else{
                res.status(403).json({
                  message:'查无此人'
                })
              }
            }
          })
    })
         

  }else{
    res.status(403).json({
      message:'token未传, 非法访问'
    })
  }
})

//评论
Router.get('/comments',(req,res)=>{
  console.log("计入评论")
  let query = req.query
  let page = query.page //当前页
  let per_page=query.per_page//每页几条
  let response_type=query.response_type//类型

  let start = (page-1)*per_page

  if(response_type ==='comment' && per_page==='4'){
        pool.getConnection(function(err,conn){
          let sql=`select count(*) from comment; select *from comment limit ${start},${per_page} `
          console.log(sql)
          conn.query(sql,(err,result)=>{
            if(err){
              res.json(err)
            }else{
              // console.log(result)
              // res.json(result)
              let total_count = result[0][0]['count(*)']
              res.json({
                message:'ok',
                data:{
                  total_count:total_count,
                  page:page,
                  per_page:per_page,
                  results:result[1]
                }
              })
              
            }
          })


        })
  }else{
    res.status(400).json({
      message:'请求参数错误'
    })
  }
})

//修改评论状态
Router.put('/comments/status',(req,res)=>{
  let id=req.query.article_id
  let status=req.body.allow_comment
  // console.log(id,status);
  pool.getConnection(function(err,conn){
    let sql =`update comment set comment_status=${status} where id=${id}`
    if(err){
      res.json(err)
    }else{
        conn.query(sql,(err,result)=>{
          if(err){
            res.json(err)
          }else{
            res.json({

              message:'ok'
            })
          }
        })
    }
  })
  
})

//素材管理  图片上传
Router.post('/user/images',upload.single('image'),(req,res)=>{
      //   console.log(req.file)
      //  console.log(req.file.path,"----------")
      pool.getConnection(function(err,conn){
        let sql=`insert into material(url) values("http://localhost:3000/${req.file.path.replace('\\','/')}")`
        console.log(sql)
        if(err){
          res.json(err)
        }else{
            conn.query(sql,(err,result)=>{
              if(err){
                res.json(err)
              }else{
                res.json({
                  
                  message:'ok',
                  data:{
                    id:result.insertId,
                    url:`http://localhost:3000/${req.file.path}`
                  }
                })
              }
            })
        }
      })
})

//获取素材
Router.get('/user/images',(req,res)=>{
  let query=req.query;
  let page=query.page;
  let per_page=query.per_page;

  let collect = eval(query.collect.toLowerCase()) ? 1 : 0
  //console.log(eval(query.collect.toLowerCase()) )
  let start =(page -1)* per_page
       // console.log(typeof per_page)
  if(per_page === '4'){
    
       let sql='';
       if(collect){
         
         sql=`select count(*) from material where is_collected=${collect};select *from material where is_collect=${collect} order by id desc limit ${start},${per_page}`
       }else{
         
         sql=`select count(*) from material ; select * from material order by id desc limit ${start},${per_page}`
       }
       pool.getConnection(function(err,conn){
         //console.log(sql+'777777777777777777')
          conn.query(sql,(err,result)=>{
            if(err){
              res.json(err)
            }else{
              console.log(result[1])
              let total_count =result[0][0]['count(*)']
              res.json({
                message:'ok',
                data:{
                  total_count:total_count,
                  page:page,
                  per_page:per_page,
                  result:result[1]

                }
              })
            }
            conn.release()
       })
       })
      
  }else{
    res.status(400).json({
      message:'请求参数错误'
    })
  }

})

//删除图
Router.delete('/user/images/:target',(req,res)=>{
  // console.log(req.params.target)
  let target=req.params.target
  pool.getConnection(function(err,conn){
    let sql=`delete from material where id=${target}`
    if(err){
      res.json(err)
    }
      conn.query(sql,(err,result)=>{
          if(err){
            res.json(err)
          }else{
            res.json({
              messagel:'ok'
            })
          }
      })
      conn.release()
    
  })
})

//修改图
Router.put('/user/images/:target',(req,res)=>{
          let target=req.params.target
          let collect = req.body.collect ? 1 : 0
          pool.getConnection(function(err,conn){
            let sql =`update material set is_collected=${collect} where id=${target}`
            conn.query(sql,(err,result)=>{
                if(err){
                  res.json(err)
                }else{
                  res.json({
                    message:'ok'
                  })
                }
            })
            conn.release()
          })
})

//个人信息修改
Router.patch('/user/profile',(req,res)=>{
        let {id ,name , mobile ,intro , email} =req.body
        console.log(req.body)
        pool.getConnection(function(err,conn){
          let sql=`update users set name='${name}',mobile='${mobile}',intro='${intro}',email='${email}' where id=${id }`
         console.log(sql)
          conn.query(sql,(err,conn)=>{
            if(err){
              res.json(err)
            }else{
              res.json({
                message:'OK'
              })
            }
          })
          conn.release()
       
        })
})

Router.patch('/user/photo',upload.single('photo'),(req,res)=>{
  pool.getConnection(function(err,conn){
    let sql =`update users set photo='http://localhost:3000/${req.file.path.replace('\\','/')}' where id=1`
    console.log(sql)
    conn.query(sql,(err)=>{
      if(err){
        res.json(err)
      }else{
        res.json({
          message:'ok'
        })
      }
    })
  })
})

module.exports = Router;