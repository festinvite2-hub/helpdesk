import { apiRequest, useMocks } from './client';
import { MOCK_ROUTING_RULES } from '../mocks/admin';

function normalizeRoutingRule(rule = {}) {
  const targetDepartment = rule.target_department ?? rule.department ?? {};

  return {
    ...rule,
    id: String(rule.id ?? rule.rule_id ?? ''),
    name: rule.name ?? rule.rule_name ?? '',
    keywords: Array.isArray(rule.keywords)
      ? rule.keywords
      : typeof rule.keywords === 'string'
        ? rule.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
        : [],
    rule_type: rule.rule_type ?? 'keyword',
    target_department: {
      ...targetDepartment,
      id: String(targetDepartment.id ?? targetDepartment.department_id ?? rule.target_department_id ?? ''),
      name: targetDepartment.name ?? targetDepartment.department_name ?? '',
      color: targetDepartment.color ?? '#3B82F6',
    },
    priority_override: rule.priority_override ?? null,
    sort_order: Number(rule.sort_order ?? 0),
    is_active: Boolean(rule.is_active ?? rule.active ?? true),
  };
}

function extractRoutingRules(response) {
  if (Array.isArray(response)) return response.map(normalizeRoutingRule);

  const list = [response?.rules, response?.routing_rules, response?.data?.rules, response?.data].find((item) => Array.isArray(item));

  return Array.isArray(list) ? list.map(normalizeRoutingRule) : [];
}

export async function getRoutingRules() {
  if (useMocks()) {
    return MOCK_ROUTING_RULES;
  }

  const response = await apiRequest('/routing-rules', {
    method: 'POST',
    body: JSON.stringify({ action: 'list' }),
  });

  return extractRoutingRules(response);
}

export async function createRoutingRule(ruleData, userId) {
  if (useMocks()) {
    return { success: true, rule: { id: `r${Date.now()}`, ...ruleData } };
  }

  return apiRequest('/routing-rules', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      user_id: userId,
      rule_data: ruleData,
    }),
  });
}

export async function updateRoutingRule(ruleData, userId) {
  if (useMocks()) {
    return { success: true, rule: { ...ruleData } };
  }

  return apiRequest('/routing-rules', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      user_id: userId,
      rule_data: ruleData,
    }),
  });
}

export async function deleteRoutingRule(ruleId, userId) {
  if (useMocks()) {
    return { success: true };
  }

  return apiRequest('/routing-rules', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      user_id: userId,
      rule_data: { id: ruleId },
    }),
  });
}

export async function testRouting(text) {
  if (useMocks()) {
    return null;
  }

  return apiRequest('/routing-rules/test', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
