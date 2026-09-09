import { db } from "@/lib/db"
async function main(){
  const rows = await db.project.findMany({ select: { id:true, name:true, ownerId:true, createdAt:true } } as never)
  console.log("PROJECTS raw:", JSON.stringify(rows,null,2))
  const userIds = [...new Set(rows.map((r:any)=>r.ownerId))]
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id:true, email:true } })
  const have = new Set(users.map(u=>u.id))
  console.log("Have users for those ownerIds:", users)
  console.log("Orphan ownerIds:", userIds.filter(id=>!have.has(id)))
  for(const r of rows as any[]){
    const exists = have.has(r.ownerId)
    console.log(` - ${r.id} "${r.name}" ownerId=${r.ownerId} exists=${exists}`)
  }
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect())
