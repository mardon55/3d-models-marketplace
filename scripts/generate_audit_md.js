import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const auditData = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/audit_result.json'), 'utf8'))
const results = auditData.results

let md = '# 1-BOSQICH AUDIT HISOBOTI: 3D GLB MODELLAR INVENTARIZATSIYASI\n\n'
md += '## 1. Umumiy ko\'rsatkichlar\n\n'
md += `- **Diskdagi jami GLB fayllar soni:** ${auditData.totalDiskGLBs} ta\n`
md += `- **Katalogdagi jami mahsulotlar soni:** ${auditData.totalProducts} ta\n`
md += `- **Muvaffaqiyatli ulangan haqiqiy GLB modellar:** ${results.filter(r => r.exists).length} ta\n`
md += `- **Mos GLB topilmagan (yo'q) mahsulotlar:** ${results.filter(r => !r.exists).length} ta\n\n`

md += '## 2. Mos GLB fayli bo\'lmagan mahsulotlar (Qoidaga asosan boshqa model qo\'yilmaydi)\n\n'
md += '| ID | Mahsulot nomi | Toifa | Holat | Tavsiya |\n'
md += '| :--- | :--- | :--- | :--- | :--- |\n'
for (const r of results.filter(r => !r.exists)) {
  let note = 'Diskda mos GLB topilmadi'
  if (r.id === 'mercedes') note = 'Diskda faqat Mercedes SL65 va AMG GT bor, G63 AMG yo\'q'
  if (r.id === 'villa') note = 'Diskda faqat suburban/commercial binolar bor, villa yo\'q'
  md += `| \`${r.id}\` | **${r.name}** | ${r.category} | ❌ GLB yo'q | ${note} |\n`
}

md += '\n## 3. Haqiqiy GLB ga ega barcha modellar ro\'yxati (Hajmi, Poligonlar, Tekstura va Skelet)\n\n'
md += '| # | Nomi | Toifa | GLB yo\'li | Hajmi | Uchburchaklar | Tekstura | Skelet/Suyak | Animatsiya |\n'
md += '| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |\n'

let idx = 1
for (const r of results.filter(r => r.exists)) {
  const info = r.info || {}
  const skinStr = info.hasSkin ? `Ha (${info.boneCount} ta suyak)` : 'Yo\'q'
  const animStr = info.hasAnimation ? `Ha (${info.animationCount} ta)` : 'Yo\'q'
  const trisStr = (info.triangleCount || 0).toLocaleString()
  md += `| ${idx++} | **${r.name}** | ${r.category} | \`${r.glbUrl}\` | **${info.sizeMB} MB** | ${trisStr} | ${info.textureCount || 0} ta | ${skinStr} | ${animStr} |\n`
}

fs.writeFileSync(path.join(rootDir, 'scripts/audit_report.md'), md)
console.log('Audit hisoboti scripts/audit_report.md ga muvaffaqiyatli saqlandi!')
