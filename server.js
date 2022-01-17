const { log } = require('console')
const express=require('express')
const bodyParser = require('body-parser')
const Router = require('./noderouter')
const app=express()

//暴露公共访问资源
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : false}))
app.use(Router)
app.listen(3000,()=>{
  console.log('http://localhost:3000')
})