export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({ok:false,error:"Nur GET ist erlaubt."});
  const key=process.env.OPENAI_API_KEY;
  return res.status(key?200:500).json({
    ok:Boolean(key),
    ai:Boolean(key),
    message:key ? "Massiv-KI ist serverseitig bereit." : "OPENAI_API_KEY fehlt in Vercel."
  });
}