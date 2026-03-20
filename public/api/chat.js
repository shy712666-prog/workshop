export default async function handler(req, res) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从环境变量读取key和地址，不硬编码
  const API_KEY = process.env.OPENAI_API_KEY;
  const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com';

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages, model, temperature, max_tokens, type } = req.body;

    // 根据不同功能模块构建system prompt
    let systemPrompt = '';

    if (type === 'setting') {
      systemPrompt = `你是一个专业的创意设定生成器。用户会给你方向、关键词或风格要求，你需要生成详细、有想象力、可以直接使用的设定内容。包括但不限于世界观、背景、势力、规则、氛围等。输出要有结构感但不要死板，像是一个有经验的创作者在构思。用中文输出。`;
    } else if (type === 'name') {
      systemPrompt = `你是一个角色命名专家。根据用户给出的条件（语言/文化圈、性别、风格等）生成角色名。每个名字附带简短的含义或来源说明。名字要有质感，不要烂大街的。一次生成10个左右，用中文解释但名字本身按要求的语言来。`;
    } else {
      systemPrompt = `你是一个创意助手，帮助用户进行创作相关的工作。用中文回答。`;
    }

    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages || [])
      ],
      temperature: temperature ?? 0.85,
      max_tokens: max_tokens || 2000
    };

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({
        error: `API request failed: ${response.status}`,
        detail: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      detail: error.message
    });
  }
}
