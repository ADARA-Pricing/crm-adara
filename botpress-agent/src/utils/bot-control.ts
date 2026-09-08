import { Chat, configuration, secrets } from '@botpress/runtime'
import { checkBotControl } from './control-policy'
import { plainSalesText } from './plain-text'

export async function canBotReply(conversationId: string): Promise<boolean> {
  return checkBotControl(configuration.crmApiBaseUrl || 'https://crm-adara.vercel.app', secrets.CRM_WEBHOOK_SECRET, conversationId)
}

// Recheck each outgoing message, including a generation already underway when the
// operator pauses. A message already accepted by the channel cannot be recalled.
export class ControlledChat extends Chat {
  private controlledConversationId: string
  constructor(context: ConstructorParameters<typeof Chat>[0]) {
    super(context)
    this.controlledConversationId = context.conversation?.id || ''
  }
  override async sendMessage(message: Parameters<Chat['sendMessage']>[0]) {
    if (!this.controlledConversationId || !(await canBotReply(this.controlledConversationId))) {
      throw new Error('CRM: automatic reply paused or control unavailable')
    }
    const payload = message.payload
    if (message.type === 'text' && typeof payload?.text === 'string') {
      return super.sendMessage({ ...message, payload: { ...payload, text: plainSalesText(payload.text) } })
    }
    if (message.type === 'markdown' && typeof payload?.markdown === 'string') {
      return super.sendMessage({ ...message, type: 'text', payload: { text: plainSalesText(payload.markdown) } })
    }
    return super.sendMessage(message)
  }
}
