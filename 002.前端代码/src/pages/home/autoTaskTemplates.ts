export type AutoTaskTemplate = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  frequency: {
    type: 'cycle' | 'interval' | 'once';
    cyclePeriod?: 'day' | 'week' | 'month';
    cycleTime?: string;
    intervalValue?: number;
    intervalUnit?: 'hour' | 'minute';
  };
};

export const autoTaskTemplates: AutoTaskTemplate[] = [
 {id:'daily-supervision-brief',name:'每日监管动态简报',description:'每日汇总机构风险等级变化、新增超期检查和检查进度预警。',prompt:'生成每日监管动态简报，汇总全区机构风险等级变化、新增超期检查和检查进度预警，并标注数据来源。',frequency:{type:'cycle',cyclePeriod:'day',cycleTime:'08:30'}},
 {id:'overdue-check-alert',name:'超期检查预警推送',description:'定期扫描阶段停留时长，识别超期检查并生成预警。演示模板按15分钟轮询，实时事件触发待后端接入。',prompt:'查询停留时间超过阶段办理时限的检查，汇总批次、机构、承办部门与停留天数，生成超期预警。',frequency:{type:'interval',intervalValue:15,intervalUnit:'minute'}},
 {id:'monthly-supervision-report',name:'本月监管进度汇总报告',description:'每月汇总上月检查完成情况、风险等级变化和超期统计。',prompt:'汇总上月检查完成情况、机构风险等级变化和超期检查统计，生成监管进度汇总报告。',frequency:{type:'cycle',cyclePeriod:'month',cycleTime:'09:00'}},
];

export function getAutoTaskTemplate(id?: string | null) {
  if (!id) return undefined;
  return autoTaskTemplates.find((template) => template.id === id);
}
