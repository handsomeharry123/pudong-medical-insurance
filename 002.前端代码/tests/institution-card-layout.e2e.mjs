import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3001/login');await page.getByPlaceholder('工号 / 手机号 / 姓名').fill('admin');await page.getByPlaceholder('请输入密码',{exact:true}).fill('admin');await page.getByRole('button',{name:'登 录',exact:true}).click();await page.waitForURL('**/portal');
 await page.goto('http://localhost:3001/app/modules/analysis/institution-profiles/PDYB-310115-002');await page.locator('.institution-business-card dd').last().waitFor();
 for(const [width,height] of [[1512,780],[1440,900],[1920,1080],[1280,720]]){await page.setViewportSize({width,height});await page.waitForTimeout(300);const bounds=await page.locator('.institution-business-card').evaluate(el=>{const dd=el.querySelector('dd:last-child'),r=dd.getBoundingClientRect();return {bottom:r.bottom,cardBottom:el.getBoundingClientRect().bottom,scroll:el.scrollHeight,client:el.clientHeight}});console.log(width,height,bounds);assert.ok(bounds.bottom<=height&&bounds.bottom<=bounds.cardBottom,JSON.stringify(bounds));assert.ok(bounds.scroll<=bounds.client+1);}
 console.log('PASS: complete address and card fields visible at all four desktop sizes');
}finally{await browser.close()}
