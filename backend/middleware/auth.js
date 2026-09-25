import jwt from 'jsonwebtoken'; import User from '../models/User.js';
export async function protect(req,res,next){try{const token=req.headers.authorization?.replace('Bearer ',''); if(!token) return res.status(401).json({success:false,message:'Authentication required'}); const {id}=jwt.verify(token,process.env.JWT_SECRET); req.user=await User.findById(id); if(!req.user)return res.status(401).json({success:false,message:'Account unavailable'}); if(req.user.status!=='approved')return res.status(403).json({success:false,message:`Account is ${req.user.status}. Administrator approval is required.`}); next()}catch(e){res.status(401).json({success:false,message:'Your session is invalid or has expired'})}}
// Product requests are allowed for guests; attach a verified user when a token exists.
export async function optionalProtect(req,res,next){
  const token=req.headers.authorization?.replace('Bearer ','');
  if(!token) return next();
  try { const {id}=jwt.verify(token,process.env.JWT_SECRET); const user=await User.findById(id); if(user?.status==='approved') req.user=user; } catch {}
  next();
}
export const allow=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({success:false,message:'Insufficient permissions'});
