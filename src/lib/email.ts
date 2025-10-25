import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

type MailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

async function getEmailConfig() {
  const settings = await db.setting.findMany({ where: { key: { in: ['emailSettings'] } } });
  const map = settings.reduce<Record<string, any>>((acc, s) => {
    acc[s.key] = s.type === 'JSON' ? JSON.parse(s.value) : s.value;
    return acc;
  }, {});

  const email = map.emailSettings || {};
  return {
    host: email.smtpHost,
    port: Number(email.smtpPort ?? 587),
    user: email.smtpUser,
    pass: email.smtpPassword,
    from: email.fromEmail || 'noreply@example.com',
  };
}

export async function sendMail(options: MailOptions) {
  const cfg = await getEmailConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error('SMTP не настроен');
  }
  
  console.log('Email config:', {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    from: cfg.from,
    secure: cfg.port === 465
  });

  // Try primary SMTP configuration first
  try {
    return await sendMailWithConfig(cfg, options);
  } catch (primaryError) {
    console.error('Primary SMTP failed:', primaryError);
    
    // Try fallback configurations
    const fallbackConfigs = getFallbackConfigs(cfg);
    
    for (const fallbackCfg of fallbackConfigs) {
      try {
        console.log('Trying fallback SMTP:', fallbackCfg.host);
        return await sendMailWithConfig(fallbackCfg, options);
      } catch (fallbackError) {
        console.error(`Fallback SMTP ${fallbackCfg.host} failed:`, fallbackError);
        continue;
      }
    }
    
    // If all fallbacks failed, throw the original error
    throw primaryError;
  }
}

async function sendMailWithConfig(cfg: any, options: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10, // max 10 messages per second
  });

  try {
    // Verify connection before sending
    await transporter.verify();
    console.log('SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('SMTP verification failed:', verifyError);
    throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
  }

  return transporter.sendMail({
    from: cfg.from,
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

function getFallbackConfigs(originalCfg: any) {
  const fallbacks = [];
  
  // If using Yandex IP, try Yandex domain
  if (originalCfg.host === '77.88.21.158' || originalCfg.host?.includes('yandex')) {
    fallbacks.push({
      ...originalCfg,
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false
    });
  }
  
  // If using Gmail, try alternative ports
  if (originalCfg.host?.includes('gmail')) {
    fallbacks.push({
      ...originalCfg,
      port: 465,
      secure: true
    });
  }
  
  // Try common SMTP servers
  const commonServers = [
    { host: 'smtp.yandex.ru', port: 587, secure: false },
    { host: 'smtp.gmail.com', port: 587, secure: false },
    { host: 'smtp.mail.ru', port: 587, secure: false },
  ];
  
  for (const server of commonServers) {
    if (server.host !== originalCfg.host) {
      fallbacks.push({
        ...originalCfg,
        ...server
      });
    }
  }
  
  return fallbacks;
}

export function renderOrderEmail(order: any) {
  const itemsHtml = (order.items || [])
    .map((it: any) => `<tr><td style="padding:8px;border:1px solid #eee">${it.product.title}</td><td style="padding:8px;border:1px solid #eee">${it.quantity}</td><td style="padding:8px;border:1px solid #eee">${Number(it.price).toFixed(2)}</td><td style="padding:8px;border:1px solid #eee">${Number(it.total).toFixed(2)}</td></tr>`) // basic inline table
    .join('');
  const html = `
  <div style="font-family:Arial,sans-serif;">
    <h2>Ваш заказ № ${order.orderNumber}</h2>
    <p>Спасибо за покупку! Мы свяжемся с вами для подтверждения.</p>
    <h3>Состав заказа</h3>
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Товар</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Кол-во</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Цена</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Сумма</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin-top:12px">Итого к оплате: <strong>${Number(order.total).toFixed(2)}</strong></p>
  </div>`;
  return html;
}

// Test email configuration
export async function testEmailConfig() {
  try {
    const cfg = await getEmailConfig();
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return { success: false, error: 'SMTP не настроен' };
    }

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    await transporter.verify();
    return { success: true, message: 'SMTP connection successful' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: getEmailSuggestions()
    };
  }
}

// Get alternative SMTP suggestions based on the current host
function getEmailSuggestions() {
  return {
    yandex: {
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false,
      note: 'Yandex SMTP (recommended for .ru domains)'
    },
    gmail: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      note: 'Gmail SMTP (requires app password)'
    },
    mailru: {
      host: 'smtp.mail.ru',
      port: 587,
      secure: false,
      note: 'Mail.ru SMTP'
    },
    outlook: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      note: 'Outlook/Hotmail SMTP'
    }
  };
}

export function renderAdminOrderEmail(order: any, extra?: { addressText?: string | null }) {
  const address = order.address || {};
  const items = order.items || [];
  const itemsRows = items
    .map(
      (it: any) =>
        `<tr>
          <td style="padding:6px;border:1px solid #eee">${it.product?.title || ''}</td>
          <td style="padding:6px;border:1px solid #eee">${it.selectedColor || it.variant?.color || ''}</td>
          <td style="padding:6px;border:1px solid #eee">${it.selectedSize || it.variant?.size || ''}</td>
          <td style="padding:6px;border:1px solid #eee">${it.quantity}</td>
          <td style="padding:6px;border:1px solid #eee">${Number(it.price).toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #eee">${Number(it.total).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const deliveryLabel =
    order.deliveryType === 'PICKUP' ? 'Самовывоз'
    : order.deliveryType === 'COURIER' ? 'Курьер'
    : order.deliveryType === 'TRANSPORT' ? 'Транспортная компания'
    : order.deliveryType || '-';

  const resolvedAddress = (extra?.addressText && extra.addressText.trim().length > 0)
    ? extra.addressText
    : [address.city, address.street, address.house, address.apartment].filter(Boolean).join(' ');

  const html = `
  <div style="font-family:Arial,sans-serif;">
    <h2>Новый заказ № ${order.orderNumber}</h2>
    <h3>Данные клиента</h3>
    <p><strong>Имя:</strong> ${order.firstName || ''} ${order.lastName || ''}</p>
    <p><strong>Компания:</strong> ${order.company || '-'}</p>
    <p><strong>Телефон:</strong> ${order.phone || '-'}</p>
    <p><strong>Email:</strong> ${order.email || '-'}</p>
    <p><strong>Комментарий:</strong> ${order.notes || '-'}</p>
    <p><strong>Тип доставки:</strong> ${deliveryLabel}</p>
    <h3>Адрес доставки</h3>
    <p>${resolvedAddress || '-'}</p>
    <h3>Состав заказа</h3>
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Товар</th>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Цвет</th>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Размер</th>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Кол-во</th>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Цена</th>
          <th style="padding:6px;border:1px solid #eee;text-align:left">Сумма</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <p style="margin-top:12px">Доставка: <strong>${Number(order.delivery).toFixed(2)}</strong></p>
    <p>Скидка: <strong>${Number(order.discount).toFixed(2)}</strong></p>
    <p>Итого: <strong>${Number(order.total).toFixed(2)}</strong></p>
  </div>`;
  return html;
}



